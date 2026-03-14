import { DEFAULT_OTP_EXPIRY_TIME, INDIA_COUNTRY_CODE, MAX_OTP_VALUE, MIN_OTP_VALUE } from "@/common/constants";
import { REDIS_CLIENT } from "@/redis-v2/redis-v2.module";
import { RedisService } from "@/redis/redis.service";
import { User } from "@/schema/user";
import { TwilioService } from "@/twilio/twilio.service";
import { GenerateOtp } from "@/utils";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import Redis from "ioredis";
import { Model } from "mongoose";
import { SendOtpDto } from "../dto/sendOtp.dto";

@Injectable()
export class AuthService {

    constructor(
        private readonly redisService: RedisService,
        @InjectModel(User.name)
        private userModel: Model<User>,
        private twilioService: TwilioService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis
    ) { }

    public async sendOtp(body: SendOtpDto) {
        const { phoneNumber } = body;
        const PHONE_NUMBER = `${INDIA_COUNTRY_CODE}${phoneNumber}`
        const OTP = GenerateOtp(PHONE_NUMBER, MAX_OTP_VALUE, MIN_OTP_VALUE)

        const { otp, hashWithExpiryTime } = OTP;

        const payLoad = {
            otp: hashWithExpiryTime,
            attempts: 0,
            isVerified: false,
        }
        console.log(payLoad)
        await this.redis.set(`otp:${PHONE_NUMBER}`, JSON.stringify(payLoad), 'EX', DEFAULT_OTP_EXPIRY_TIME)
        // const messageResponse = await this.twilioService.sendOtpToMobileNumber(fullPhoneNumber, otp)

        const value = await this.redis.get(`otp:${PHONE_NUMBER}`)
        return {
            otp, hashWithExpiryTime, value,
        }
    }


    public async verifyOtp(phoneNumber: string, otp: string) {
        const otpKey = `otp:${phoneNumber}`;

        console.log('sent otp', otp)

        // Retrieve stored OTP from Redis
        const storedOtp = await this.redisService.get<string>(otpKey);
        console.log('stored', storedOtp)

        if (!storedOtp) {
            return {
                verified: false,
                error: 'OTP expired or not found'
            };
        }

        // Verify OTP
        if (storedOtp !== otp) {
            // Publish OTP failed event (fire and forget - don't block response)
            this.redisService.publish('otp-events', JSON.stringify({
                type: 'otp_failed',
                phoneNumber,
                reason: 'Invalid OTP',
                timestamp: Date.now()
            })).catch(err => console.error('Failed to publish otp_failed event:', err));

            return {
                verified: false,
                error: 'Invalid OTP'
            };
        }

        // OTP is valid - delete it from Redis (this must complete)
        await this.redisService.del(otpKey);

        // Publish OTP verified event (fire and forget - don't block response)
        this.redisService.publish('otp-events', JSON.stringify({
            type: 'otp_verified',
            phoneNumber,
            timestamp: Date.now()
        })).catch(err => console.error('Failed to publish otp_verified event:', err));

        // TODO: Generate JWT token, create user session, etc.

        return {
            verified: true,
            message: 'OTP verified successfully',
            phoneNumber
        };
    }
}
