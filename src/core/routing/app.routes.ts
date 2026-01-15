import { RouteTree } from "@nestjs/core";
import { AuthModule } from "../../modules/auth/auth.module";

export const APP_ROUTES: RouteTree[] = [
    {
        path: '/auth',
        module: AuthModule
    }
];
