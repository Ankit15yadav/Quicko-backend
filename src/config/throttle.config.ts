import { ThrottlerOptions } from "@nestjs/throttler";

export const rateLimitPresets: ThrottlerOptions[] = [
    { name: 'burst', ttl: 1_000, limit: 1 },
    { name: 'short', ttl: 10_000, limit: 5 },
    { name: 'medium', ttl: 60_000, limit: 20 },
];
