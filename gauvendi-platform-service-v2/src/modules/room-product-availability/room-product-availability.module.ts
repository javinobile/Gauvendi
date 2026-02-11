import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockDaily } from '@src/core/entities/availability-entities/block-daily.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { ReservationTimeSlice } from '@src/core/entities/booking-entities/reservation-time-slice.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { Restriction } from '@src/core/entities/restriction.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomUnitRetailFeature } from '@src/core/entities/room-unit-retail-feature.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductMappingPms } from 'src/core/entities/room-product-mapping-pms.entity';
import { RoomProductMapping } from 'src/core/entities/room-product-mapping.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomUnit } from 'src/core/entities/room-unit.entity';
import { RedisModule } from 'src/core/redis/redis.module';
import { CmSiteminderModule } from '../cm-siteminder/cm-siteminder.module';
import { PmsModule } from '../pms/pms.module';
import { RatePlanV2RepositoryModule } from '../rate-plan/modules/rate-plan-v2-repository.module';
import { ReservationSharedModule } from '../reservation/modules/reservation-shared.module';
import { RoomProductPricingMethodDetailModule } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.module';
import { RoomProductRatePlanRepositoryModule } from '../room-product-rate-plan/room-product-rate-plan-repository.module';
import { RoomProductRestrictionModule } from '../room-product-restriction/room-product-restriction.module';
import { RoomProductRetailFeatureSharedModule } from '../room-product-retail-feature/modules/room-product-retail-feature-shared.module';
import { RoomProductStandardFeatureSharedModule } from '../room-product-standard-feature/modules/room-product-standard-feature-shared.module';
import { RoomProductSharedModule } from '../room-product/room-product-shared.module';
import { RoomProductPricingModule } from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.module';
import { RoomProductAvailabilityController } from './room-product-availability.controller';
import { RoomProductAvailabilityService } from './room-product-availability.service';
import { RestrictionModule } from '../restriction/restriction.module';
@Module({
  controllers: [RoomProductAvailabilityController],
  providers: [RoomProductAvailabilityService],
  imports: [
    RoomProductSharedModule,
    ReservationSharedModule,
    RoomProductRetailFeatureSharedModule,
    RoomProductStandardFeatureSharedModule,
    TypeOrmModule.forFeature(
      [
        RoomProduct,
        RoomProductDailyAvailability,
        RoomProductMappingPms,
        RoomUnitAvailability,
        RoomProductAssignedUnit,
        RoomUnit,
        RoomProductMapping,
        Restriction,
        RoomUnitRetailFeature,
        RoomProductRetailFeature,
        RoomProductStandardFeature,
        Hotel,
        RoomProductRatePlan,
        BlockDaily,
        ReservationTimeSlice
      ],
      DbName.Postgres
    ),
    PmsModule,
    CmSiteminderModule,
    RoomProductRestrictionModule,
    ConfigModule,
    RedisModule,
    RoomProductPricingMethodDetailModule,
    RoomProductRatePlanRepositoryModule,
    RatePlanV2RepositoryModule,
    RestrictionModule,
    RoomProductPricingModule
  ],
  exports: [RoomProductAvailabilityService]
})
export class RoomProductAvailabilityModule {}
