import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { JOB_NAMES, QUEUE_NAMES, QUEUE_NAMES_ENV } from '@src/core/queue/queue.constant';
import { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { ReservationService } from '../services/reservation.service';

@Processor(QUEUE_NAMES_ENV.RESERVATION)
export class ReservationConsumer extends WorkerHost {
  constructor(
    private readonly reservationService: ReservationService,

    @InjectRepository(Booking, DbName.Postgres)
    private readonly bookingRepository: Repository<Booking>,
    @InjectQueue(QUEUE_NAMES_ENV.RESERVATION)
    private readonly reservationQueue: Queue
  ) {
    super();
  }
  private readonly logger = new Logger(ReservationConsumer.name);

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case JOB_NAMES.RESERVATION.PROCESS_UPDATE_RESERVATION:
        try {
          const data: any = job.data as any;
          this.logger.log(
            `Processing reservation update for hotel ${data.hotelId} and booking pms code ${data.pmsBookings?.[0]?.id}`
          );
          const pmsReservations = (data.pmsReservations as any[]) || [];
          const pmsBookings = (data.pmsBookings as any[]) || [];
          const bookings = (data.bookings as any[]) || [];
          const countries = (data.countries as any[]) || [];
          const hotelId = data.hotelId as string;
          const jobType = data.jobType as string;
          const pmsCityTaxList = (data.pmsCityTaxList as any[]) || [];
          const hotelCityTaxs = (data.hotelCityTaxs as any[]) || [];
          const retryCount = data.retryCount ?? 0;

          if (bookings.length === 0) {
            const currentBooking = await this.bookingRepository.findOne({
              where: {
                hotelId: data?.hotelId,
                mappingBookingCode: pmsBookings?.[0]?.id
              }
            });

            if (!currentBooking && jobType === 'delayed') {
              if (retryCount >= 5) {
                this.logger.error(
                  `Booking still not found after ${retryCount} retries, drop event`
                );
                return;
              }

              this.logger.warn(`Booking not found, requeue ${job.id} (retry=${retryCount + 1})`);

              await this.reservationQueue.add(
                JOB_NAMES.RESERVATION.PROCESS_UPDATE_RESERVATION,
                {
                  ...data,
                  retryCount: retryCount + 1
                },
                {
                  delay: 200,
                  attempts: 1
                }
              );

              return `Update booking ${job.data.pmsBookings?.[0]?.id} delayed more`;
            }
          }

          this.reservationService.updateApaleoReservations(
            pmsReservations,
            pmsBookings,
            bookings,
            countries,
            hotelId,
            pmsCityTaxList,
            hotelCityTaxs
          );

          return `Update booking ${pmsBookings?.[0]?.id} success`;
        } catch (error) {
          this.logger.error(`Error processing Apaleo booking created: ${error.message}`);
          return `Update booking ${job.data.pmsBookings?.[0]?.id} failed`;
        }
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }
}
