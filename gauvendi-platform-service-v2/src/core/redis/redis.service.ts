import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_CONNECTION } from './redis.provider';

@Injectable()
export class RedisService implements OnModuleDestroy {
  // private client: Redis;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CONNECTION)
    private readonly client: Redis
  ) {}

  // onModuleInit() {
  //   this.client = new Redis({
  //     host: this.configService.get<string>('REDIS_HOST') || 'localhost',
  //     port: +(this.configService.get<number>('REDIS_PORT') || 6379),
  //     username: this.configService.get<string>('REDIS_USERNAME') || '',
  //     password: this.configService.get<string>('REDIS_PASSWORD') || '',
  //     maxRetriesPerRequest: null,
  //     family: 0
  //     // lazyConnect: true, // ✅ không tự connect ngay khi khởi tạo
  //     // retryStrategy: () => null // ✅ không retry => không spam lỗi
  //   });

  //   this.client.on('connect', () => {
  //     console.log('Connected to Redis');
  //   });

  //   this.client.on('error', (err) => {
  //     // console.error('Redis error:', err);
  //   });
  // }

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
    await this.client.quit();
  }

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
}
