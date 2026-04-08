import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class VerifyOtpQueryDto {
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10, { message: 'Phone number must be exactly 10 digits' })
  phoneNumber!: string;
}

export class VerifyOtpBodyDto {
  @IsNotEmpty()
  @IsNumberString()
  @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
  otp!: string;
}
