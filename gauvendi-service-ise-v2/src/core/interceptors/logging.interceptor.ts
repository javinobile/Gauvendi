import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();
    const start = Date.now();

    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();
      const { method, url } = request;
      const ip = request.ip || request.connection.remoteAddress;
      const body = request?.body;

      this.logger.log(
        `Incoming Request: ${method} ${url} from ${ip} ${body ? 'with' + JSON.stringify(body) : ''}`
      );

      return next.handle().pipe(
        tap(() => {
          const duration = (Date.now() - start) / 1000; // convert to seconds
          const statusCode = response.statusCode;

          this.logger.log(`Response: ${method} ${url} - ${statusCode} - ${duration} seconds`);
        }),
        catchError((err) => {
          const duration = (Date.now() - start) / 1000; // convert to seconds
          const statusCode = err.status || 500;
          this.logger.error(`Error: ${err.message} - ${statusCode} - ${duration} seconds`);
          return throwError(() => err);
        })
      );
    }

    // Optional: Keep your RPC logging logic
    return next.handle();
  }
}
