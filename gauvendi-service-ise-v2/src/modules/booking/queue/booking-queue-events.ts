import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { QUEUE_NAMES } from 'src/core/modules/queue/queue.constant';
import { REDIS_URL } from 'src/core/modules/redis/redis.provider';

@Injectable()
export class BookingQueueEvents implements OnModuleInit {
  private readonly logger = new Logger(BookingQueueEvents.name);
  public events: QueueEvents;

  constructor(
    @InjectQueue(QUEUE_NAMES.BOOKING)
    private bookingQueue: Queue,

    @Inject(REDIS_URL)
    private readonly redisUrl: string
  ) {
    // QueueEvents needs its own connection (uses blocking commands)
    this.events = new QueueEvents(QUEUE_NAMES.BOOKING, {
      connection: new Redis(this.redisUrl, { maxRetriesPerRequest: null })
    });
  }

  async onModuleInit() {
    await this.events.waitUntilReady();
    this.logger.log('BookingQueueEvents is ready');
  }
}
