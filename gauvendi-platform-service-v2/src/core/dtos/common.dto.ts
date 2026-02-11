import { IsOptional } from 'class-validator';
import {
  FindOptions,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
  SelectQueryBuilder
} from 'typeorm';
import { OptionalArrayProperty } from '../decorators/array-property.decorator';
import { LanguageCodeEnum } from '../enums/common';

export class ApiResponseDto<T> {
  code: string;
  statusCode?: number;
  status: string;
  message: string;
  data?: T | null;
}

export enum ResponseContentStatusEnum {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
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
  pageIndex?: number = 0;

  @IsOptional()
  offset?: number = 0;

  @OptionalArrayProperty()
  sort?: string[];

  @OptionalArrayProperty()
  relations?: string[];

  @IsOptional()
  translateTo?: LanguageCodeEnum | null;

  static buildCondition<U extends ObjectLiteral, T extends Filter>(filter: T) {
    const where: FindOptionsWhere<U> = {};
    let options: FindOptions<U> = {};
    let relations: FindOptionsRelations<U> = {};
    let order: FindOptionsOrder<U> = {};

    if (filter.relations && filter.relations.length > 0) {
      relations = Filter.setOptionRelationsV2(relations, filter.relations);
    }

    if (filter.sort && filter.sort.length > 0) {
      order = Filter.setOptionSort(order, filter.sort);
    }

    if (filter.offset && filter.offset > 0) {
      options = Filter.setOptionPaging(options, filter);
    }
    return { where, relations, order, options };
  }

  static setDefaultValue<T extends Filter>(filter: T, filterClass: new () => T): T {
    if (!filter) {
      return new filterClass();
    }
    if (filter.pageSize === undefined) {
      filter.pageSize = 10;
    }
    if (filter.offset === undefined) {
      filter.offset = 0;
    }
    return filter;
  }

  static setPagingFilter(query: any, filter: Filter): void {
    if (filter.pageSize && filter.pageSize > 0) {
      query.take(filter.pageSize);
    }
    if (filter.offset && filter.offset > 0) {
      query.skip(filter.offset);
    }
  }

  static setQueryBuilderRelations<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    queryName: string,
    relations: string[] | string
  ): void {
    if (typeof relations === 'string') {
      relations = [relations];
    }
    relations.forEach((relation) => {
      if (relation.includes('.')) {
        const [_childRelation, alias] = relation.split('.');
        const mappedAlias = alias.endsWith('s') ? alias.slice(0, -1) : alias;
        query.leftJoinAndSelect(`${relation}`, mappedAlias);
      } else {
        const alias = relation.endsWith('s') ? relation.slice(0, -1) : relation;
        query.leftJoinAndSelect(`${queryName}.${relation}`, alias);
      }
    });
  }

  static setQueryBuilderSort<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    queryName: string,
    sort: string[]
  ): void {
    sort.forEach((item) => {
      const [field, direction] = item.split(':');
      query.addOrderBy(`${queryName}.${field}`, direction.toUpperCase() as 'ASC' | 'DESC');
    });
  }

  static setQueryBuilderPaging<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    paging: Filter
  ): void {
    if (paging.pageSize) {
      query.take(paging.pageSize);

      const skip = paging.pageIndex ? paging.pageIndex * paging.pageSize : 0;
      query.skip(skip);
    }
  }

  static setOptionSort<T extends ObjectLiteral>(
    options: FindOptionsOrder<T>,
    sort: string[]
  ): FindOptionsOrder<T> {
    sort.forEach((item) => {
      const [field, direction] = item.split(':');
      (options as Record<string, 'ASC' | 'DESC'>)[field] = direction.toUpperCase() as
        | 'ASC'
        | 'DESC';
    });
    return options;
  }

  static setOptionRelationsV2<T extends ObjectLiteral>(
    options: FindOptionsRelations<T>,
    relations: string[]
  ): FindOptionsRelations<T> {
    const result = { ...options };
    const list = Array.isArray(relations) ? relations : [relations];
    list.forEach((relation) => {
      (result as Record<string, boolean>)[relation] = true;
    });
    return result;
  }

  static setOptionRelations<T extends ObjectLiteral>(
    options: FindOptionsWhere<T>,
    relations: string[]
  ): FindOptionsWhere<T> {
    relations.forEach((relation) => {
      (options as Record<string, boolean>)[relation] = true;
    });
    return options;
  }

  static setOptionPaging<T extends ObjectLiteral>(
    options: FindOptions<T>,
    paging: Filter
  ): FindOptions<T> {
    options.skip = paging.offset;
    options.limit = paging.pageSize;
    return options;
  }

  static buildSortForQueryAPI<T>(sort: string[]): FindOptionsOrder<T> {
    return sort.reduce((acc, item) => {
      const [field, direction] = item.split(':');
      return {
        ...acc,
        [field]: direction.toUpperCase() as 'ASC' | 'DESC'
      };
    }, {} as FindOptionsOrder<T>);
  }
}
