import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
    private publisherClient: RedisClientType;
    private subscriberClient: RedisClientType;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    async onModuleInit() {
        // Initialize Redis clients for pub/sub
        this.publisherClient = createClient({
            socket: {
                host: 'localhost',
                port: 6379,
            },
        });

        this.subscriberClient = createClient({
            socket: {
                host: 'localhost',
                port: 6379,
            },
        });

        await this.publisherClient.connect();
        await this.subscriberClient.connect();

        console.log('Redis clients connected successfully');
    }

    // Cache operations
    async get<T>(key: string): Promise<T | undefined> {
        return await this.cacheManager.get<T>(key);
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        await this.cacheManager.set(key, value, ttl);
    }

    async del(key: string): Promise<void> {
        await this.cacheManager.del(key);
    }

    async reset(): Promise<void> {
        await this.cacheManager.clear()
    }

    // Pub/Sub operations
    async publish(channel: string, message: string): Promise<number> {
        return await this.publisherClient.publish(channel, message);
    }

    async subscribe(
        channel: string,
        callback: (message: string) => void,
    ): Promise<void> {
        await this.subscriberClient.subscribe(channel, callback);
    }

    async unsubscribe(channel: string): Promise<void> {
        await this.subscriberClient.unsubscribe(channel);
    }

    // List operations
    async lpush(key: string, value: string): Promise<number> {
        return await this.publisherClient.lPush(key, value);
    }

    async rpush(key: string, value: string): Promise<number> {
        return await this.publisherClient.rPush(key, value);
    }

    async lrange(key: string, start: number, stop: number): Promise<string[]> {
        return await this.publisherClient.lRange(key, start, stop);
    }

    // Hash operations
    async hset(key: string, field: string, value: string): Promise<number> {
        return await this.publisherClient.hSet(key, field, value);
    }

    async hget(key: string, field: string): Promise<string | null> {
        return await this.publisherClient.hGet(key, field);
    }

    async hgetall(key: string): Promise<Record<string, string>> {
        return await this.publisherClient.hGetAll(key);
    }
}