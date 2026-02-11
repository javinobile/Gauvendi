import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ENVIRONMENT } from 'src/core/constants/environment.const';

export const REDIS_CONNECTION = 'REDIS_CONNECTION';
export const REDIS_URL = 'REDIS_URL';

const logger = new Logger('RedisProvider');

let sharedRedisConnection: Redis | null = null;

export const getRedisUrl = (configService: ConfigService): string => {
  return configService.get(ENVIRONMENT.REDIS_URL) || 'redis://localhost:6379';
};

export const getRedisConnection = (configService: ConfigService): Redis => {
  if (!sharedRedisConnection) {
    const url = getRedisUrl(configService);
    sharedRedisConnection = new Redis(url, {
      maxRetriesPerRequest: null
    });

    sharedRedisConnection.on('connect', () => {
      logger.log('Redis connected');
    });

    sharedRedisConnection.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });
  }
  return sharedRedisConnection;
};

export const RedisProvider: Provider = {
  provide: REDIS_CONNECTION,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return getRedisConnection(configService);
  }
};

export const RedisUrlProvider: Provider = {
  provide: REDIS_URL,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return getRedisUrl(configService);
  }
};
