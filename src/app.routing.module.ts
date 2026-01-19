import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { APP_ROUTES } from "./core/routing/app.routes";

@Module({
    imports: [RouterModule.register(APP_ROUTES)],
    exports: [RouterModule]
})
export class AppRoutingModule { }