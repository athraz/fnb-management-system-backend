import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const message = response.locals.message;

    return next.handle().pipe(
      map((data) => {
        return {
          status: true,
          message: message || 'Request was successful',
          data,
        };
      }),
      catchError((error) => {
        if (error instanceof UnauthorizedException) {
          return new Observable((observer) => {
            observer.next({
              status: false,
              message: error.message || 'Token is missing', // This can be customized per your needs
              data: null,
            });
            observer.complete();
          });
        }

        return new Observable((observer) => {
          observer.next({
            status: false,
            message: error.message || 'Unknown error',
            data: null,
          });
          observer.complete();
        });
      }),
    );
  }
}
