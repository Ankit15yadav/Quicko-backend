import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { rateLimitPresets } from './config/throttle.config';
import { APP_ROUTES } from './core/routing/app.routes';
import { AuthModule } from './modules/auth/auth.module';

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
    RouterModule.register(APP_ROUTES)
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
