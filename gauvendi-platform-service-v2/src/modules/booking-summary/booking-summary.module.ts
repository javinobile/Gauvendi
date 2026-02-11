import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { S3Module } from '@src/core/s3/s3.module';
import { HotelCancellationPolicySharedModule } from '@src/modules/hotel-cancellation-policy/modules/hotel-cancellation-policy-shared.module';
import { HotelPaymentTermSharedModule } from '@src/modules/hotel-payment-term/modules/hotel-payment-term-shared.module';
import { HotelRetailFeaturesModule } from '@src/modules/hotel-retail-features/hotel-retail-features.module';
import { RoomProductAvailabilityModule } from '@src/modules/room-product-availability/room-product-availability.module';
import { RoomProductRetailFeatureSharedModule } from '@src/modules/room-product-retail-feature/modules/room-product-retail-feature-shared.module';
import { RoomProductStandardFeatureSharedModule } from '@src/modules/room-product-standard-feature/modules/room-product-standard-feature-shared.module';
import { BookingSharedModule } from '../booking/modules/booking-shared.module';
import { GuestSharedModule } from '../guest/modules/guest-shared.module';
import { HotelCityTaxRepositoryModule } from '../hotel-city-tax/hotel-city-tax-repository.module';
import { HotelTaxRepositoryModule } from '../hotel-tax/modules/hotel-tax-repository.module';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { ReservationAmenitySharedModule } from '../reservation-amenity/modules/reservation-amenity-shared.module';
import { BookingSummaryService } from './booking-summary.service';
import { GlobalPaymentMethodSharedModule } from '../global-payment-method/modules/global-payment-method-shared.module';
import { TranslationModule } from '../translation/translation.module';
import { HotelAmenitySharedModule } from '../hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelPaymentMethodSetting } from '@src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';

@Module({
  imports: [
    HotelPaymentTermSharedModule,
    HotelCancellationPolicySharedModule,
    ReservationAmenitySharedModule,
    BookingSharedModule,
    HotelRetailFeaturesModule,

    S3Module,
    GuestSharedModule,
    HotelTaxRepositoryModule,
    RoomProductRetailFeatureSharedModule,
    RoomProductStandardFeatureSharedModule,
    TypeOrmModule.forFeature([RoomUnit, HotelPaymentMethodSetting, RoomProduct], DbName.Postgres),
    RoomProductAvailabilityModule,
    HotelCityTaxRepositoryModule,
    HotelRepositoryModule,
    GlobalPaymentMethodSharedModule,
    HotelAmenitySharedModule,
    TranslationModule
  ],
  providers: [BookingSummaryService],
  exports: [BookingSummaryService]
})
export class BookingSummaryModule {}
