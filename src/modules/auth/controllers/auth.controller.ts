import { PhoneNumberGuard } from "@/common/guards/phone-number.guard";
import { Body, Controller, Post, UseGuards, ValidationPipe, Version } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { SendOtpDto } from "../dto/sendOtp.dto";
import { AuthService } from "../services/auth.service";

@Controller('/login')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Version('1')
    @Post('/send-otp')
    @UseGuards(PhoneNumberGuard)
    async sendOTPV1(
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true
            })) sendOtpDto: SendOtpDto,) {
        return this.authService.sendOtp(sendOtpDto);
    }

    @Version('1')
    @SkipThrottle({ burst: true })
    @Post('/verify-otp')
    async verifyOtp(
        @Body()
        body: {
            phoneNumber: string;
            otp: string;
        },
    ) {
        return this.authService.verifyOtp(body.phoneNumber, body.otp);
    }
}
