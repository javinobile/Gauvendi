import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export class QueryBuilderUtils {
  /**
   * Equivalent to EbeanUtils.setEqualOrInQuery
   * Sets equal condition if single value, IN condition if multiple values
   *
   * @param queryBuilder The QueryBuilder instance to modify
   * @param field The field name to apply condition (e.g., 'entity.fieldName')
   * @param values Single value or array of values to match
   * @param parameterName Optional parameter name prefix for query parameters
   *
   * @example
   * // Single value - generates = condition
   * const queryBuilder = repository.createQueryBuilder('user');
   * QueryBuilderUtils.setEqualOrInQuery(queryBuilder, 'user.status', 'ACTIVE');
   * // Generated SQL: WHERE user.status = 'ACTIVE'
   *
   * @example
   * // Array with single value - generates = condition
   * QueryBuilderUtils.setEqualOrInQuery(queryBuilder, 'user.role', ['ADMIN']);
   * // Generated SQL: WHERE user.role = 'ADMIN'
   *
   * @example
   * // Array with multiple values - generates IN condition
   * const statuses = ['ACTIVE', 'PENDING', 'VERIFIED'];
   * QueryBuilderUtils.setEqualOrInQuery(queryBuilder, 'user.status', statuses, 'userStatus');
   * // Generated SQL: WHERE user.status IN ('ACTIVE', 'PENDING', 'VERIFIED')
   *
   * @example
   * // With numbers
   * const userIds = [1, 2, 3, 4, 5];
   * QueryBuilderUtils.setEqualOrInQuery(queryBuilder, 'user.id', userIds);
   * // Generated SQL: WHERE user.id IN (1, 2, 3, 4, 5)
   */
  static setEqualOrInQuery<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    field: string,
    values?: string[] | number[] | string | number,
    parameterName?: string
  ): SelectQueryBuilder<T> {
    if (!values || (Array.isArray(values) && values.length === 0)) {
      return queryBuilder;
    }

    const paramName = parameterName || field.replace('.', '_');

    if (Array.isArray(values)) {
      if (values.length === 1) {
        return queryBuilder.andWhere(`${field} = :${paramName}`, {
          [paramName]: values[0]
        });
      } else {
        return queryBuilder.andWhere(`${field} IN (:...${paramName})`, {
          [paramName]: values
        });
      }
    }

    return queryBuilder.andWhere(`${field} = :${paramName}`, {
      [paramName]: values
    });
  }

  /**
   * Equivalent to EbeanUtils.setNotEqualOrNotInQuery
   * Sets not equal condition if single value, NOT IN condition if multiple values
   *
   * @param queryBuilder The QueryBuilder instance to modify
   * @param field The field name to apply condition (e.g., 'entity.fieldName')
   * @param values Single value or array of values to exclude
   * @param parameterName Optional parameter name prefix for query parameters
   *
   * @example
   * // Single value - generates != condition
   * const queryBuilder = repository.createQueryBuilder('user');
   * QueryBuilderUtils.setNotEqualOrNotInQuery(queryBuilder, 'user.status', 'DELETED');
   * // Generated SQL: WHERE user.status != 'DELETED'
   *
   * @example
   * // Array with single value - generates != condition
   * QueryBuilderUtils.setNotEqualOrNotInQuery(queryBuilder, 'user.role', ['GUEST']);
   * // Generated SQL: WHERE user.role != 'GUEST'
   *
   * @example
   * // Array with multiple values - generates NOT IN condition
   * const excludeStatuses = ['DELETED', 'BANNED', 'SUSPENDED'];
   * QueryBuilderUtils.setNotEqualOrNotInQuery(queryBuilder, 'user.status', excludeStatuses, 'excludeStatus');
   * // Generated SQL: WHERE user.status NOT IN ('DELETED', 'BANNED', 'SUSPENDED')
   *
   * @example
   * // Complete query example - find active users excluding certain roles
   * const queryBuilder = this.userRepository
   *   .createQueryBuilder('user')
   *   .where('user.isActive = :isActive', { isActive: true });
   *
   * QueryBuilderUtils.setNotEqualOrNotInQuery(queryBuilder, 'user.role', ['GUEST', 'TEMP']);
   * const activeUsers = await queryBuilder.getMany();
   * // Will find all active users except those with GUEST or TEMP roles
   */
  static setNotEqualOrNotInQuery<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    field: string,
    values?: string[] | number[] | string | number,
    parameterName?: string
  ): SelectQueryBuilder<T> {
    if (!values || (Array.isArray(values) && values.length === 0)) {
      return queryBuilder;
    }

    const paramName = parameterName || field.replace('.', '_');
    if (Array.isArray(values)) {
      if (values.length === 1) {
        return queryBuilder.andWhere(`${field} = :${paramName}`, {
          [paramName]: values[0]
        });
      } else {
        return queryBuilder.andWhere(`${field} IN (:...${paramName})`, {
          [paramName]: values
        });
      }
    }

    return queryBuilder.andWhere(`${field} != :${paramName}`, { [paramName]: values });
  }

  /**
   * Helper method to add LIKE conditions with OR logic
   * Searches for a single text across multiple fields
   * PostgreSQL-optimized: Uses ILIKE for case-insensitive search and escapes special characters
   *
   * @param queryBuilder The QueryBuilder instance to modify
   * @param fields Array of field names to search in
   * @param searchText The text to search for (will be wrapped with % and escaped)
   * @param parameterName Parameter name prefix for query parameters
   * @param caseSensitive Whether to use case-sensitive search (default: false for PostgreSQL compatibility)
   *
   * @example
   * // Basic usage - case-insensitive search (PostgreSQL ILIKE)
   * const queryBuilder = repository.createQueryBuilder('user');
   * const searchFields = ['user.firstName', 'user.lastName', 'user.email'];
   * QueryBuilderUtils.addLikeConditions(queryBuilder, searchFields, 'john');
   * // Generated SQL: WHERE (user.firstName ILIKE '%john%' OR user.lastName ILIKE '%john%' OR user.email ILIKE '%john%')
   *
   * @example
   * // Case-sensitive search
   * const queryBuilder = this.productRepository.createQueryBuilder('product');
   * const productFields = ['product.code', 'product.sku'];
   * QueryBuilderUtils.addLikeConditions(queryBuilder, productFields, 'ABC123', 'productSearch', true);
   * // Generated SQL: WHERE (product.code LIKE '%ABC123%' OR product.sku LIKE '%ABC123%')
   *
   * @example
   * // Handles special characters safely
   * const searchTerm = '50% off_sale'; // Contains PostgreSQL special chars
   * QueryBuilderUtils.addLikeConditions(queryBuilder, ['product.name'], searchTerm);
   * // Automatically escapes to: WHERE product.name ILIKE '%50\\% off\\_sale%'
   */
  static addLikeConditions<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    fields: string[],
    searchText: string,
    parameterName: string = 'searchText',
    caseSensitive: boolean = false
  ): SelectQueryBuilder<T> {
    if (!searchText || fields.length === 0) {
      return queryBuilder;
    }

    // Escape PostgreSQL special characters for LIKE/ILIKE
    const escapedText = searchText.replace(/[_%\\]/g, '\\$&');

    // Use ILIKE for case-insensitive search (PostgreSQL-specific)
    const likeOperator = caseSensitive ? 'LIKE' : 'ILIKE';

    const conditions = fields
      .map((field, index) => `${field} ${likeOperator} :${parameterName}${index}`)
      .join(' OR ');

    const parameters = fields.reduce(
      (params, field, index) => {
        params[`${parameterName}${index}`] = `%${escapedText}%`;
        return params;
      },
      {} as Record<string, string>
    );
    return queryBuilder.andWhere(`(${conditions})`, parameters);
  }

  /**
   * Helper method to add array field LIKE conditions with OR logic
   * For JSON array fields that need to be searched
   * PostgreSQL-optimized: Uses ILIKE for case-insensitive search and escapes special characters
   *
   * @param queryBuilder The QueryBuilder instance to modify
   * @param field The field name to apply LIKE conditions (e.g., 'entity.fieldName')
   * @param values Array of values to search for using LIKE/ILIKE operator
   * @param parameterName Optional parameter name prefix for query parameters
   * @param caseSensitive Whether to use case-sensitive search (default: false for PostgreSQL compatibility)
   *
   * @example
   * // Basic usage - case-insensitive search (PostgreSQL ILIKE)
   * const queryBuilder = repository.createQueryBuilder('roomProduct');
   * const travelTags = ['Business', 'LEISURE', 'family'];
   * QueryBuilderUtils.addArrayFieldLikeConditions(
   *   queryBuilder,
   *   'roomProduct.travelTag',
   *   travelTags
   * );
   * // Generated SQL: WHERE (roomProduct.travelTag ILIKE '%Business%' OR roomProduct.travelTag ILIKE '%LEISURE%' OR roomProduct.travelTag ILIKE '%family%')
   * // Will match 'business', 'Business', 'BUSINESS', etc.
   *
   * @example
   * // Case-sensitive search for exact codes
   * const queryBuilder = repository.createQueryBuilder('product');
   * QueryBuilderUtils.addArrayFieldLikeConditions(
   *   queryBuilder,
   *   'product.code',
   *   ['ABC123', 'XYZ789'],
   *   'productCodes',
   *   true
   * );
   * // Generated SQL: WHERE (product.code LIKE '%ABC123%' OR product.code LIKE '%XYZ789%')
   *
   * @example
   * // Handles special characters safely
   * const searchTerms = ['50% off', 'buy_1_get_1'];
   * QueryBuilderUtils.addArrayFieldLikeConditions(queryBuilder, 'promotion.name', searchTerms);
   * // Automatically escapes: WHERE (promotion.name ILIKE '%50\\% off%' OR promotion.name ILIKE '%buy\\_1\\_get\\_1%')
   */
  static addArrayFieldLikeConditions<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    field: string,
    values: string[],
    parameterName?: string,
    caseSensitive: boolean = false
  ): SelectQueryBuilder<T> {
    if (!values || values.length === 0) {
      return queryBuilder;
    }

    const paramName = parameterName || field.replace(/\./g, '_');

    // Use ILIKE for case-insensitive search (PostgreSQL-specific)
    const likeOperator = caseSensitive ? 'LIKE' : 'ILIKE';

    // Compare against each element of the text[] column via EXISTS + unnest
    const conditions = values
      .map(
        (_, index) =>
          `EXISTS (SELECT 1 FROM unnest(${field}) AS elem WHERE elem ${likeOperator} :${paramName}${index})`
      )
      .join(' OR ');

    const parameters = values.reduce(
      (params, value, index) => {
        // Escape PostgreSQL special characters for LIKE/ILIKE
        const escapedValue = value.replace(/[_%\\]/g, '\\$&');
        params[`${paramName}${index}`] = `%${escapedValue}%`;
        return params;
      },
      {} as Record<string, string>
    );
    return queryBuilder.andWhere(`(${conditions})`, parameters);
  }

  /**
   * Helper method to check if array/collection is empty
   * Useful for conditional query building
   *
   * @param collection Array or collection to check
   * @returns true if collection is null, undefined, or has length 0
   *
   * @example
   * // Basic usage
   * const userIds = [1, 2, 3];
   * if (!QueryBuilderUtils.isEmpty(userIds)) {
   *   QueryBuilderUtils.setEqualOrInQuery(queryBuilder, 'user.id', userIds);
   * }
   *
   * @example
   * // With filter conditions
   * const filter = { statusList: ['ACTIVE'], roleList: [] };
   *
   * if (!QueryBuilderUtils.isEmpty(filter.statusList)) {
   *   QueryBuilderUtils.setEqualOrInQuery(queryBuilder, 'user.status', filter.statusList);
   * }
   *
   * if (!QueryBuilderUtils.isEmpty(filter.roleList)) {
   *   QueryBuilderUtils.setEqualOrInQuery(queryBuilder, 'user.role', filter.roleList);
   * }
   * // Only statusList condition will be applied since roleList is empty
   *
   * @example
   * // Conditional query building
   * const buildUserQuery = (filters: UserFilterDto) => {
   *   let queryBuilder = this.userRepository.createQueryBuilder('user');
   *
   *   if (!QueryBuilderUtils.isEmpty(filters.departmentIds)) {
   *     QueryBuilderUtils.setEqualOrInQuery(queryBuilder, 'user.departmentId', filters.departmentIds);
   *   }
   *
   *   if (!QueryBuilderUtils.isEmpty(filters.excludeRoles)) {
   *     QueryBuilderUtils.setNotEqualOrNotInQuery(queryBuilder, 'user.role', filters.excludeRoles);
   *   }
   *
   *   return queryBuilder.getMany();
   * };
   */
  static isEmpty(collection?: any[] | null): boolean {
    return !collection || collection.length === 0;
  }
}
