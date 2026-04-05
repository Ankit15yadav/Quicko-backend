import { Public } from '@/common/decorators';
import { PhoneNumberGuard } from '@/common/guards/phone-number.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
  Version,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { SendOtpDto } from '../dto/sendOtp.dto';
import { VerifyOtpBodyDto, VerifyOtpQueryDto } from '../dto/verifyOtp.dto';
import { AuthService } from '../services/auth.service';

@Controller('/login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Version('1')
  @Post('/send-otp')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(PhoneNumberGuard)
  @SkipThrottle({ default: true })
  @Throttle({
    'otp-rate-limiter': { ttl: 50_000, limit: 4 },
  })
  async sendOtp(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    sendOtpDto: SendOtpDto,
  ) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Public()
  @Version('1')
  @Post('/verify-otp')
  @SkipThrottle({ default: true, 'otp-rate-limiter': true })
  @Throttle({ 'verify-rate-limiter': { limit: 3, ttl: 60_000 } })
  async verifyOtp(
    @Query(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    query: VerifyOtpQueryDto,

    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: VerifyOtpBodyDto,
  ) {
    return this.authService.verifyOtp(query.phoneNumber, body.otp);
  }

  @Public()
  @Post('/token/refresh')
  async RefreshToken(@Body() token: RefreshTokenDto) {
    this.authService.refreshToken(token);
  }

  // work as the handshake call to check if the current access token is valid or not ,
  // the logic of validating is in the JwtAuthGuard.
  @Get('/validate')
  async ValidateToken() {
    return true;
  }

  @Get('/a1')
  async a1() {
    return true;
  }

  @Get('/a2')
  async a2() {
    return true;
  }

  @Get('/a3')
  async a3() {
    return true;
  }
}
