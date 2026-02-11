import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '../../core/constants/db-name.constant';
import { HotelTracking } from '../../core/entities/hotel-tracking-entities/hotel-tracking.entity';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { HotelTrackingController } from './hotel-tracking.controller';
import { HotelTrackingRepository } from './hotel-tracking.repository';
import { HotelTrackingService } from './hotel-tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([HotelTracking], DbName.Postgres),
    HotelRepositoryModule,
  ],
  controllers: [HotelTrackingController],
  providers: [HotelTrackingRepository, HotelTrackingService],
  exports: [HotelTrackingService, HotelTrackingRepository],
})
export class HotelTrackingModule {}
