import { AUTH_ROUTES } from "@/modules/auth/auth.routes";
import { RouteTree } from "@nestjs/core";

export const APP_ROUTES: RouteTree[] = [...AUTH_ROUTES];
