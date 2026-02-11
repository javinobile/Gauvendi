import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QUEUE_NAMES_ENV, REDIS_DB } from '@src/core/queue/queue.constant';
import { REDIS_URL } from '@src/core/redis/redis.provider';
import { QueueEvents } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class ApaleoBookingQueueEvents implements OnModuleInit {
  private readonly logger = new Logger(ApaleoBookingQueueEvents.name);
  public events: QueueEvents;

  constructor(
    @Inject(REDIS_URL)
    private readonly redisUrl: string
  ) {
    // QueueEvents needs its own connection (uses blocking commands)
    this.events = new QueueEvents(QUEUE_NAMES_ENV.APALEO_BOOKING, {
      connection: new Redis(this.redisUrl, {
        maxRetriesPerRequest: null,
        db: REDIS_DB.APALEO_BOOKING
      })
    });
    this.events.setMaxListeners(10);
    this.events.on('completed', (job) => {
      this.logger.log(`Job ${job.jobId} completed`);
    });
    this.events.on('failed', (job) => {
      this.logger.log(`Job ${job.jobId} failed`);
    });
    this.events.on('drained', () => {
      this.logger.log('Queue drained');
    });
  }

  async onModuleInit() {
    await this.events.waitUntilReady();
    this.logger.log('ApaleoBookingQueueEvents is ready');
  }
}
