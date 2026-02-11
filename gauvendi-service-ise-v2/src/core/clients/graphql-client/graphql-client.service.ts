import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from 'src/core/constants/environment.const';
import { HttpClientService } from '../http-client/http-client.service';
import { getCurlCommand } from 'src/core/utils/curl.util';

interface GraphQLRequest {
  operationName?: string;
  query: string;
  variables?: Record<string, any>;
}

interface GraphQLResponse<T> {
  data?: Record<string, T>;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

@Injectable()
export class GraphQLClientService {
  private readonly logger = new Logger(GraphQLClientService.name);
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Execute a GraphQL query
   */
  async query<T>(
    serviceUrl: string,
    operationName: string,
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    const request: GraphQLRequest = {
      // operationName,
      query,
      variables
    };

    try {
      const response = await this.httpClient.post<GraphQLResponse<T>>(
        `${serviceUrl}/graphql`,
        request
      );

      if (response.errors && response.errors.length > 0) {
        throw new HttpException(
          `GraphQL Error: ${response.errors[0].message}`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (!response.data) {
        throw new HttpException('No data returned from GraphQL query', HttpStatus.NO_CONTENT);
      }

      // Return the data for the specific operation
      return response.data[operationName] || response.data.response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `GraphQL request failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<T>(
    serviceUrl: string,
    operationName: string,
    mutation: string,
    variables?: Record<string, any>
  ): Promise<T> {
    return this.query<T>(serviceUrl, operationName, mutation, variables);
  }

  /**
   * Get service URL for a specific module
   */
  getServiceUrl(module: string): string {
    const urlMap: Record<string, string> = {
      notification:
        this.configService.get(ENVIRONMENT.REMOTE_SERVICE_ENDPOINT_SVC_NOTIFICATION) || ''
    };

    const url = urlMap[module];
    if (!url) {
      throw new HttpException(`Unknown service module: ${module}`, HttpStatus.BAD_REQUEST);
    }

    return url;
  }
}
