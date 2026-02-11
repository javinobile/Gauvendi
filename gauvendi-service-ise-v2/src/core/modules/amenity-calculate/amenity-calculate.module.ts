import { Module } from '@nestjs/common';
import { PlatformClientModule } from 'src/core/clients/platform-client.module';
import { S3Module } from 'src/core/s3/s3.module';
import { HotelAmenitySharedModule } from 'src/modules/hotel-amenity/modules/hotel-amenity-shared.module';
import { RatePlanSharedModule } from 'src/modules/hotel-rate-plan/rate-plan-shared.module';
import { RatePlanExtraServicesRepositoryModule } from 'src/modules/rate-plan-extra-services/rate-plan-extra-services-repository.module';
import { RoomProductExtraRepositoryModule } from 'src/modules/room-product-extra/room-product-extra-repository.module';
import { BookingAmenityCalculateService } from './amenity-calculate.service';
import { BookingHotelAmenityService } from './booking-hotel-amentity.service';

@Module({
  imports: [
    S3Module,
    PlatformClientModule,
    HotelAmenitySharedModule,
    RatePlanExtraServicesRepositoryModule,
    RoomProductExtraRepositoryModule,
    RatePlanSharedModule  
  ],
  providers: [BookingAmenityCalculateService, BookingHotelAmenityService],
  exports: [BookingAmenityCalculateService, BookingHotelAmenityService]
})
export class AmenityCalculateModule {}
