import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ResponseDto } from './response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T> | T> {
    return next.handle().pipe(
      map((data: T) => {
        const isHttpContext = context.getType() === 'http';
        if (!isHttpContext) return data;

        const response = context.switchToHttp().getResponse();
        if (
          response.hasHeader('Content-Type') &&
          response.getHeader('Content-Type') !== 'application/json'
        ) {
          return data;
        } 

        return {
          statusCode: response.statusCode,
          message: response.message || 'success',
          data
        } as ResponseDto<T>;
      }),
      catchError((err: any) => {
        return throwError(() => this.errorTransformer(err));
      })
    );
  }

  errorTransformer(err: any): HttpException {
    const statusCode = err.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR;
    const response = err.getResponse?.();
    const message = typeof response === 'string' ? response : response?.['message'] || err.message;
    const data = response?.['data'] || null;

    return new HttpException({ statusCode, message, data }, statusCode);
  }
}
