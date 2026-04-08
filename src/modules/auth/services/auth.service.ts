import {
  DEFAULT_OTP_EXPIRY_TIME,
  FIVE_MINUTES,
  INDIA_COUNTRY_CODE,
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
  GenerateOtp,
  generateToken,
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

import { TokenFamily } from '@/schema/token';
import { ThrottlerException } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';
import { SendOtpDto } from '../dto/sendOtp.dto';

interface OtpPayload {
  otp: string;
  attempts: number;
  isVerified?: boolean;
}

export interface decodedJwtPayload {
  name: string;
  phoneNumber: string;
  userId: Types.ObjectId;
  familyId: string;
  tokenVersion: number;
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
    const PHONE_NUMBER = `${INDIA_COUNTRY_CODE}${phoneNumber}`;
    const otpKey = `otp:${PHONE_NUMBER}`;

    const existing = await this.redis.get(otpKey);
    if (existing) {
      this.redis.del(otpKey);
    }

    const OTP = GenerateOtp(PHONE_NUMBER, MAX_OTP_VALUE, MIN_OTP_VALUE);
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
      this.otpQueue.add(SEND_OTP, { phoneNumber: PHONE_NUMBER, otp }),
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
    const PHONE_NUMBER = `${INDIA_COUNTRY_CODE}${phoneNumber}`;
    const INITIAL_TOKEN_VERSION = 1;

    const otpKey = `otp:${PHONE_NUMBER}`;
    const hashingData = `${PHONE_NUMBER}.${otp}`;

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
        { phoneNumber: PHONE_NUMBER },
        {
          $set: { isLoggedIn: true, lastLoginAt: new Date() },
          $setOnInsert: {
            phoneNumber: PHONE_NUMBER,
            createdAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' },
      ),
      this.redis.del(otpKey),
    ]);

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

    return {
      message: 'OTP VERIFIED SUCCESSFULLY',
      data: {
        isNewUser: user?.isNewUser,
        userId: user?._id,
        tokens: {
          accessToken,
          refreshToken,
          ...payLoad,
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

      console.log('decode: ', decoded);

      if (!decoded) throw new UnauthorizedException('Invalid refresh token');

      const { familyId, tokenVersion } = decoded ?? {};

      const tokenFamilyData = await this.TokenFamilyModel.findOne({
        familyId,
      })
        .select('tokenVersion')
        .lean();

      console.log('token family data: ', tokenFamilyData);

      const { tokenVersion: storedTokenVersion } = tokenFamilyData ?? {};

      if (tokenVersion !== storedTokenVersion) {
        console.log('version mis match');
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

      console.log('new payload: ', newPayload);

      console.log(
        'secrets: ',
        this.#accessTokenSecret,
        this.#refreshTokenSecret,
      );

      const tokens = generateToken(
        newPayload,
        this.#accessTokenSecret,
        this.#refreshTokenSecret,
      );

      console.log('tokens: ', tokens);

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
      console.error(error);
      throw new UnauthorizedException('Token refresh fail');
    }
  }
}
