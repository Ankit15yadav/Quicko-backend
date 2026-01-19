import { RouteTree } from "@nestjs/core";
import { AuthModule } from "./auth.module";

export const AUTH_ROUTES: RouteTree[] = [
    {
        path: 'auth',
        module: AuthModule,
    }
]