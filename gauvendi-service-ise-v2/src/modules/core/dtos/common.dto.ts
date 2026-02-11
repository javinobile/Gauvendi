import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';

export class ApiResponseDto<T> {
  code: string;
  statusCode?: number;
  status: string;
  message: string;
  data?: T | null;
}

export enum ResponseContentStatusEnum {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export class ValidationMessage {
  success: boolean;
  message: string;
  messageEnum?: string;

  constructor(messageEnum?: string, success: boolean = true) {
    this.success = success;
    this.messageEnum = messageEnum;
    this.message = messageEnum || '';
  }

  static success(message?: string): ValidationMessage {
    return new ValidationMessage(message, true);
  }

  static error(message: string): ValidationMessage {
    return new ValidationMessage(message, false);
  }
}

export class ResponseContent<T> {
  validationMessage: ValidationMessage;
  status: ResponseContentStatusEnum;
  data?: T;

  constructor(validationMessage: ValidationMessage, status: ResponseContentStatusEnum, data?: T) {
    this.validationMessage = validationMessage;
    this.status = status;
    this.data = data;
  }

  static success<T>(data: T, message?: string): ResponseContent<T> {
    return new ResponseContent(
      ValidationMessage.success(message || 'Operation successful'),
      ResponseContentStatusEnum.SUCCESS,
      data
    );
  }

  static error<T>(message: string, data?: T): ResponseContent<T> {
    return new ResponseContent(
      ValidationMessage.error(message),
      ResponseContentStatusEnum.ERROR,
      data
    );
  }
}

export class ResponseData<T> {
  count: number;
  totalPage: number;
  data: T[];

  constructor(count: number, totalPage: number, data: T[]) {
    this.count = count;
    this.totalPage = totalPage;
    this.data = data;
  }

  static success<T>(data: T[], count?: number, pageSize: number = 10): ResponseData<T> {
    const totalCount = count ?? data.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    return new ResponseData(totalCount, totalPages, data);
  }
}

export enum ActionTypeEnum {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export enum SortByOrderEnum {
  ASC = 'asc',
  DESC = 'desc'
}

export class Filter {
  @IsOptional()
  pageSize?: number = 10;

  @IsOptional()
  offset?: number = 0;

  @OptionalArrayProperty()
  sort?: string[];

  @OptionalArrayProperty()
  relations?: string[];

  @IsOptional()
  @IsString()
  sortByField?: string;

  @IsOptional()
  @IsEnum(SortByOrderEnum)
  sortByOrder?: SortByOrderEnum;
}
