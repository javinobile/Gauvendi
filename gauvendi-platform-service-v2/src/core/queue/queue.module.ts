import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('QueueModule');
        const host = configService.get<string>('REDIS_HOST') || 'localhost';
        const port = +(configService.get<number>('REDIS_PORT') || 6379);
        const username = configService.get<string>('REDIS_USERNAME') || '';
        const password = configService.get<string>('REDIS_PASSWORD') || '';

        return {
          connection: new Redis({
            host,
            port,
            username,
            password,
            maxRetriesPerRequest: null,
            family: 0,
            lazyConnect: true, // ✅ không tự connect ngay khi khởi tạo
            retryStrategy: () => null, // ✅ không retry => không spam lỗi
          }),
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
