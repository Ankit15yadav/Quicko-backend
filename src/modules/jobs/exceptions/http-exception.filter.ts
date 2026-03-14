import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Request, Response } from "express";
import { promises as fs } from "fs";
import { join } from "path";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>()
        const status = exception.getStatus();
        const msg = exception.message;

        const body = {
            statusCode: status,
            timeStamp: new Date().toISOString(),
            message: msg,
            path: request.url,
        }

        this.wrtiteHttpLog(body)

        response.status(status).json(body);
    }

    private async wrtiteHttpLog(data: Record<string, any>) {
        const JOGS_DIR = join(__dirname, `${Date.now()}-log.json`)

        try {
            await fs.writeFile(JOGS_DIR, JSON.stringify(data), 'utf-8');
        } catch (err) {
            return;
        }
    }
}