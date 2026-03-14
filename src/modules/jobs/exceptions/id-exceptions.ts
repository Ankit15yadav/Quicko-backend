import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Response } from "express";

export class IdException extends Error {
    constructor(message?: string) {
        super(message ?? "Invalid expression")
    }
}

@Catch(IdException)
export class IdExceptionFilter implements ExceptionFilter {
    catch(exception: IdException, host: ArgumentsHost) {
        const body = {
            message: exception.message,
            error: "id error"
        }

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>()

        response.status(HttpStatus.BAD_REQUEST).json(body);
    }
}