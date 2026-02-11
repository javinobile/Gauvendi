import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from 'src/core/modules/queue/queue.constant';
import { BookingService } from '../services/booking.service';
import { QUEUE_BOOKING_SETTING } from 'src/core/constants/default-value.const';

@Processor(QUEUE_NAMES.BOOKING, {
  concurrency: QUEUE_BOOKING_SETTING.CONCURRENCY,
  lockDuration: QUEUE_BOOKING_SETTING.LOCK_DURATION,
  lockRenewTime: QUEUE_BOOKING_SETTING.LOCK_RENEW_TIME
})
export class BookingConsumer extends WorkerHost {
  private readonly logger = new Logger(BookingConsumer.name);
  constructor(private readonly bookingService: BookingService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case JOB_NAMES.BOOKING.REQUEST_BOOKING:
        try {
          const body = job.data.body as any;
          this.logger.log(`Processing booking request for hotel ${body.hotelCode}`);
          const result = await Promise.race([
            this.bookingService.requestBookingQueue(body),
            this.timeout((QUEUE_BOOKING_SETTING.LOCK_DURATION * 3) / 4)
          ]);

          return {
            success: true,
            data: result
          };
        } catch (error) {
          this.logger.error(`Error processing booking request: ${error.message}`, error.stack);
          throw error;
        }
      default:
        this.logger.error(`Unknown job name: ${job.name}`);
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private timeout(ms: number): Promise<never> {
    let timer: NodeJS.Timeout;

    return new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('BOOKING_TIMEOUT'));
      }, ms);
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active`);
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`Job ${jobId} has stalled and will be picked up again`);
  }
}
