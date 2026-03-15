import { PhoneNumberGuard } from "@/common/guards/phone-number.guard";
import { Body, Controller, HttpCode, HttpStatus, Post, Query, UseGuards, ValidationPipe, Version } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { SendOtpDto } from "../dto/sendOtp.dto";
import { VerifyOtpBodyDto, VerifyOtpQueryDto } from "../dto/verifyOtp.dto";
import { AuthService } from "../services/auth.service";

@Controller('/login')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Version('1')
    @Post('/send-otp')
    @HttpCode(HttpStatus.ACCEPTED)
    @UseGuards(PhoneNumberGuard)
    @SkipThrottle({ default: true, })
    @Throttle({
        'otp-rate-limiter': { ttl: 50_000, limit: 1 }
    })

    async sendOtp(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        sendOtpDto: SendOtpDto,

    ) {
        return this.authService.sendOtp(sendOtpDto);
    }

    @Version('1')
    @Post('/verify-otp')
    @SkipThrottle({ default: true, 'otp-rate-limiter': true })
    @Throttle({ 'verify-rate-limiter': { limit: 3, ttl: 60_000 } })

    async verifyOtp(
        @Query(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        query: VerifyOtpQueryDto,

        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        body: VerifyOtpBodyDto,
    ) {
        return this.authService.verifyOtp(query.phoneNumber, body.otp);
    }
}
