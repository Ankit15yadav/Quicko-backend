import { Get, HttpStatus, Injectable, Ip, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";

@Injectable()
export class UserController {


    @Get()
    getProfile(@Req() req?: Request, @Res() res?: Response, @Ip() ip?: string) {
        const { params, query } = req ?? {}
        res?.status(HttpStatus.OK).json({
            name: 'ankit yadav'
        })
    }

}
