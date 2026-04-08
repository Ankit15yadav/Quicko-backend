import { OTP_QUEUE, TOKEN_SYNC_QUEUE } from '@/common';
import { TokenFamilyModule } from '@/schema/token/token.module';
import { UserModule } from '@/schema/user/user.modules';
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import {
  OtpProcessor,
  RefreshTokenSyncProcessor,
} from './services/processor.service';

@Module({
  imports: [
    UserModule,
    TokenFamilyModule,
    BullModule.registerQueue(
      {
        name: OTP_QUEUE,
        defaultJobOptions: {
          attempts: 2,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
      {
        name: TOKEN_SYNC_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 4000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpProcessor, RefreshTokenSyncProcessor],
  exports: [],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply().forRoutes();
  }
}
