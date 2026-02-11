import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { JOB_NAMES, QUEUE_NAMES, QUEUE_NAMES_ENV } from '@src/core/queue/queue.constant';
import { RedisService } from '@src/core/redis';
import { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { ApaleoWebhookService } from './apaleo-webhook.service';

@Processor(QUEUE_NAMES_ENV.APALEO_BOOKING)
export class ApaleoBookingConsumer extends WorkerHost {
  constructor(
    private readonly redisService: RedisService,
    private readonly apaleoBookingService: ApaleoWebhookService,

    @InjectRepository(Booking, DbName.Postgres)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(MappingPmsHotel, DbName.Postgres)
    private readonly mappingPmsHotelRepository: Repository<MappingPmsHotel>,

    @InjectQueue(QUEUE_NAMES_ENV.APALEO_BOOKING) private readonly apaleoBookingQueue: Queue
  ) {
    super();
  }
  private readonly logger = new Logger(ApaleoBookingConsumer.name);

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case JOB_NAMES.APALEO_BOOKING.PROCESS_APALEO_BOOKING_CREATED:
        try {
          const body = job.data.body as any;
          const type = job.data.type as any;
          const jobType = job.data.jobType as any;
          const retryCount = job.data.retryCount ?? 0;

          this.logger.log(`Processing Apaleo booking created for hotel ${body.mappingHotelCode}`);

          const mappingPmsHotel = await this.mappingPmsHotelRepository.findOne({
            where: {
              mappingHotelCode: body.mappingHotelCode
            }
          });
          if (!mappingPmsHotel) {
            this.logger.warn(`No mappingPmsHotel ${mappingPmsHotel}`);
          }
          const bookingMapCode: string = body.mappingEntityCode.split('-').at(0) || '';
          if (!bookingMapCode) {
            this.logger.warn(`No bookingMapCode ${bookingMapCode}`);
            return;
          }
          const booking = await this.bookingRepository.findOne({
            where: {
              hotelId: mappingPmsHotel?.hotelId,
              mappingBookingCode: bookingMapCode
            }
          });
          // const payloadHash = this.redisService.generateCacheKey('apaleo_booking', {
          //   mappingBookingCode: body.mappingEntityCode.split('-').at(0),
          //   mappingHotelCode: body.mappingHotelCode
          // });

          if (!booking && jobType === 'delayed') {
            if (retryCount >= 5) {
              this.logger.error(`Booking still not found after ${retryCount} retries, drop event`);
              return;
            }

            this.logger.warn(
              `Booking not found, requeue update ${job.id} (retry=${retryCount + 1})`
            );

            const newJob = await this.apaleoBookingQueue.add(
              JOB_NAMES.APALEO_BOOKING.PROCESS_APALEO_BOOKING_CREATED,
              {
                ...job.data,
                retryCount: retryCount + 1
              },
              {
                attempts: 1,
                delay: 1000,
                removeOnComplete: true,
                removeOnFail: true
              }
            );

            return;
          }

          // const existingJobs = await this.apaleoBookingQueue.getJobs([
          //   'waiting',
          //   'delayed',
          //   'active'
          // ]);
          // const isDuplicate = existingJobs.some((job) => job.data?.payloadHash === payloadHash);
          // deplay more 1s if using credit card
          // const delay = isDuplicate ? 2000 : 0; // 1s if same payload
          // this.logger.log(`Delay: ${delay}`);
          // const newJob = await this.apaleoBookingQueue.add(
          //   JOB_NAMES.APALEO_BOOKING.PROCESS_APALEO_BOOKING_CREATED,
          //   {
          //     body,
          //     payloadHash,
          //     type
          //   },
          //   {
          //     attempts: 1,
          //     backoff: {
          //       type: 'exponential',
          //       delay: 2000
          //     },
          //     removeOnComplete: true,
          //     removeOnFail: true,
          //     delay: 1000
          //   }
          // );

          this.apaleoBookingService.handleApaleoReservationCreatedQueue(body, type);

          return true;
        } catch (error) {
          this.logger.error(`Error processing Apaleo booking created: ${error.message}`);
          throw error;
        }
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }
}
