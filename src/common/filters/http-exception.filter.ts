import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomException } from '../exceptions/custom.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url: string }>();
    const timestamp = new Date().toISOString();
    const path = request.url;

    switch (true) {
      case exception instanceof HttpException: {
        const httpException = exception;
        const status = httpException.getStatus();

        const responseBody = httpException.getResponse();
        let errorMessage = 'Error occurred';

        if (typeof responseBody === 'object' && responseBody !== null) {
          const typedResponse = responseBody as Record<string, unknown>;
          if ('message' in typedResponse) {
            const message = typedResponse.message;
            if (Array.isArray(message)) {
              errorMessage =
                message.length > 0 ? String(message[0]) : errorMessage;
            } else {
              errorMessage = String(message);
            }
          }
        } else if (typeof responseBody === 'string') {
          errorMessage = responseBody;
        }

        return response.status(status).json({
          statusCode: status,
          message: errorMessage,
          timestamp,
          path,
        });
      }

      case exception instanceof CustomException: {
        const customException = exception;
        return response.status(customException.statusCode).json({
          statusCode: customException.statusCode,
          message: customException.message,
          timestamp,
          path,
        });
      }

      default:
        Logger.error('Unhandled exception: ', exception);
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          timestamp,
          path,
        });
    }
  }
}
