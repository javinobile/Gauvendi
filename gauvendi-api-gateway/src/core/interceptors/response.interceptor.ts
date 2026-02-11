import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, InternalServerErrorException, NestInterceptor } from "@nestjs/common";
import { ServerResponse } from "http";
import { catchError, Observable, throwError } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "../dtos/response.dto";
import { AxiosError } from "axios";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T> | T> {
    return next.handle().pipe(
      map((data: T) => {
        const response = context.switchToHttp().getResponse<ServerResponse>();
        if (response.hasHeader("Content-Type") && response.getHeader("Content-Type") !== "application/json") {
          return data;
        }
        // success
        if (data?.["isCustomResponse"]) {
          delete data["isCustomResponse"];
          return data;
        }

        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: null,
          data,
        } as ResponseDto<T>;
      }),
      catchError((err: any) => {
        return throwError(() => this.errorTransformer(err));
      })
    );
  }

  errorTransformer = (err: any): HttpException => {
    console.log("🚀 ~ ResponseInterceptor ~ errorTransformer ~ err:", err);
    if (err instanceof HttpException) {
      const statusCode = err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const message = err.message || "An error occurred";
      const data = err.getResponse()["message"] || null;
      const customResponse = {
        statusCode,
        message,
        errors: data,
        timestamp: new Date().toISOString(),
      };
      return new HttpException(customResponse, statusCode);
    }

    if (err instanceof AxiosError) {
      const customResponse = {
        statusCode: err?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err?.message || "Error trying call to third party",
        errors: err?.response?.data || "AxiosError",
        timestamp: new Date().toISOString(),
      };
      return new HttpException(customResponse, err?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (typeof err === "string") {
      return new InternalServerErrorException(err);
    }

    // Error from microservices
    return new HttpException({ ...err, statusCode: err?.status || HttpStatus.INTERNAL_SERVER_ERROR }, isNaN(err?.status) ? HttpStatus.INTERNAL_SERVER_ERROR : err?.status);
  };
}
