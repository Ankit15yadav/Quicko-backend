import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RecentSearchInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest() as Request;
    const { query } = request;
    const token = request.headers['authorization']?.split(' ')[1];

    return next.handle().pipe(
      tap((result) => {
        console.log('result: ', result, query, token);
      }),
    );
  }
}
