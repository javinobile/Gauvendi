import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { AxiosError } from "axios";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code and error details
    let status: number;
    let errorResponse: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorResponse = exception.getResponse();
    } else if (exception instanceof AxiosError) {
      status = exception.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        statusCode: status,
        message: exception.message || "External API error",
        errors: exception.response?.data || "AxiosError",
        timestamp: new Date().toISOString(),
      };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        statusCode: status,
        message: "Internal server error",
        errors: exception instanceof Error ? exception.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }

    // Prepare comprehensive error log
    const errorLog = {
      timestamp: new Date().toISOString(),
      statusCode: status,
      error: {
        name: exception instanceof Error ? exception.constructor.name : "Unknown",
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      },
      request: {
        method: request.method,
        url: request.url,
        originalUrl: request.originalUrl,
        path: request.path,
        query: request.query,
        params: request.params,
        headers: {
          "user-agent": request.headers["user-agent"],
          "content-type": request.headers["content-type"],
          authorization: request.headers.authorization ? "[REDACTED]" : undefined,
          "x-api-key": request.headers["x-api-key"] ? "[REDACTED]" : undefined,
          "x-forwarded-for": request.headers["x-forwarded-for"],
          "x-real-ip": request.headers["x-real-ip"],
        },
        body: this.sanitizeRequestBody(request.body),
        ip: request.ip,
      },
      user: {
        // Extract user info from request if available (adjust based on your auth implementation)
        userId: (request as any).user?.sub || (request as any).user?.id || "unknown",
        userEmail: (request as any).user?.email || "unknown",
      },
      response: errorResponse,
    };

    // Log the error with different levels based on status code
    if (status >= 500) {
      this.logger.error(`Server Error [${status}] ${request.method} ${request.url}`, JSON.stringify(errorLog, null, 2));
    } else if (status >= 400) {
      // this.logger.warn(`Client Error [${status}] ${request.method} ${request.url}`, JSON.stringify(errorLog, null, 2));
    } else {
      this.logger.log(`Request Error [${status}] ${request.method} ${request.url}`, JSON.stringify(errorLog, null, 2));
    }

    // Send error response to client
    response.status(status).send(errorResponse);
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ["password", "token", "secret", "apiKey", "authorization"];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    }

    return sanitized;
  }
}
