import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response as ExpressResponse } from 'express';
import { ResponseFormat } from './response-format.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseFormat<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<ExpressResponse>();
    const statusCode = response.statusCode;
    const path = request.url;

    return next.handle().pipe(
      map((data: T) => ({
        statusCode,
        message: this.getSuccessMessageByStatusCode(statusCode),
        data,
        timestamp: new Date().toISOString(),
        path,
      })),
    );
  }

  private getSuccessMessageByStatusCode(statusCode: number): string {
    return (
      {
        [HttpStatus.OK]: 'Operation completed successfully',
        [HttpStatus.CREATED]: 'Resource created successfully',
      }[statusCode] || 'Success'
    );
  }
}
