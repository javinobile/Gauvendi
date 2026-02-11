import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { FileLibrary } from '@src/core/entities/core-entities/file-library.entity';
import { Connector } from '@src/core/entities/hotel-entities/connector.entity';
import { HotelAgeCategory } from '@src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenityPrice } from '@src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCancellationPolicy } from '@src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelCityTax } from '@src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from '@src/core/entities/hotel-entities/hotel-tax.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelRestrictionIntegrationSetting } from '@src/core/entities/hotel-restriction-integration-setting.entity';
import { HotelRestrictionSetting } from '@src/core/entities/hotel-restriction-setting.entity';
import { HotelRetailCategory } from '@src/core/entities/hotel-retail-category.entity';
import { MewsServiceSettings } from '@src/core/entities/mews-entities/mews-service-settings.entity';
import { RatePlanDailyAdjustment } from '@src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanPaymentTermSetting } from '@src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlanSellability } from '@src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RatePlanTranslation } from '@src/core/entities/pricing-entities/rate-plan-translation.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanDailyExtraService } from '@src/core/entities/rate-plan-daily-extra-service.entity';
import { Restriction } from '@src/core/entities/restriction.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductExtraOccupancyRate } from '@src/core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from '@src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { CityTaxCalculateModule } from '@src/core/modules/pricing-calculate/city-tax/city-tax-calculate.module';
import { PricingCalculateModule } from '@src/core/modules/pricing-calculate/pricing-calculate.module';
import { QUEUE_NAMES, REDIS_DB } from '@src/core/queue/queue.constant';
import { RedisModule } from '@src/core/redis/redis.module';
import { S3Module } from '@src/core/s3/s3.module';
import { BookingTransactionSharedModule } from '@src/modules/booking-transaction/modules/booking-transaction-shared.module';
import { BookingUpsellInformationSharedModule } from '@src/modules/booking-upsell-information/modules/booking-upsell-information-shared.module';
import { CompanySharedModule } from '@src/modules/company/modules/company-shared.module';
import { ConnectorSharedModule } from '@src/modules/connector/modules/connector-shared.module';
import { GlobalPaymentMethodSharedModule } from '@src/modules/global-payment-method/modules/global-payment-method-shared.module';
import { GlobalPaymentProviderSharedModule } from '@src/modules/global-payment-provider/modules/global-payment-provider-shared.module';
import { GuestSharedModule } from '@src/modules/guest/modules/guest-shared.module';
import { HotelAmenitySharedModule } from '@src/modules/hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelCancellationPolicySharedModule } from '@src/modules/hotel-cancellation-policy/modules/hotel-cancellation-policy-shared.module';
import { HotelConfigurationSharedModule } from '@src/modules/hotel-configuration/hotel-configuration-shared.module';
import { HotelPaymentMethodSettingSharedModule } from '@src/modules/hotel-payment-method-setting/modules/hotel-payment-method-setting-shared.module';
import { HotelPaymentTermSharedModule } from '@src/modules/hotel-payment-term/modules/hotel-payment-term-shared.module';
import { HotelRetailFeaturesModule } from '@src/modules/hotel-retail-features/hotel-retail-features.module';
import { HotelRepositoryModule } from '@src/modules/hotel/modules/hotel-repository.module';
import { MappingPmsHotelSharedModule } from '@src/modules/mapping-pms-hotel/modules/mapping-pms-hotel-shared.module';
import { NotificationModule } from '@src/modules/notification';
import { PmsModule } from '@src/modules/pms/pms.module';
import { RatePlanPaymentTermSettingRepository } from '@src/modules/rate-plan-payment-term-setting/repositories/rate-plan-payment-term-setting.repository';
import { RatePlanSettingsModule } from '@src/modules/rate-plan-settings/modules/rate-plan-settings.module';
import { RatePlanRepositoryModule } from '@src/modules/rate-plan/modules/rate-plan-repository.module';
import { RatePlanDerivedSettingRepository } from '@src/modules/rate-plan/repositories/rate-plan-derived-setting.repository';
import { ReservationAmenityDateSharedModule } from '@src/modules/reservation-amenity-date/modules/reservation-amenity-date-shared.module';
import { ReservationAmenitySharedModule } from '@src/modules/reservation-amenity/modules/reservation-amenity-shared.module';
import { ReservationRelatedMrfcSharedModule } from '@src/modules/reservation-related-mrfc/modules/reservation-related-mrfc-shared.module';
import { ReservationRoomSharedModule } from '@src/modules/reservation-room/modules/reservation-room-shared.module';
import { ReservationTimeSliceSharedModule } from '@src/modules/reservation-time-slice/modules/reservation-time-slice-shared.module';
import { ReservationSharedModule } from '@src/modules/reservation/modules/reservation-shared.module';
import { RestrictionModule } from '@src/modules/restriction/restriction.module';
import { RoomProductAvailabilityModule } from '@src/modules/room-product-availability/room-product-availability.module';
import { RoomProductPricingMethodDetailModule } from '@src/modules/room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.module';
import { RoomProductRatePlanRepositoryModule } from '@src/modules/room-product-rate-plan/room-product-rate-plan-repository.module';
import { RoomProductRetailFeatureSharedModule } from '@src/modules/room-product-retail-feature/modules/room-product-retail-feature-shared.module';
import { RoomProductStandardFeatureSharedModule } from '@src/modules/room-product-standard-feature/modules/room-product-standard-feature-shared.module';
import { RoomProductSharedModule } from '@src/modules/room-product/room-product-shared.module';
import { TranslationModule } from '@src/modules/translation';
import { BookingController } from '../controllers/booking.controller';
import { BookingValidatorService } from '../services/booking-validator.service';
import { BookingService } from '../services/booking.service';
import { CreateBookingService } from '../services/create-booking.service';
import { BookingCalculateModule } from './booking-calculate.module';
import { BookingSharedModule } from './booking-shared.module';
import { ReservationModule } from '@src/modules/reservation/modules/reservation.module';
import { PaymentModule } from '@src/modules/payment/payment.module';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { IseSocketClientModule } from '@src/core/client/ise-socket-client.module';

