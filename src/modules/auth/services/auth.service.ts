import {
  DEFAULT_OTP_EXPIRY_TIME,
  FIVE_MINUTES,
  MAX_OTP_ATTEMPTS,
  MAX_OTP_VALUE,
  MIN_OTP_VALUE,
  OTP_QUEUE,
  SEND_OTP,
  TOKEN_SYNC_QUEUE,
} from '@/common/constants';
import { REDIS_CLIENT } from '@/redis-v2/redis-v2.module';
import { User } from '@/schema/user';
import {
  createCryptoHash,
  generateKey,
  GenerateOtp,
  generateToken,
  getPhoneNumber,
  thirtyDaysFromNow,
  validateHash,
} from '@/utils';
import { InjectQueue } from '@nestjs/bullmq';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';

import { decodedJwtPayload } from '@/common/interface';
import { TokenFamily } from '@/schema/token';
import { ThrottlerException } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { SendOtpDto } from '../dto/sendOtp.dto';

interface OtpPayload {
  otp: string;
  attempts: number;
}

@Injectable()
export class AuthService {
  #accessTokenSecret!: string;
  #refreshTokenSecret!: string;

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(TokenFamily.name)
    private TokenFamilyModel: Model<TokenFamily>,
    @InjectQueue(OTP_QUEUE)
    private otpQueue: Queue,
    @InjectQueue(TOKEN_SYNC_QUEUE)
    private tokenSyncQueue: Queue,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private configService: ConfigService,
  ) {
    this.#accessTokenSecret = this.configService.get<string>(
      'SECRET.ACCESS_TOKEN',
    )!;
    this.#refreshTokenSecret = this.configService.get<string>(
      'SECRET.REFRESH_TOKEN',
    )!;
  }

  public async sendOtp(body: SendOtpDto) {
    const { phoneNumber } = body;
    const phoneNumberToUse = getPhoneNumber(phoneNumber, '+91');
    const otpKey = generateKey('otp', phoneNumber);
    const minTtl = 5;

    const timeToLive = await this.redis.ttl(otpKey);
    if (timeToLive >= minTtl) {
      throw new UnauthorizedException('TOO MANY REQUESTS');
    }

    const OTP = GenerateOtp(phoneNumberToUse, MAX_OTP_VALUE, MIN_OTP_VALUE);
    const { otp, hashWithExpiryTime } = OTP;

    const payLoad: OtpPayload = {
      otp: hashWithExpiryTime,
      attempts: 0,
    };

    await Promise.all([
      this.redis.set(
        otpKey,
        JSON.stringify(payLoad),
        'EX',
        DEFAULT_OTP_EXPIRY_TIME,
      ),
      this.otpQueue.add(SEND_OTP, { phoneNumber: phoneNumberToUse, otp }),
    ]);

    return {
      message: 'REQUEST ACCEPTED',
      success: true,
    };
  }

  public async verifyOtp(
    phoneNumber: string,
    otp: string,
    deviceName: string,
    deviceLocation: string,
  ) {
    const phoneNumberToUse = getPhoneNumber(phoneNumber, '+91');
    const INITIAL_TOKEN_VERSION = 1;

    const otpKey = generateKey('otp', phoneNumber);
    const hashingData = `${phoneNumberToUse}.${otp}`;

    const familyId = randomUUID();

    let cachedOtp = (await this.redis.get(otpKey)) ?? '';
    if (!cachedOtp) {
      throw new HttpException('OTP expired', HttpStatus.GONE);
    }

    const parsedOtp = JSON.parse(cachedOtp) as OtpPayload;
    const [storedOtp, otpGenerationTime] = parsedOtp.otp.split('.');
    const hashedOtp = createCryptoHash(hashingData);

    const otpValidationTime = Date.now();
    const verificationTimeDifference =
      otpValidationTime - Number(otpGenerationTime);

    if (verificationTimeDifference > FIVE_MINUTES) {
      throw new HttpException('OTP expired', HttpStatus.GONE);
    }

    if (parsedOtp.attempts >= MAX_OTP_ATTEMPTS) {
      await this.redis.del(otpKey);
      throw new ThrottlerException('TOO MANY REQUESTS');
    }

    const isValid = validateHash(storedOtp, hashedOtp);

    if (!isValid) {
      parsedOtp.attempts += 1;
      const ttl = await this.redis.ttl(otpKey);
      const expiryTime = ttl > 0 ? ttl : DEFAULT_OTP_EXPIRY_TIME;
      await this.redis.set(otpKey, JSON.stringify(parsedOtp), 'EX', expiryTime);
      throw new UnauthorizedException('Invalid OTP', {
        description: 'AUTHORIZATION FAILED',
      });
    }

    const [user] = await Promise.all([
      this.userModel.findOneAndUpdate(
        { phoneNumber: phoneNumberToUse },
        {
          $set: { isLoggedIn: true, lastLoginAt: new Date() },
          $setOnInsert: {
            phoneNumber: phoneNumberToUse,
            createdAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' },
      ),
      this.redis.del(otpKey),
    ]);

    if (user.isNewUser) {
      //TODO: Trigger onboarding message to the user
    }

    const payLoad: decodedJwtPayload = {
      name: user.name,
      phoneNumber: user?.phoneNumber,
      userId: user?._id,
      familyId,
      tokenVersion: INITIAL_TOKEN_VERSION,
    };

    await this.TokenFamilyModel.create({
      familyId,
      deviceName,
      deviceLocation,
      userId: user?._id,
      tokenVersion: INITIAL_TOKEN_VERSION,
    });

    const { accessToken, refreshToken } = generateToken(
      payLoad,
      this.#accessTokenSecret,
      this.#refreshTokenSecret,
    );

    if (!accessToken || !refreshToken)
      throw new Error('Token generation failed — secrets missing');

    return {
      message: 'OTP VERIFIED SUCCESSFULLY',
      data: {
        isNewUser: user?.isNewUser,
        userId: user?._id,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    };
  }

  public async refreshToken({ refreshToken }: { refreshToken: string }) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        this.#refreshTokenSecret,
      ) as decodedJwtPayload;

      if (!decoded) throw new UnauthorizedException('Invalid refresh token');

      const { familyId, tokenVersion } = decoded ?? {};

      const tokenFamilyData = await this.TokenFamilyModel.findOne({
        familyId,
      })
        .select('tokenVersion')
        .lean();

      if (!tokenFamilyData)
        throw new UnauthorizedException(
          'Session not found, please login again',
        );

      const { tokenVersion: storedTokenVersion } = tokenFamilyData ?? {};

      if (tokenVersion !== storedTokenVersion) {
        // chances that token have been compromised. Delete the family and force Logout the user
        await this.TokenFamilyModel.deleteOne({ familyId });
        throw new UnauthorizedException('Invalid Refresh Token');
      }

      const updatedTokenVersion = storedTokenVersion + 1;

      const newPayload: decodedJwtPayload = {
        name: decoded.name,
        phoneNumber: decoded.phoneNumber,
        userId: decoded.userId,
        familyId: decoded.familyId,
        tokenVersion: updatedTokenVersion,
      };

      const tokens = generateToken(
        newPayload,
        this.#accessTokenSecret,
        this.#refreshTokenSecret,
      );

      await this.TokenFamilyModel.updateOne(
        { familyId },
        {
          $set: {
            tokenVersion: updatedTokenVersion,
            lastUsedAt: new Date(),
            expiryTime: thirtyDaysFromNow(),
          },
        },
      );

      return {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw error;
    }
  }
}
