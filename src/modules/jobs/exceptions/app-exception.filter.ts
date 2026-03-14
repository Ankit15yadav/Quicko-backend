import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
    constructor(private httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let msg = "Internal Server Error"

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            msg = exception.message;
        }

        const { httpAdapter } = this.httpAdapterHost;

        const responePayload = {
            statusCode: status,
            timeStamp: new Date().toISOString(),
            message: msg,
        }

        httpAdapter.reply(ctx.getResponse(), responePayload, status)
    }
}