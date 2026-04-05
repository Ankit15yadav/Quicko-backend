import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppRoutingModule } from './app.routing.module';
import { JwtAuthGuard } from './common/guards/jwt.auth.guard';
import { ParseDateOptions } from './common/pipes/parse-date.pipe';
import { APP_CONFIG } from './config/app.config';
import { AuthModule } from './modules/auth/auth.module';
import { JobsController } from './modules/jobs/jobs.controller';
import { RedisModuleV2 } from './redis-v2/redis-v2.module';
import { TwilioModule } from './twilio/twilio.module';

enum StoreType {
  MEMORY = 'memory',
  FILE = 'file',
}

const DEFAULT_STORE_NANE = 'DEFAULT_CACHE';
const DEFAULT_STORE_TYPE = StoreType.MEMORY;

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [APP_CONFIG],
      envFilePath: ['.env'],
      isGlobal: true,
      ignoreEnvFile: false,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
    }),
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 60000, limit: 2 },
        { name: 'otp-rate-limiter', ttl: 60000, limit: 3 },
        { name: 'verify-rate-limiter', ttl: 60000, limit: 4 },
      ],
    }),
    AppRoutingModule,
    RedisModuleV2,
    TwilioModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB.URI'),
      }),
    }),
  ],
  controllers: [JobsController],
  providers: [
    {
      provide: 'STORE_OPTIONS',
      useValue: {
        storeName: DEFAULT_STORE_NANE,
        storeType: DEFAULT_STORE_TYPE,
      },
    },
    {
      provide: ParseDateOptions,
      useValue: {
        fromTimeStamp: false,
        errorMsg: 'Date trans failed',
      },
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
// dynamic module with registration
export class AppModule {
  static register(): DynamicModule {
    return { module: AppModule, providers: [] };
  }
}
