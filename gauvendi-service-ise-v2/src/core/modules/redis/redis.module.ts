import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { RedisProvider, RedisUrlProvider, REDIS_CONNECTION, REDIS_URL } from './redis.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, RedisProvider, RedisUrlProvider],
  exports: [RedisService, RedisProvider, RedisUrlProvider, REDIS_CONNECTION, REDIS_URL]
})
export class RedisModule {}
