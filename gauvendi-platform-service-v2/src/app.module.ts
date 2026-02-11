import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { QueueModule } from './core/queue/queue.module';
import { BlockModule } from './modules/block/modules/block.module';
import { BookingModule } from './modules/booking/modules/booking.module';
import { CountriesModule } from './modules/countries/countries.module';
import { CppModule } from './modules/cpp/cpp.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { ExcelModule } from './modules/excel/excel.module';
import { FeaturePricingModule } from './modules/feature-pricing/feature-pricing.module';
import { FeatureModule } from './modules/feature/feature.module';
import { GlobalPaymentMethodModule } from './modules/global-payment-method/modules/global-payment-method.module';
import { GlobalPaymentProviderModule } from './modules/global-payment-provider/modules/global-payment-provider.module';
import { GuestModule } from './modules/guest/modules/guest.module';
import { HotelAgeCategoriesModule } from './modules/hotel-age-categories/hotel-age-categories.module';
import { HotelAmenityModule } from './modules/hotel-amenity/hotel-amentity.module';
import { HotelCityTaxModule } from './modules/hotel-city-tax/hotel-city-tax.module';
import { HotelConfigurationsModule } from './modules/hotel-configurations/hotel-configurations.module';
import { HotelEventsModule } from './modules/hotel-events/hotel-events.module';
import { HotelTrackingModule } from './modules/hotel-tracking/hotel-tracking.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { HotelMarketSegmentsModule } from './modules/hotel-market-segments/hotel-market-segments.module';
import { HotelPaymentMethodSettingModule } from './modules/hotel-payment-method-setting/modules/hotel-payment-method-setting.module';
import { HotelPaymentTermModule } from './modules/hotel-payment-term/modules/hotel-payment-term.module';
import { HotelRestrictionSettingModule } from './modules/hotel-restriction-setting/hotel-restriction-setting.module';
import { HotelTaxsModule } from './modules/hotel-taxs/hotel-taxs.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { IseRecommendationModule } from './modules/ise-recommendation/ise-recommendation.module';
import { NotificationModule } from './modules/notification/notification.module';
import { OrganisationModule } from './modules/organisation/modules/organisation.module';
import { ApaleoWebhookModule } from './modules/pms/apaleo-webhook/apaleo-webhook.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { RatePlanDailyAdjustmentModule } from './modules/rate-plan-daily-adjustment/modules/rate-plan-adjustment.module';
import { RatePlanDailyManagementModule } from './modules/rate-plan-daily-management/rate-plan-daily-management.module';
import { RatePlanDailySellabilityModule } from './modules/rate-plan-daily-sellability/modules/rate-plan-daily-sellability.module';
import { RatePlanExtraServiceModule } from './modules/rate-plan-extra-service/modules/rate-plan-extra-service.module';
import { RatePlanFeatureDailyRateModule } from './modules/rate-plan-feature-daily-rate/modules/rate-plan-feature-daily-rate.module';
import { RatePlanPaymentSettlementSettingModule } from './modules/rate-plan-payment-settlement-setting/modules/rate-plan-payment-settlement-setting.module';
import { RatePlanPaymentTermSettingModule } from './modules/rate-plan-payment-term-setting/modules/rate-plan-payment-term-setting.module';
import { RatePlanSellabilityModule } from './modules/rate-plan-sellability/modules/rate-plan-sellability.module';
import { RatePlanSettingsModule } from './modules/rate-plan-settings/modules/rate-plan-settings.module';
import { RatePlanModule } from './modules/rate-plan/modules/rate-plan.module';
import { RatePlansModule } from './modules/rate-plans/rate-plans.module';
import { ReservationModule } from './modules/reservation/modules/reservation.module';
import { RestrictionAutomationSettingModule } from './modules/restriction-automation-setting/modules/restriction-automation-setting.module';
import { RestrictionModule } from './modules/restriction/restriction.module';
import { RoomProductAvailabilityModule } from './modules/room-product-availability/room-product-availability.module';
import { RoomProductExtraOccupancyRateModule } from './modules/room-product-extra-occupancy-rate/modules/room-product-extra-occupancy-rate.module';
import { RoomProductFeatureRateAdjustmentModule } from './modules/room-product-feature-rate-adjustment/modules/room-product-feature-rate-adjustment.module';
import { RoomProductLowestRateCalendarModule } from './modules/room-product-lowest-rate-calendar/modules/room-product-lowest-rate-calendar.module';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentModule } from './modules/room-product-rate-plan-extra-occupancy-rate-adjustment/modules/room-product-rate-plan-extra-occupancy-rate-adjustment.module';
import { RoomProductRatePlanModule } from './modules/room-product-rate-plan/room-product-rate-plan.module';
import { RoomProductRestrictionModule } from './modules/room-product-restriction/room-product-restriction.module';
import { RoomProductModule } from './modules/room-product/room-product.module';
import { RoomUnitModule } from './modules/room-unit/room-unit.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessIntelligenceModule } from './modules/business-intelligence/business-intelligence.module';
import { RedisModule } from './core/redis';
import { GoogleHotelModule } from './modules/google-hotel/google-hotel.module';
import { FlexiChannelModule } from './modules/flexi-channel/flexi-channel.module';
import { ImageModule } from './modules/image/image.module';
const publicModules = [PricingModule, NotificationModule];
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    DatabaseModule,
    RedisModule,
    ...publicModules,
    RatePlanModule,
    RatePlanExtraServiceModule,
    RatePlanDailyAdjustmentModule,
    RatePlanDailySellabilityModule,
    RatePlanFeatureDailyRateModule,
    RatePlanSellabilityModule,
    RoomProductExtraOccupancyRateModule,
    RoomProductFeatureRateAdjustmentModule,
    RoomProductLowestRateCalendarModule,
    RoomProductRatePlanExtraOccupancyRateAdjustmentModule,
    RatePlanPaymentTermSettingModule,
    RatePlanPaymentSettlementSettingModule,
    RatePlanSettingsModule,
    RoomProductModule,
    RoomProductAvailabilityModule,
    RoomUnitModule,
    RoomProductRestrictionModule,
    QueueModule,
    RestrictionModule,
    FeatureModule,
    PricingModule,
    RoomProductRatePlanModule,
    RatePlanModule,
    HotelsModule,
    CurrenciesModule,
    CountriesModule,
    HotelConfigurationsModule,
    IseRecommendationModule,
    HotelAgeCategoriesModule,
    HotelCityTaxModule,
    HotelTaxsModule,
    UsersModule,
    HotelPaymentTermModule,
    HotelPaymentMethodSettingModule,
    HotelMarketSegmentsModule,
    RatePlanDailyManagementModule,
    ReservationModule,
    OrganisationModule,
    RestrictionAutomationSettingModule,
    RatePlansModule,
    HotelEventsModule,
    GlobalPaymentMethodModule,
    GlobalPaymentProviderModule,
    ApaleoWebhookModule,
    HotelRestrictionSettingModule,
    BookingModule,
    CppModule,
    CacheModule.register(),
    HotelAmenityModule,
    ExcelModule,
    GuestModule,
    BlockModule,
    FeaturePricingModule,
    IntegrationModule,
    HotelTrackingModule,
    BusinessIntelligenceModule,
    GoogleHotelModule,
    FlexiChannelModule,
    ImageModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
