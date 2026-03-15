import { ThrottlerOptions } from "@nestjs/throttler";

export enum rateLimiterPresetNames {
    BURST = 'burst',
    OTP_RATE_LIMITER = 'otp-rate-limiter'
}

export const rateLimitPresets: ThrottlerOptions[] = [
    { name: 'burst', ttl: 60, limit: 2 },
    { name: 'otp-rate-limiter', ttl: 60, limit: 3 },
];
