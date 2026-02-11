import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from 'src/core/queue/queue.constant';
import { PmsService } from '../pms/pms.service';
import { CreatePmsRestrictionDto } from './restriction.dto';
import { RestrictionService } from './restriction.service';

@Processor(QUEUE_NAMES.RESTRICTION)
export class RestrictionConsumer extends WorkerHost {
  private readonly logger = new Logger(RestrictionConsumer.name);
  constructor(
    private readonly restrictionService: RestrictionService,
    private readonly pmsService: PmsService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      // PMS restriction
      case JOB_NAMES.RESTRICTION.PROCESS_PMS_RESTRICTION:
        try {
          this.logger.log(
            `Processing pms restriction for hotel ${job.data.hotelId} with startDate ${job.data.startDate} and endDate ${job.data.endDate}`
          );
          await this.restrictionService.handlePushPmsRestriction({
            hotelId: job.data.hotelId,
            startDate: job.data.startDate,
            endDate: job.data.endDate,
            roomProductIds: job.data.roomProductIds
          });

          this.logger.log(`Pms restriction processed successfully for hotel ${job.data.hotelId}`);
        } catch (error) {
          this.logger.error(`Error processing pms restriction for hotel ${job.data.hotelId}:`, error);
          throw error;
        }
        break;

      // CM restriction
      case JOB_NAMES.RESTRICTION.PROCESS_CM_RESTRICTION:
        try {
          this.logger.log(`Processing cm room product restriction for hotel ${job.data.hotelId}`);
          // const body: CreatePmsRestrictionDto = {
          //   startDate: job.data.startDate,
          //   endDate: job.data.endDate,
          //   hotelId: job.data.hotelId,
          //   roomProductIds: job.data.roomProductIds
          // };
          //   await this.restrictionService.handlePushCmRestriction(body);

          this.logger.log(`Cm restriction processed successfully for hotel ${job.data.hotelId}`);
        } catch (error) {
          this.logger.error(`Error processing cm restriction for hotel ${job.data.hotelId}:`, error);
          throw error;
        }
        break;

      // Clear PMS restriction
      case JOB_NAMES.RESTRICTION.PROCESS_CLEAR_PMS_RESTRICTION:
        try {
          this.logger.log(`Processing clear pms restriction for hotel ${job.data.hotelId}`);
          await this.pmsService.clearPmsPropertyRestriction(
            job.data.hotelId,
            job.data.restrictions,
            job.data.roomProductMappingPms
          );
          this.logger.log(`Clear pms restriction processed successfully for hotel ${job.data.hotelId}`);
        } catch (error) {
          this.logger.error(`Error processing clear pms restriction for hotel ${job.data.hotelId}:`, error);
          throw error;
        }
        break;

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} completed`);
  }
}
