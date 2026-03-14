import { INDIA_COUNTRY_CODE, MAX_OTP_VALUE, MIN_OTP_VALUE } from "@/common/constants";
import { RedisService } from "@/redis/redis.service";
import { User } from "@/schema/user";
import { TwilioService } from "@/twilio/twilio.service";
import { GenerateOtp } from "@/utils";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SendOtpDto } from "../dto/sendOtp.dto";

@Injectable()
export class AuthService {

    constructor(
        private readonly redisService: RedisService,
        @InjectModel(User.name)
        private userModel: Model<User>,
        private twilioService: TwilioService
    ) { }

    public async sendOtp(body: SendOtpDto) {
        const { phoneNumber } = body;

        const fullPhoneNumber = `${INDIA_COUNTRY_CODE}${phoneNumber}`
        const OTP = GenerateOtp(MAX_OTP_VALUE, MIN_OTP_VALUE)
        const messageResponse = await this.twilioService.sendOtpToMobileNumber(fullPhoneNumber, OTP)

        return {
            status: messageResponse.status,
            message: messageResponse,
            phone: fullPhoneNumber
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
