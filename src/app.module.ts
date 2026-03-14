import { DynamicModule, Module, } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppRoutingModule } from './app.routing.module';
import { ParseDateOptions } from './common/pipes/parse-date.pipe';
import { APP_CONFIG } from './config/app.config';
import { rateLimitPresets } from './config/throttle.config';
import { AuthModule } from './modules/auth/auth.module';
import { JobsController } from './modules/jobs/jobs.controller';
import { RedisModule } from './redis/redis.module';
import { TwilioModule } from './twilio/twilio.module';

enum StoreType {
  MEMORY = 'memory',
  FILE = 'file',
}

const DEFAULT_STORE_NANE = 'DEFAULT_CACHE';
const DEFAULT_STORE_TYPE = StoreType.MEMORY


@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [APP_CONFIG],
      envFilePath: ['.env'],
      isGlobal: true,
      ignoreEnvFile: false
    }),
    AuthModule,
    ThrottlerModule.forRoot(rateLimitPresets),
    AppRoutingModule,
    RedisModule,
    TwilioModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB.URI'),
      })
    })
  ],
  controllers: [JobsController],
  providers: [{
    provide: 'STORE_OPTIONS',
    useValue: {
      storeName: DEFAULT_STORE_NANE,
      storeType: DEFAULT_STORE_TYPE
    }
  },
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
  {
    provide: ParseDateOptions,
    useValue: {
      fromTimeStamp: false,
      errorMsg: 'Date trans failed',
    },
  },
  ]
})
// dynamic module with registration
export class AppModule {
  static register(): DynamicModule {
    return { module: AppModule, providers: [] }
  }
}
