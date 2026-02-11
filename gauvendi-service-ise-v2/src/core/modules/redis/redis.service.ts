import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CONNECTION } from './redis.provider';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_CONNECTION)
    private readonly client: Redis
  ) {}

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async delete(key: string) {
    await this.client.del(key);
  }

  async onModuleDestroy() {
    // Connection is managed by RedisProvider, don't close it here
  }

  /**
   * Generate consistent cache key for caching queries
   */
  generateCacheKey(prefix: string, params: Record<string, any>): string {
    // Create a deterministic hash of the parameters
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (obj, key) => {
          obj[key] = params[key];
          return obj;
        },
        {} as Record<string, any>
      );

    const paramString = JSON.stringify(sortedParams);
    const hash = require('crypto').createHash('md5').update(paramString).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Set cached result in Redis
   */
  async setCachedResult(cacheKey: string, data: any, ttl: number = 15): Promise<void> {
    try {
      await this.set(cacheKey, JSON.stringify(data), ttl);
      this.logger.debug(`Cached result for key ${cacheKey} with TTL ${ttl}s`);
    } catch (error) {
      this.logger.warn(`Cache set failed for key ${cacheKey}: ${error.message}`);
    }
  }
}
