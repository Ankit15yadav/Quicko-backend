import { NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export function testing(req: Request, res: Response, next: NextFunction) {

    const userInfo = req.headers['']

}

export class UserAgentMiddleware implements NestMiddleware {
    use(req: any, res: any, next: (error?: any) => void) {
        throw new Error("Method not implemented.");
    }
}