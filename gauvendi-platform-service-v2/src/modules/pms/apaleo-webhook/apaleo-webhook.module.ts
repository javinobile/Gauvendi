import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { QUEUE_NAMES_ENV, REDIS_DB } from '@src/core/queue/queue.constant';
import { RedisModule } from '@src/core/redis/redis.module';
import { BlockSharedModule } from '@src/modules/block/modules/block-shared.module';
import { ReservationModule } from '@src/modules/reservation/modules/reservation.module';
import { RoomUnitModule } from '@src/modules/room-unit/room-unit.module';
import { PmsModule } from '../pms.module';
import { ApaleoBookingConsumer } from './apaleo-booking-consumer';
import { ApaleoWebhookController } from './apaleo-webhook.controller';
import { ApaleoWebhookService } from './apaleo-webhook.service';

@Module({
  imports: [
    PmsModule,
    ReservationModule,
    BlockSharedModule,
    RoomUnitModule,
    RedisModule,
    TypeOrmModule.forFeature([Booking, MappingPmsHotel], DbName.Postgres),
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES_ENV.APALEO_BOOKING,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            url: configService.get(ENVIRONMENT.REDIS_URL),
            maxRetriesPerRequest: null,
            db: REDIS_DB.APALEO_BOOKING
          },
          prefix: configService.get(ENVIRONMENT.BULL_APALEO_BOOKING_QUEUE),
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 10,
            concurrency: 10,
            backoff: {
              type: 'exponential',
              delay: 1000
            }
          }
        };
      }
    })
  ],
  controllers: [ApaleoWebhookController],
  // ApaleoBookingQueueEvents
  providers: [ApaleoWebhookService, ApaleoBookingConsumer]
})
export class ApaleoWebhookModule {}
