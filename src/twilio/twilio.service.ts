import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Twilio } from "twilio";
import twilio from "twilio";

@Injectable()
export class TwilioService implements OnModuleInit {
    private twilioAuthToken: string | undefined;
    private twilioSid: string | undefined;
    private twilioPhoneNumber: string | undefined;
    private client: Twilio

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.twilioSid = this.configService.get<string>('TWILIO.SID');
        this.twilioAuthToken = this.configService.get<string>('TWILIO.AUTH_TOKEN')
        this.twilioPhoneNumber = this.configService.get<string>("TWILIO.PHONE")
        this.client = twilio(this.twilioSid, this.twilioAuthToken)
    }

    async sendOtpToMobileNumber(PhoneNumber: string, otp: string) {
        const response = await this.client.messages.create({
            from: this.twilioPhoneNumber,
            to: PhoneNumber,
            body: `Your OTP is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`
        });

        return response;
    }

}