import { Body, Controller, Post, Version } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SendOtpDto } from "./dto/sendOtp.dto";
import { VerifyOtpDto } from "./dto/verifyOtp.dto";

@Controller('/auth/login')
export class AuthController {

    constructor(private authService: AuthService) { }
    @Version('1')
    @Post('/send-otp')
    sendOTPV1(@Body() sendOtpDto: SendOtpDto) {
        const response = this.authService.sendOtp(sendOtpDto)
        return response
    }

    @Version('2')
    @Post('/send-otp')
    sendOTPV2(@Body() sendOtpDto: SendOtpDto) {
        return {
            phone: sendOtpDto.phoneNumber,
            otp: 123321
        }
    }

    @Version('1')
    @Post('/verify-otp')
    verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return {
            send_otp: verifyOtpDto.otp
        }
    }
} 