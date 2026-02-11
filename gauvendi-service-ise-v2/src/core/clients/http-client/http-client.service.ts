import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from 'src/core/constants/environment.const';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  constructor(private readonly httpService: HttpService) {}

  /**
   * Make a GET request to a remote service
   */
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url, {
          params,
          timeout: ENVIRONMENT.REQUEST_TIMEOUT
        })
      );
      return response.data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  /**
   * Make a POST request to a remote service
   */
  async post<T>(url: string, body?: any): Promise<T> {
    try {
      // Log curl equivalent for debugging
      const curlCommand = `curl -X POST '${url}' \
        -H 'Content-Type: application/json' \
        -H 'Accept: application/json' \
        ${body ? `-d '${JSON.stringify(body)}'` : ''}`;
      this.logger.log(`[HttpClientService] curl equivalent: ${curlCommand}`);

      const response = await firstValueFrom(
        this.httpService.post<T>(url, body, {
          timeout: ENVIRONMENT.REQUEST_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        })
      );
      return response.data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  /**
   * Make a PUT request to a remote service
   */
  async put<T>(url: string, body?: any): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.put<T>(url, body, {
          timeout: ENVIRONMENT.REQUEST_TIMEOUT
        })
      );
      return response.data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  /**
   * Make a DELETE request to a remote service
   */
  async delete<T>(url: string): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete<T>(url, {
          timeout: ENVIRONMENT.REQUEST_TIMEOUT
        })
      );
      return response.data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  /**
   * Handle HTTP errors consistently
   */
  private handleHttpError(error: unknown): never {
    if (this.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new HttpException('Request timeout', HttpStatus.REQUEST_TIMEOUT);
      }

      if (error.response) {
        // Server responded with an error status
        const { status, statusText, data } = error.response;
        console.error(`HTTP Error: ${status} ${statusText}`, data);
        throw new HttpException(`HTTP Error: ${status} ${statusText}`, status);
      }

      if (error.request) {
        // Network error
        console.error('Network error:', error.message);
        throw new HttpException(
          'Network error - unable to reach server',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }
    }

    // Other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Request error:', errorMessage);
    throw new HttpException(`Request failed: ${errorMessage}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * Type guard to check if error is an AxiosError
   */
  private isAxiosError(error: unknown): error is AxiosError {
    return error !== null && typeof error === 'object' && 'isAxiosError' in error;
  }
}
