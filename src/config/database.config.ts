import { registerAs } from "@nestjs/config";

export const DATABASE_CONFIG = registerAs("DATABASE", () => {
    return {
        USER: process.env['DATABASE_USER'],
        getUrl() {
            return `${this.USER}`
        }
    }
})