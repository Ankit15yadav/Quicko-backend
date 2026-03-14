import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    @MinLength(10)
    readonly phoneNumber: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(6)
    @MinLength(6)
    readonly otp: string
}