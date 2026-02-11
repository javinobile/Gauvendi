import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API_LOGGER');

  private formatSize(sizeInBytes: number): string {
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(2)}MB`;
    }
    const sizeInKB = sizeInBytes / 1024;
    return `${sizeInKB.toFixed(2)}KB`;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();
    const start = Date.now();

    if (contextType === 'rpc') {
      const rpcCtx = context.switchToRpc();
      const data = rpcCtx.getData(); // payload gửi qua TCP
      const contextObj = rpcCtx.getContext();

      // Try different ways to get pattern/command
      const pattern =
        contextObj.pattern ||
        contextObj.cmd ||
        contextObj.command ||
        context.getHandler()?.name ||
        'unknown-pattern';

      const requestId = Math.random().toString(36).substring(7);

      // Calculate payload size
      const payloadSize = JSON.stringify(data).length;
      const payloadSizeFormatted = this.formatSize(payloadSize);
      const maxSizeMB = 16; // RabbitMQ default max size
      const warningThresholdMB = 10; // Warn if approaching limit

      // Get controller and handler names
      const controllerName = context.getClass()?.name || 'unknown';
      const handlerName = context.getHandler()?.name || 'unknown';

      let sizeWarning = '';
      if (payloadSize / (1024 * 1024) > warningThresholdMB) {
        sizeWarning = ` ⚠️ LARGE PAYLOAD (${payloadSizeFormatted} - approaching ${maxSizeMB}MB limit)`;
      }

      this.logger.log(
        `🚀 [${controllerName}.${handlerName}] - CMD: [${typeof pattern === 'string' ? pattern : JSON.stringify(pattern)}] | Payload Size: ${payloadSizeFormatted}${sizeWarning} | Started at: ${new Date().toISOString()}`
      );

      return next.handle().pipe(
        tap((result) => {
          const duration = Date.now() - start;
          const durationSeconds = (duration / 1000).toFixed(3);

          // Calculate response size
          const responseSize = result ? JSON.stringify(result).length : 0;
          const responseSizeFormatted = this.formatSize(responseSize);

          let responseSizeWarning = '';
          if (responseSize / (1024 * 1024) > warningThresholdMB) {
            responseSizeWarning = ` ⚠️ LARGE RESPONSE (${responseSizeFormatted} - approaching ${maxSizeMB}MB limit)`;
          }

          this.logger.log(
            `✅ [${controllerName}.${handlerName}] - CMD: [${typeof pattern === 'string' ? pattern : JSON.stringify(pattern)}] | Response Size: ${responseSizeFormatted}${responseSizeWarning} | Duration: ${duration}ms (${durationSeconds}s)`
          );
        }),
        catchError((err) => {
          const duration = Date.now() - start;
          const durationSeconds = (duration / 1000).toFixed(3);

          // Log detailed error information
          this.logger.error(
            `❌ [${controllerName}.${handlerName}] - CMD: [${typeof pattern === 'string' ? pattern : JSON.stringify(pattern)}] | Payload Size: ${payloadSizeFormatted} | Duration: ${duration}ms (${durationSeconds}s)`
          );
          this.logger.error(`Error Message: ${err.message}`);

          // Check if it's a RabbitMQ size error
          if (err.message && err.message.includes('PRECONDITION_FAILED')) {
            this.logger.error(
              `🚨 RabbitMQ MESSAGE SIZE ERROR detected in [${controllerName}.${handlerName}]`
            );
            this.logger.error(
              `This endpoint is sending messages larger than RabbitMQ's configured maximum (${maxSizeMB}MB)`
            );
            this.logger.error(
              `Payload was ${payloadSizeFormatted} - consider implementing pagination or chunking`
            );
          }

          this.logger.error(`Stack: ${err.stack}`);
          return throwError(() => err);
        })
      );
    }

    // fallback cho HTTP nếu vẫn muốn giữ
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();
      const { method, url, headers } = request;
      const ip = request.ip || request.connection.remoteAddress;
      const body = request?.body;
      const userAgent = headers['user-agent'] || 'Unknown';
      const requestId = Math.random().toString(36).substring(7);

      this.logger.log(
        `🌐 [${requestId}] HTTP REQUEST - ${method} ${url} | IP: ${ip} | User-Agent: ${userAgent} | Body: ${body ? JSON.stringify(body) : 'No body'} | Started at: ${new Date().toISOString()}`
      );

      return next.handle().pipe(
        tap((result) => {
          const duration = Date.now() - start;
          const durationSeconds = (duration / 1000).toFixed(3);
          const statusCode = response.statusCode;
          this.logger.log(
            `✅ [${requestId}] HTTP SUCCESS - ${method} ${url} | Status: ${statusCode} | Duration: ${duration}ms (${durationSeconds}s) | Response: ${JSON.stringify(result)}`
          );
        }),
        catchError((err) => {
          const duration = Date.now() - start;
          const durationSeconds = (duration / 1000).toFixed(3);
          const statusCode = err.status || 500;
          this.logger.error(
            `❌ [${requestId}] HTTP ERROR - ${method} ${url} | Status: ${statusCode} | Duration: ${duration}ms (${durationSeconds}s) | Error: ${err.message} | Stack: ${err.stack}`
          );
          return throwError(() => err);
        })
      );
    }

    return next.handle();
  }
}
