import { DEFAULT_OTP_EXPIRY_TIME, INDIA_COUNTRY_CODE, MAX_OTP_VALUE, MIN_OTP_VALUE, OTP_QUEUE, SEND_OTP } from "@/common/constants";
import { REDIS_CLIENT } from "@/redis-v2/redis-v2.module";
import { User } from "@/schema/user";
import { createCryptoHash, GenerateOtp } from "@/utils";
import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Queue } from 'bullmq';
import Redis from "ioredis";
import { Model } from "mongoose";
import { SendOtpDto } from "../dto/sendOtp.dto";

interface Payload {
    otp: string,
    attempts: number,
    isVerified: boolean
}
@Injectable()
export class AuthService {

    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
        @InjectQueue(OTP_QUEUE) private otpQueue: Queue,
        @Inject(REDIS_CLIENT) private readonly redis: Redis
    ) { }

    public async sendOtp(body: SendOtpDto) {
        const { phoneNumber } = body;
        const PHONE_NUMBER = `${INDIA_COUNTRY_CODE}${phoneNumber}`
        const otpKey = `otp:${PHONE_NUMBER}`

        const existing = await this.redis.get(otpKey);
        if (existing) {
            throw new ConflictException("An OTP was already sent. Please wait before retrying.");
        }

        const OTP = GenerateOtp(PHONE_NUMBER, MAX_OTP_VALUE, MIN_OTP_VALUE)
        const { otp, hashWithExpiryTime } = OTP;

        const payLoad: Payload = {
            otp: hashWithExpiryTime,
            attempts: 0,
            isVerified: false,
        }

        await Promise.all([
            await this.redis.set(otpKey, JSON.stringify(payLoad), 'EX', DEFAULT_OTP_EXPIRY_TIME),
            await this.otpQueue.add(SEND_OTP, { phoneNumber: PHONE_NUMBER, otp })
        ])

        return {
            message: "REQUEST ACCEPTED",
            success: true,
        }
    }


    public async verifyOtp(phoneNumber: string, otp: string) {

        const PHONE_NUMBER = `${INDIA_COUNTRY_CODE}${phoneNumber}`
        const otpKey = `otp:${PHONE_NUMBER}`;
        const data = `${PHONE_NUMBER}.${otp}`

        const cachedOtp = await this.redis.get(otpKey) ?? "";
        const parsedOtp = JSON.parse(cachedOtp) as Payload

        // const parsedOtp: string = cachedOtp ? JSON.parse(cachedOtp) : "";
        const [storedOtp, otpGenerationTime] = parsedOtp.otp.split('.');

        const HashedOtp = createCryptoHash(data)
        const [otpHash, otpValidationTime] = HashedOtp.split('.')

        if (!storedOtp) {
            return {
                verified: false,
                error: 'OTP expired or not found'
            };
        }

        if (storedOtp !== otpHash) {
            this.redis.publish('otp-events', JSON.stringify({
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

        await this.redis.del(otpKey);

        this.redis.publish('otp-events', JSON.stringify({
            type: 'otp_verified',
            phoneNumber,
            timestamp: Date.now()
        })).catch(err => console.error('Failed to publish otp_verified event:', err));

        return {
            verified: true,
            message: 'OTP verified successfully',
            phoneNumber
        };
    }
}
