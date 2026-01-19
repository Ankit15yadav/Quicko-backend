import { DynamicModule, Module, } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppRoutingModule } from './app.routing.module';
import { rateLimitPresets } from './config/throttle.config';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './redis/redis.module';

enum StoreType {
  MEMORY = 'memory',
  FILE = 'file',
}

const DEFAULT_STORE_NANE = 'DEFAULT_CACHE';
const DEFAULT_STORE_TYPE = StoreType.MEMORY


@Module({
  imports: [
    AuthModule,
    ThrottlerModule.forRoot(rateLimitPresets),
    AppRoutingModule,
    RedisModule
  ],
  controllers: [],
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
  ]
})
// dynamic module with registration
export class AppModule {
  static register(): DynamicModule {
    return { module: AppModule, providers: [] }
  }
}
