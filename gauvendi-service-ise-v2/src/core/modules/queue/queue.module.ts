import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRedisConnection } from '../redis/redis.provider';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          connection: getRedisConnection(configService),
          defaultJobOptions: {
            attempts: 1,
            backoff: {
              type: 'exponential',
              delay: 2000
            },
            removeOnComplete: false,
            removeOnFail: false
          }
        };
      },
      inject: [ConfigService]
    })
  ]
})
export class QueueModule {}