@Module({
  imports: [
    PmsModule,
    // Create Booking Dependency
    ReservationSharedModule,
    GuestSharedModule,
    CompanySharedModule,
    ReservationRoomSharedModule,
    ReservationTimeSliceSharedModule,
    ReservationAmenitySharedModule,
    ReservationAmenityDateSharedModule,
    BookingTransactionSharedModule,
    HotelPaymentMethodSettingSharedModule,
    MappingPmsHotelSharedModule,
    HotelConfigurationSharedModule,
    GlobalPaymentProviderSharedModule,
    GlobalPaymentMethodSharedModule,
    RatePlanRepositoryModule,
    BookingUpsellInformationSharedModule,
    HotelRepositoryModule,
    ConnectorSharedModule,
    RoomProductRatePlanRepositoryModule,
    BookingSharedModule,
    HotelPaymentTermSharedModule,
    HotelCancellationPolicySharedModule,
    NotificationModule,
    HotelRetailFeaturesModule,
    HotelRepositoryModule,
    S3Module,
    RoomProductRetailFeatureSharedModule,
    RoomProductStandardFeatureSharedModule,
    HttpModule,
    ConfigModule,
    RatePlanSettingsModule,
    RoomProductSharedModule,
    RoomProductAvailabilityModule,
    ReservationRelatedMrfcSharedModule,
    HotelAmenitySharedModule,
    RedisModule,
    forwardRef(() => RoomProductPricingMethodDetailModule),
    forwardRef(() => RestrictionModule),
    PricingCalculateModule,
    TranslationModule,
    CityTaxCalculateModule,
    BookingCalculateModule,
    ReservationModule,
    PaymentModule,
    IseSocketClientModule,

    TypeOrmModule.forFeature(
      [
        FileLibrary,
        Hotel,
        HotelAmenity,
        RoomUnit,
        HotelAmenityPrice,
        RoomProductRatePlan,
        RoomProductDailySellingPrice,
        RoomProductExtraOccupancyRate,
        RoomProductRatePlanExtraOccupancyRateAdjustment,
        HotelTaxSetting,
        HotelConfiguration,
        RoomProduct,
        RatePlan,
        HotelCancellationPolicy,
        HotelPaymentTerm,
        RatePlanSellability,
        RatePlanTranslation,
        RatePlanPaymentTermSetting,
        RatePlanDerivedSetting,
        Restriction,
        RoomProductMappingPms,
        HotelRestrictionSetting,
        Connector,
        MewsServiceSettings,
        RatePlanExtraService,
        RoomProductExtra,
        RoomProductDailyAvailability,
        RoomProductAssignedUnit,
        RoomProductRetailFeature,
        RoomProductStandardFeature,
        HotelTax,
        RoomProductPricingMethodDetail,
        HotelCityTax,
        HotelRetailCategory,
        HotelRestrictionIntegrationSetting,
        HotelAgeCategory,
        RatePlanDailyExtraService,
        RatePlanDailyAdjustment,
        BookingProposalSetting
      ],
      DbName.Postgres
    ),
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES.RESTRICTION,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            url: configService.get(ENVIRONMENT.REDIS_URL),
            maxRetriesPerRequest: null,
            db: REDIS_DB.RESTRICTION
          },
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
  providers: [
    BookingService,
    BookingValidatorService,
    CreateBookingService,

    // Repositories not provided by BookingCalculateModule
    RatePlanDerivedSettingRepository,
    RatePlanPaymentTermSettingRepository
  ],
  exports: [TypeOrmModule, BookingCalculateModule],
  controllers: [BookingController]
})
export class BookingModule {}
