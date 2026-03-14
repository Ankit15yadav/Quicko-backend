import { PhoneNumberGuard } from "@/common/guards/phone-number.guard";
import { Body, Controller, HttpCode, HttpStatus, Post, Query, UseGuards, ValidationPipe, Version } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { SendOtpDto } from "../dto/sendOtp.dto";
import { AuthService } from "../services/auth.service";

@Controller('/login')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Version('1')
    @Post('/send-otp')
    @HttpCode(HttpStatus.ACCEPTED)
    @UseGuards(PhoneNumberGuard)
    @Throttle({
        'otp-rate-limiter': { ttl: 50_000, limit: 1 }
    })
    async sendOtp(
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true
            })) sendOtpDto: SendOtpDto,) {
        return this.authService.sendOtp(sendOtpDto);
    }

    @Version('1')
    @Post('/verify-otp')
    async verifyOtp(
        @Body()
        body: {
            otp: string;
        },
        @Query('phoneNumber') phoneNumber: string
    ) {
        return this.authService.verifyOtp(phoneNumber, body.otp);
    }
}
