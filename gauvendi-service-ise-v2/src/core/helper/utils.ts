import { BadRequestException } from '@nestjs/common';
import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { DATE_FORMAT } from '../constants/date.constant';

export class Helper {
  public static parseArrayString = (value: string): string[] => {
    if (!value) {
      return [];
    }
    if (value.includes('[')) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map((item: any) => String(item)) : [String(parsed)];
      } catch (error) {
        // If JSON parsing fails, fall back to comma-separated parsing
        if (value.includes(',')) {
          return value.split(',').map((item: string) => item.trim());
        }
        return [value.trim()].filter((item: string) => !!item);
      }
    }
    if (value.includes(',')) {
      return value.split(',').map((item: string) => item.trim());
    }
    return [value.trim()].filter((item: string) => !!item);
  };
  
  static toSnakeCase = (str: string) => str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

  public static mappingUpdateToEntity<T>(entity: T, input: Partial<T>): T {
    for (const key in input) {
      if (input[key] !== null && input[key] !== undefined) {
        entity[key] = input[key];
      }
    }
    return entity;
  }

  public static transformToSnakeCase = (obj: Record<string, any>) => {
    return Object.keys(obj).reduce(
      (acc, key) => {
        acc[this.toSnakeCase(key)] = obj[key];
        return acc;
      },
      {} as Record<string, any>,
    );
  };

  public static generateCode = (length: number = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  public static formatFileName(filename: string): string {
    return filename
      .split('.')
      .slice(0, -1)
      .join('.') // Remove file extension
      .replace(/[|\\{}<>:"?%#[\]^`+\s]/g, '-') // Replace unsafe characters (excluding `/`)
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/(^-+)|(-+$)/g, '') // Trim leading/trailing hyphens
      .toLowerCase(); // Convert to lowercase and append .pdf
  }

  static hasText(str?: string): boolean {
    return !!str && str.trim().length > 0;
  }

  static getDateListFromDateRange(startDate: string, endDate: string): string[] {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const totalDays = differenceInDays(end, start) + 1;

    const dates = Array.from({ length: totalDays }, (_, i) => format(addDays(start, i), DATE_FORMAT));

    return dates;
  }

  static formatDate(date: string | Date): string {
    return format(new Date(date), DATE_FORMAT);
  }

  static generateGiftCode(): string {
    const randomPart = Array(3)
      .fill(null)
      .map(() => Math.random().toString(36).substring(2, 6).toUpperCase())
      .join('-');
    return `DA-${randomPart}`;
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * "Soft Drink" → "SOFT_DRINK"
   * " Ice Tea " → "ICE_TEA"
   * "Café Latte" → "CAFE_LATTE"
   * "Hot & Spicy" → "HOT_SPICY"
   */
  static nameToUpperCode(name: string): string {
    return name
      .trim() // Remove leading/trailing spaces
      .replace(/\s+/g, '_') // Replace multiple spaces with single underscore
      .normalize('NFD') // Normalize Unicode (for accents, etc.)
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove any characters that aren't letters, numbers or underscore
      .toUpperCase(); // Convert to uppercase
  }

  nameToCode(name: string): string {
    return name
      .normalize('NFD') // Normalize Unicode (for accents, etc.)
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9]+/g, '_') // Replace non-alphanumeric characters with underscores
      .replace(/^_+|_+$/g, '') // Trim leading/trailing underscores
      .toUpperCase(); // Convert to uppercase
  }

  static checkValidFields(body: any, validFields: string[]) {
    const invalidFields = body.flatMap((item) => Object.keys(item).filter((key) => !validFields.includes(key)));

    if (invalidFields.length > 0) {
      const uniqueInvalidFields = [...new Set(invalidFields)];
      throw new BadRequestException(`Invalid fields: ${uniqueInvalidFields.join(', ')}`);
    }
  }

  /**
   * Generate date range from fromDate to toDate
   */
  static generateDateRange(fromDate: string, toDate: string): string[] {
    const dates: string[] = [];
    let currentDate = parseISO(fromDate);
    const endDate = parseISO(toDate);

    while (currentDate <= endDate) {
      dates.push(format(currentDate, DATE_FORMAT));
      currentDate = addDays(currentDate, 1);
    }

    return dates;
  }

  /**
   * Generic cursor-based pagination helper.
   * Repeatedly calls the provided API until the returned cursor is null/undefined,
   * accumulating items into a single array.
   */
  static async paginateByCursor<TRequest extends Record<string, any>, TItem, TResponse>(options: {
    initialRequest: TRequest;
    callApi: (request: TRequest) => Promise<TResponse>;
    extract: (response: TResponse) => { items: TItem[]; cursor?: string | null };
    applyCursor: (request: TRequest, cursor?: string | null) => TRequest;
    maxIterations?: number;
  }): Promise<TItem[]> {
    const { initialRequest, callApi, extract, applyCursor } = options;
    const maxIterations = options.maxIterations ?? 1000;

    const aggregatedItems: TItem[] = [];
    let request: TRequest = initialRequest;
    let iterations = 0;

    while (iterations < maxIterations) {
      const response = await callApi(request);
      const { items, cursor } = extract(response);

      if (Array.isArray(items) && items.length > 0) {
        aggregatedItems.push(...items);
      }

      if (!cursor) {
        break;
      }

      request = applyCursor(request, cursor);
      iterations += 1;
    }

    return aggregatedItems;
  }

  static parseDateToUTC(d: string): Date {
    const parsed = parseISO(d);
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }
  
}
export class CamelCaseUtil {
  static toCamelCase(key: string): string {
    return key.charAt(0).toLowerCase() + key.slice(1);
  }

  static convertKeysToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertKeysToCamelCase(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce(
        (acc, key) => {
          const camelKey = this.toCamelCase(key);
          acc[camelKey] = this.convertKeysToCamelCase(obj[key]);
          return acc;
        },
        {} as Record<string, any>,
      );
    }
    return obj;
  }
}
