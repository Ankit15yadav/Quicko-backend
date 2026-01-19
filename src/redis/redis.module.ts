import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-store';
import { RedisService } from './redis.service';

@Global()
@Module({
    imports: [
        CacheModule.registerAsync({
            useFactory: async () => ({
                store: await redisStore({
                    socket: {
                        host: 'localhost',
                        port: 6379,
                    },
                    ttl: 60000
                }),
            }),
            isGlobal: true,
        }),
    ],
    providers: [RedisService],
    exports: [CacheModule, RedisService],
})
export class RedisModule { }