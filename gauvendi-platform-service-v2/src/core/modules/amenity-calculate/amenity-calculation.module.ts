import { Module } from '@nestjs/common';
import { HotelAmenitySharedModule } from '@src/modules/hotel-amenity/modules/hotel-amenity-shared.module';
import { RatePlanExtraServiceRepositoryModule } from '@src/modules/rate-plan-extra-service/modules/rate-plan-extra-service-repository.module';
import { RatePlanV2RepositoryModule } from '@src/modules/rate-plan/modules/rate-plan-v2-repository.module';
import { RoomProductExtraSharedModule } from '@src/modules/room-product-extra/room-product-extra-shared.module';
import { AmenityDataProviderService } from './amenity-data-provider.service';

@Module({
  imports: [
    HotelAmenitySharedModule,
    RatePlanExtraServiceRepositoryModule,
    RoomProductExtraSharedModule,
    RatePlanV2RepositoryModule
  ],
  providers: [AmenityDataProviderService],
  exports: [AmenityDataProviderService]
})
export class AmenityCalculationModule {}
