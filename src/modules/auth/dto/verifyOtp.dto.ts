import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(6)
    @MinLength(6)
    readonly otp: string
}