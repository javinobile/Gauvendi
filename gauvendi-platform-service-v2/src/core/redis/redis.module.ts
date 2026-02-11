import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisTaskService } from './redis-task.service';
import { RedisService } from './redis.service';
import { REDIS_URL, REDIS_CONNECTION, RedisProvider, RedisUrlProvider } from './redis.provider';

@Module({
  imports: [ConfigModule],
  providers: [RedisService, RedisProvider, RedisUrlProvider, RedisTaskService],
  exports: [
    RedisService,
    RedisProvider,
    RedisUrlProvider,
    RedisTaskService,
    REDIS_CONNECTION,
    REDIS_URL
  ]
})
export class RedisModule {}
