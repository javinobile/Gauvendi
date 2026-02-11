import { CacheInterceptor } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { GvdAuthGuard } from "./core/auth/auth.guard";
import { Auth0Module } from "./core/auth/auth.module";
import { RedisCacheModule } from "./core/cache/redis-cache.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BookingModule } from "./modules/booking/booking.module";
import { CountriesModule } from "./modules/countries/countries.module";
import { CppModule } from "./modules/cpp/cpp.module";
import { CurrenciesModule } from "./modules/currencies/currencies.module";
import { ExcelModule } from "./modules/excel/excel.module";
import { FeaturePricingModule } from "./modules/feature-pricing/feature-pricing.module";
import { FeatureModule } from "./modules/feature/feature.module";
import { GlobalPaymentMethodModule } from "./modules/global-payment-method/global-payment-method.module";
import { GlobalPaymentProviderModule } from "./modules/global-payment-provider/global-payment-provider.module";
import { GuestModule } from "./modules/guest/guest.module";
import { HotelAgeCategoriesModule } from "./modules/hotel-age-categories/hotel-age-categories.module";
import { HotelAmenityModule } from "./modules/hotel-amenity/hotel-amenity.module";
import { HotelCityTaxsModule } from "./modules/hotel-city-taxs/hotel-city-taxs.module";
import { HotelConfigurationsModule } from "./modules/hotel-configurations/hotel-configurations.module";
import { HotelEventsModule } from "./modules/hotel-events/hotel-events.module";
import { IntegrationModule } from "./modules/integration/integration.module";
import { HotelMarketSegmentModule } from "./modules/hotel-market-segment/hotel-market-segment.module";
import { HotelPaymentMethodSettingModule } from "./modules/hotel-payment-method-setting/hotel-payment-method-setting.module";
import { HotelPaymentTermModule } from "./modules/hotel-payment-term/hotel-payment-term.module";
import { HotelRestrictionSettingModule } from "./modules/hotel-restriction-setting/hotel-restriction-setting.module";
import { HotelRetailFeatureModule } from "./modules/hotel-retail-feature/hotel-retail-feature.module";
import { HotelTaxsModule } from "./modules/hotel-taxs/hotel-taxs.module";
import { HotelTemplateEmailModule } from "./modules/hotel-template-email/hotel-template-email.module";
import { HotelsModule } from "./modules/hotels/hotels.module";
import { IseRecommendationModule } from "./modules/ise-recommendation/ise-recommendation.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { OrganisationModule } from "./modules/organisation/organisation.module";
import { PmsModule } from "./modules/pms/pms.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { RatePlanPaymentTermSettingModule } from "./modules/rate-plan-payment-term-setting/rate-plan-payment-term-setting.module";
import { RatePlanModule } from "./modules/rate-plan/rate-plan.module";
import { ReservationModule } from "./modules/reservation/reservation.module";
import { RestrictionAutomationSettingModule } from "./modules/restriction-automation-setting/restriction-automation-setting.module";
import { RestrictionModule } from "./modules/restriction/restriction.module";
import { RoomProductAvailabilityModule } from "./modules/room-product-availability/room-product-availability.module";
import { RoomProductRatePlanModule } from "./modules/room-product-rate-plan/room-product-rate-plan.module";
import { RoomProductModule } from "./modules/room-product/room-product.module";
import { RoomUnitModule } from "./modules/room-unit/room-unit.module";
import { SettingsRatePlanModule } from "./modules/settings-rate-plan/settings-rate-plan.module";
import { TranslationModule } from "./modules/translation/translation.module";
import { BusinessIntelligenceModule } from "./modules/business-intelligence/business-intelligence.module";
import { RatePlanPaymentSettlementSettingModule } from "./modules/rate-plan-payment-settlement-setting/rate-plan-payment-settlement-setting.module";
import { FlexiChannelModule } from "./modules/flexi-channel/flexi-channel.module";
import { GoogleHotelModule } from "./modules/google-hotel/google-hotel.module";
import { PropertyTrackingModule } from "./modules/property-tracking/property-tracking.module";
import { ImageModule } from "./modules/image/image.module";
import { GraphqlProxyModule } from "./modules/graphql-proxy/graphql-proxy.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    Auth0Module,
    AuthModule,
    HotelsModule,
    PricingModule,
    SettingsRatePlanModule,
    CurrenciesModule,
    CountriesModule,
    CppModule,
    HotelConfigurationsModule,
    HotelAgeCategoriesModule,
    RoomUnitModule,
    RoomProductModule,
    RoomProductAvailabilityModule,
    RoomProductRatePlanModule,
    RestrictionModule,
    FeatureModule,
    RatePlanModule,
    HotelCityTaxsModule,
    HotelTaxsModule,
    IseRecommendationModule,
    HotelPaymentTermModule,
    RatePlanPaymentTermSettingModule,
    HotelPaymentMethodSettingModule,
    HotelMarketSegmentModule,
    NotificationModule,
    ReservationModule,
    BookingModule,
    OrganisationModule,
    RestrictionAutomationSettingModule,
    HotelEventsModule,
    HotelAmenityModule,
    TranslationModule,
    HotelTemplateEmailModule,
    GlobalPaymentMethodModule,
    GlobalPaymentProviderModule,
    RedisCacheModule,
    PmsModule,
    HotelRestrictionSettingModule,
    HotelRetailFeatureModule,
    ExcelModule,
    GuestModule,
    FeaturePricingModule,
    IntegrationModule,
    BusinessIntelligenceModule,
    RatePlanPaymentSettlementSettingModule,
    FlexiChannelModule,
    GoogleHotelModule,
    PropertyTrackingModule,
    PropertyTrackingModule,
    ImageModule,
    GraphqlProxyModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GvdAuthGuard,
    },
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
  ],
})
export class AppModule { }
