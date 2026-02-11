import { CacheInterceptor } from "@nestjs/cache-manager";
import { CallHandler, ExecutionContext, Injectable, Logger, SetMetadata } from "@nestjs/common";
import { format, isValid, parse } from "date-fns";
import { enGB } from "date-fns/locale";
import { Request } from "express";
import { Observable, of, tap } from "rxjs";
import { DATE_FORMAT } from "../constants/date-format.const";

export const DynamicCacheKey = (prefix: string) => SetMetadata("cacheKeyPrefix", prefix);

export const CacheTTL = (ttl: number) => SetMetadata("cache_ttl", ttl);

@Injectable()
export class DynamicCacheInterceptor extends CacheInterceptor {
  private readonly logger = new Logger(DynamicCacheInterceptor.name);

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.trackBy(context);
    const cachedResponse = await this.cacheManager.get(cacheKey);

    if (cachedResponse) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return of(cachedResponse);
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

    // Get TTL from decorator
    const ttl = this.reflector.get("cache_ttl", context.getHandler()) || 60;

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(cacheKey, response, { ttl });
        this.logger.debug(`Cache SET: ${cacheKey}`);
      })
    );
  }

  trackBy(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<Request>();
    const prefix = this.reflector.get("cacheKeyPrefix", context.getHandler());
    // // Use body for POST requests, query for others
    const data = request.method === "POST" ? request.body : request.query;

    const cacheKey = this.generateCacheKey(data);
    return `${prefix}:${cacheKey}`;
  }

  private sanitizeQueryValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value
        .map((v) => this.sanitizeQueryValue(v))
        .sort()
        .join(",");
    }

    // Handle Date objects or timestamp strings
    if (isValid(parse(`${value}`, "P", new Date(), { locale: enGB }))) {
      // Only keep the date part YYYY-MM-DD
      return format(new Date(value), DATE_FORMAT);
    }

    return String(value);
  }

  private generateCacheKey(query: Record<string, any>): string {
    // Sort keys to ensure consistent ordering
    const sortedKeys = Object.keys(query).sort();

    // Filter out empty values and build key-value pairs
    const keyValues = sortedKeys
      .filter((key) => {
        const value = query[key];
        return value !== null && value !== undefined && value !== "";
      })
      .map((key) => {
        const value = this.sanitizeQueryValue(query[key]);
        return `${key}:${value}`;
      });

    return keyValues.join("|");
  }
}
