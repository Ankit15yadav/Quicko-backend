import {
  DEFAULT_OTP_EXPIRY_TIME,
  FIVE_MINUTES,
  INDIA_COUNTRY_CODE,
  MAX_OTP_ATTEMPTS,
  MAX_OTP_VALUE,
  MIN_OTP_VALUE,
  OTP_QUEUE,
  REFRESH_TOKEN,
  SEND_OTP,
  TOKEN_SYNC_QUEUE,
} from '@/common/constants';
import { REDIS_CLIENT } from '@/redis-v2/redis-v2.module';
import { User } from '@/schema/user';
import {
  createCryptoHash,
  GenerateOtp,
  generateToken,
  validateHash,
} from '@/utils';
import { InjectQueue } from '@nestjs/bullmq';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ThrottlerException } from '@nestjs/throttler';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

import { Model } from 'mongoose';
import { SendOtpDto } from '../dto/sendOtp.dto';

interface OtpPayload {
  otp: string;
  attempts: number;
  isVerified?: boolean;
}

@Injectable()
export class AuthService implements OnModuleInit {
  #accessTokenSecret: string;
  #refreshTokenSecret: string;

  onModuleInit() {
    this.#accessTokenSecret = this.configService.get<string>(
      'SECRET.ACCESS_TOKEN',
    )!;
    this.#refreshTokenSecret = this.configService.get<string>(
      'SECRET.REFRESH_TOKEN',
    )!;
  }

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectQueue(OTP_QUEUE)
    private otpQueue: Queue,
    @InjectQueue(TOKEN_SYNC_QUEUE)
    private tokenSyncQueue: Queue,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private configService: ConfigService,
  ) {}

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

  public async verifyOtp(phoneNumber: string, otp: string) {
    const PHONE_NUMBER = `${INDIA_COUNTRY_CODE}${phoneNumber}`;
    const otpKey = `otp:${PHONE_NUMBER}`;
    const hashingData = `${PHONE_NUMBER}.${otp}`;

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

    const payLoad: JwtPayload = {
      name: user.name,
      phoneNumber: user?.phoneNumber,
      userId: user?._id,
    };

    const { accessToken, refreshToken } = generateToken(
      payLoad,
      this.#accessTokenSecret,
      this.#refreshTokenSecret,
    );

    await this.tokenSyncQueue.add(REFRESH_TOKEN, {
      userId: user._id,
      refreshToken,
    });

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
    const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;

    if (!decoded) throw new UnauthorizedException('Invalid refresh token');

    // Strip all JWT registered claims — only keep your custom fields
    const { iat, exp, nbf, iss, aud, sub, jti, ...payload } = decoded;

    console.log('token refreshed');

    const tokens = generateToken(
      payload,
      this.#accessTokenSecret,
      this.#refreshTokenSecret,
    );

    console.log('tokens: ', tokens);

    return tokens;
  }
}
