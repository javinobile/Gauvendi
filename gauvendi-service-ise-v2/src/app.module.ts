import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { QueueModule } from './core/modules/queue/queue.module';
import { RedisModule } from './core/modules/redis/redis.module';
import { BookingCalculateModule } from './modules/booking-calculate/booking-calculate.module';
import { BookingModule } from './modules/booking/modules/booking.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CountryListModule } from './modules/country-list/country-list.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { HotelAmenityModule } from './modules/hotel-amenity/modules/hotel-amenity.module';
import { HotelConfigurationModule } from './modules/hotel-configuration/hotel-configuration.module';
import { HotelRatePlanModule } from './modules/hotel-rate-plan/hotel-rate-plan.module';
import { HotelRetailCategoryModule } from './modules/hotel-retail-category/hotel-retail-category.module';
import { HotelRetailFeaturesModule } from './modules/hotel-retail-features/hotel-retail-features.module';
import { HotelTemplateEmailModule } from './modules/hotel-template-email/modules/hotel-template-email.module';
import { IseRecommendationModule } from './modules/ise-recommendation/ise-recommendation.module';
import { RoomProductHotelExtraListModule } from './modules/room-product-hotel-extra-list/room-product-hotel-extra-list.module';
import { RoomProductModule } from './modules/room-product/modules/room-product.module';
import { WidgetEventFeatureRecommendationModule } from './modules/widget-event-feature-recommendation/widget-event-feature-recommendation.module';
import { PaymentModule } from './payment/payment.module';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    QueueModule,
    WsModule,
    BookingModule,
    CalendarModule,
    CurrencyModule,
    HotelRetailCategoryModule,
    HotelRetailFeaturesModule,
    HotelConfigurationModule,
    HotelRetailFeaturesModule,
    HotelRatePlanModule,
    RoomProductModule,
    WidgetEventFeatureRecommendationModule,
    IseRecommendationModule,
    CountryListModule,
    PaymentModule,
    HotelTemplateEmailModule,
    HotelTemplateEmailModule,
    RoomProductHotelExtraListModule,
    HotelAmenityModule,
    BookingCalculateModule
  ],
  providers: [AppService],
  controllers: [AppController]
})
export class AppModule {}
