import { OTP_QUEUE } from "@/common";
import { OtpThrottleGuard } from "@/common/guards/otp.throttle.guard";
import { UserModule } from "@/schema/user/user.modules";
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { otpProcessor } from "./services/otp.processor.service";

@Module({
    imports: [
        UserModule,
        BullModule.registerQueue({
            name: OTP_QUEUE,
            defaultJobOptions: {
                attempts: 2,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: true,
                removeOnFail: false,
            }
        })
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        otpProcessor,
        {
            provide: APP_GUARD,
            useClass: OtpThrottleGuard
        }],
    exports: []
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply().forRoutes()
    }
}