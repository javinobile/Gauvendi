import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelMarketSegment } from '@src/core/entities/hotel-entities/hotel-market-segment.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelMarketSegmentRepository } from '../repositories/hotel-market-segment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelMarketSegment, Hotel], DbName.Postgres)],
  providers: [HotelMarketSegmentRepository],
  exports: [HotelMarketSegmentRepository]
})
export class HotelMarketSegmentSharedModule {}

