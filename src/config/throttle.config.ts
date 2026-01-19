import { ThrottlerOptions } from "@nestjs/throttler";

export const rateLimitPresets: ThrottlerOptions[] = [
    { name: 'burst', ttl: 1_000, limit: 1 },
];
