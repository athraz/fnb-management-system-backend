import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let responseMessage: string;

    if (typeof message === 'string') {
      responseMessage = message;
    } else if (typeof message === 'object' && (message as any).message) {
      responseMessage = (message as any).message;
    } else {
      responseMessage = 'Something went wrong';
    }

    response.status(status).json({
      status: false,
      message: responseMessage,
      data: null,
    });
  }
}
