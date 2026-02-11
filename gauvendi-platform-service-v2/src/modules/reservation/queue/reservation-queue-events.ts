import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { QUEUE_NAMES, QUEUE_NAMES_ENV, REDIS_DB } from '@src/core/queue/queue.constant';
import { REDIS_URL } from '@src/core/redis/redis.provider';
import { QueueEvents } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class ReservationQueueEvents implements OnModuleInit {
  private readonly logger = new Logger(ReservationQueueEvents.name);
  public events: QueueEvents;

  constructor(
    @Inject(REDIS_URL)
    private readonly redisUrl: string,

    private readonly configService: ConfigService
  ) {
    // QueueEvents needs its own connection (uses blocking commands)
    this.events = new QueueEvents(QUEUE_NAMES_ENV.RESERVATION, {
      connection: new Redis(this.redisUrl, {
        maxRetriesPerRequest: null,
        db: REDIS_DB.RESERVATION
      }),
      prefix: this.configService.get(ENVIRONMENT.BULL_RESERVATION_QUEUE)
    });
    this.events.setMaxListeners(10);
  }

  async onModuleInit() {
    await this.events.waitUntilReady();
    this.logger.log('ReservationQueueEvents is ready');
  }
}
