import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class OtpThrottleGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {

        const id = req?.ips?.length ? req.ips[0] : req.ip;
        const phone = req.body?.phoneNumber ?? "unkown caller"

        return `${id}:${phone}`
    }

    protected throwThrottlingException(): Promise<void> {
        throw new HttpException(
            'Too many OTP requests for this number. Please wait before retrying.',
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}