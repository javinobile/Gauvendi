import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import { ReservationTimeSlice } from '@src/core/entities/booking-entities/reservation-time-slice.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { HotelCancellationPolicy } from '@src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RatePlanDailyAdjustment } from '@src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanPaymentTermSetting } from '@src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlanSellability } from '@src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomProductPricingMethodDetailModule } from '@src/modules/room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanDerivedSetting } from '../../../core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanTranslation } from '../../../core/entities/pricing-entities/rate-plan-translation.entity';
import { RatePlan } from '../../../core/entities/pricing-entities/rate-plan.entity';
import { RatePlanPaymentTermSettingRepository } from '../../rate-plan-payment-term-setting/repositories/rate-plan-payment-term-setting.repository';
import { RestrictionModule } from '../../restriction/restriction.module';
import { RatePlanDerivedSettingRepository } from '../repositories/rate-plan-derived-setting.repository';
import { RatePlanOverviewRepository } from '../repositories/rate-plan-overview.repository';
import { RatePlanRepository } from '../repositories/rate-plan.repository';
import { ReservationAmenity } from '@src/core/entities/booking-entities/reservation-amenity.entity';
import { GoogleInterfaceClientModule } from '@src/core/client/google-interface-client.module';
import { ReservationAmenityDate } from '@src/core/entities/booking-entities/reservation-amenity-date.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        RatePlan,
        RatePlanTranslation,
        RatePlanDerivedSetting,
        RoomProductRatePlan,
        HotelCancellationPolicy,
        HotelPaymentTerm,
        RoomProduct,
        RatePlanSellability,
        RatePlanPaymentTermSetting,
        HotelConfiguration,
        Hotel,
        Reservation,
        ReservationTimeSlice,
        RoomUnitAvailability,
        RoomProductMapping,
        RoomProductAssignedUnit,
        RatePlanDailyAdjustment,
        ReservationAmenity,
        ReservationAmenityDate
      ],
      DbName.Postgres
    ),
    ConfigModule,
    RestrictionModule,
    RoomProductPricingMethodDetailModule,
    GoogleInterfaceClientModule
  ],
  providers: [
    RatePlanRepository,
    RatePlanDerivedSettingRepository,
    RatePlanPaymentTermSettingRepository,
    RatePlanOverviewRepository
  ],
  exports: [
    RatePlanRepository,
    RatePlanDerivedSettingRepository,
    RatePlanPaymentTermSettingRepository,
    RatePlanOverviewRepository
  ]
})
export class RatePlanRepositoryModule {}
