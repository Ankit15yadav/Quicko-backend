import { PHONE_NUMBER_MIN_LENGTH } from '@/common/constants';
import { IsString, Length, Matches } from 'class-validator';

export class SendOtpDto {
    @IsString()
    @Length(PHONE_NUMBER_MIN_LENGTH, PHONE_NUMBER_MIN_LENGTH, {
        message: `Phone number must be exactly ${PHONE_NUMBER_MIN_LENGTH} digits`,
    })
    @Matches(/^[6-9]/, { message: 'Provide a valid Phone Number' })
    phoneNumber: string;
}