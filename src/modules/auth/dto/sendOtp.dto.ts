import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class SendOtpDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    @MinLength(10)
    readonly phoneNumber: string
}