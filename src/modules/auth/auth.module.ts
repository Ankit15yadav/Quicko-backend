import { UserModule } from "@/schema/user/user.modules";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";

@Module({
    imports: [UserModule],
    controllers: [AuthController],
    providers: [AuthService],
    exports: []
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply().forRoutes()
    }
}