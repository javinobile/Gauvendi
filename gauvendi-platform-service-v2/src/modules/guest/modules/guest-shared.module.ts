import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheModule } from '@src/core/cache/redis-cache.module';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { DB_NAME } from 'src/core/constants/db.const';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { GuestRepository } from '../repositories/guest.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guest, Booking, Reservation], DB_NAME.POSTGRES), 
    ConfigModule, 
    S3Module,
    RedisCacheModule
  ],
  providers: [GuestRepository],
  exports: [GuestRepository]
})
export class GuestSharedModule {}
