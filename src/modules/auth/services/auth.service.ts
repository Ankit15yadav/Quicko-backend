import { Injectable } from "@nestjs/common";
import { SendOtpDto } from "../dto/sendOtp.dto";

@Injectable()
export class AuthService {

    public sendOtp(body: SendOtpDto) {
        const { phoneNumber } = body
        if (!phoneNumber) return {
            error: 'phone Number is not presnet'
        }

        if (phoneNumber.length < 10 || phoneNumber.length > 10) return { error: 'phonenumber should be of length 10' }

        // SEND OTP LOGIC
        // CHECK USER EXISTS OR NOT
        // IF EXIST THEN DON'T SHOW THE ONBOARDING PAGE
        // MORE LOGIC

        return {
            status: 'success'
        }
    }
}
