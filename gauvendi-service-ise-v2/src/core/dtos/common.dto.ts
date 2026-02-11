import { IsEnum, IsOptional } from 'class-validator';
import {
  FindOptions,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  IsNull,
  ObjectLiteral,
  SelectQueryBuilder
} from 'typeorm';
import { OptionalArrayProperty } from '../decorators/array-property.decorator';
import { LanguageCodeEnum } from '../database/entities/base.entity';
import { Transform } from 'class-transformer';

export class ApiResponseDto<T> {
  code: string;
  statusCode?: number;
  status: string;
  message: string;
  data?: T | null;
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
  @Transform(({ value }) => {
    if (value === 'null' || value === 'undefined') return LanguageCodeEnum.EN;
    return value;
  })
  translateTo?: LanguageCodeEnum;

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

  static setOptionRelations<T extends ObjectLiteral>(
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

  static setOptionPaging<T extends ObjectLiteral>(
    options: FindOptions<T>,
    paging: Filter
  ): FindOptions<T> {
    options.skip = paging.offset;
    options.limit = paging.pageSize;
    return options;
  }

  static buildCondition<U extends ObjectLiteral, T extends Filter>(filter: T) {
    const where: FindOptionsWhere<U> = {};
    let options: FindOptions<U> = {};
    let relations: FindOptionsRelations<U> = {};
    let order: FindOptionsOrder<U> = {};

    if (filter.relations && filter.relations.length > 0) {
      relations = Filter.setOptionRelations(relations, filter.relations);
    }

    if (filter.sort && filter.sort.length > 0) {
      order = Filter.setOptionSort(order, filter.sort);
    }

    if (filter.offset && filter.offset > 0) {
      options = Filter.setOptionPaging(options, filter);
    }
    return { where, relations, order, options };
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
