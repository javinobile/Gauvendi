import { Module } from '@nestjs/common';
import { S3Module } from 'src/core/s3/s3.module';
import { HotelSharedModule } from 'src/modules/hotel-v2/modules/hotel-shared.module';
import { HotelAmenityController } from '../controllers/hotel-amenity.controller';
import { HotelAmenityService } from '../services/hotel-amenity.service';
import { HotelAmenitySharedModule } from './hotel-amenity-shared.module';

@Module({
  imports: [HotelAmenitySharedModule, HotelSharedModule, S3Module],
  controllers: [HotelAmenityController],
  providers: [HotelAmenityService],
  exports: [HotelAmenityService, HotelAmenitySharedModule]
})
export class HotelAmenityModule {}
