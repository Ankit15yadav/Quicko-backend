import { Body, Controller, Post, Version } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { SendOtpDto } from "../dto/sendOtp.dto";
import { VerifyOtpDto } from "../dto/verifyOtp.dto";
import { AuthService } from "../services/auth.service";

@Controller('/login')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Version('1')
    @Throttle({ burst: { limit: 4, ttl: 1000 } })
    @Post('/send-otp')
    sendOTPV1(@Body() sendOtpDto: SendOtpDto) {
        return this.authService.sendOtp(sendOtpDto);
    }

    @Version('1')
    @SkipThrottle({ burst: true, })
    @Post('/verify-otp')
    verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return {
            otp: verifyOtpDto.otp,
        };
    }
}
