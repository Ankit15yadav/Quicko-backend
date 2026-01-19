import { RedisService } from "@/redis/redis.service";
import { Body, Controller, Post, Version } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { SendOtpDto } from "../dto/sendOtp.dto";
import { AuthService } from "../services/auth.service";

@Controller('/login')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly redisService: RedisService) { }

    @Version('1')
    @Post('/send-otp')
    sendOTPV1(@Body() sendOtpDto: SendOtpDto) {
        return this.authService.sendOtp(sendOtpDto);
    }

    @Version('1')
    @SkipThrottle({ burst: true })
    @Post('verify-otp')
    async verifyOtp(
        @Body()
        body: {
            phone: string;
            otp: string;
        },
    ) {
        const cacheKey = `otp:verify:${body.phone}`;
        console.log('cachekey', cacheKey)

        // 1️⃣ Check cache
        const cachedResult = await this.redisService.get(cacheKey);
        console.log('cached result', cachedResult)
        if (cachedResult) {
            return {
                source: 'redis',
                ...cachedResult,
            };
        }

        await this.sleep(3500);

        const isValid = body.otp === '123456';

        const response = {
            phone: body.phone,
            verified: isValid,
            timestamp: Date.now(),
        };

        await this.redisService.set(cacheKey, response, 60000);

        return {
            source: 'fresh',
            ...response,
        };
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
