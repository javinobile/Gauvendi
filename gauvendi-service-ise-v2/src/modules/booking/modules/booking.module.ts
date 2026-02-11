import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bullmq';
import { PlatformClientModule } from 'src/core/clients/platform-client.module';
import { QUEUE_NAMES } from 'src/core/modules/queue/queue.constant';
import { S3Module } from 'src/core/s3/s3.module';
import { OhipModule } from 'src/integration/ohip/ohip.module';
import { PaymentModule } from 'src/integration/payment/payment.module';
import { PmsModule } from 'src/integration/pms/pms.module';
import { AvailabilityModule } from 'src/modules/availability/availability.module';
import { BookingCalculateModule } from 'src/modules/booking-calculate/booking-calculate.module';
import { BookingTransactionSharedModule } from 'src/modules/booking-transaction/modules/booking-transaction-shared.module';
import { BookingUpsellInformationSharedModule } from 'src/modules/booking-upsell-information/modules/booking-upsell-information-shared.module';
import { CompanySharedModule } from 'src/modules/company/modules/company-shared.module';
import { ConnectorSharedModule } from 'src/modules/connector/modules/connector-shared.module';
import { CustomerPaymentGatewaySharedModule } from 'src/modules/customer-payment-gateway/modules/customer-payment-gateway-shared.module';
import { GuestSharedModule } from 'src/modules/guest/modules/guest-shared.module';
import { HotelAmenitySharedModule } from 'src/modules/hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelCancellationPolicySharedModule } from 'src/modules/hotel-cancellation-policy/modules/hotel-cancellation-policy-shared.module';
import { HotelCityTaxRepositoryModule } from 'src/modules/hotel-city-tax/hotel-city-tax-repository.module';
import { HotelConfigurationSharedModule } from 'src/modules/hotel-configuration/hotel-configuration-shared.module';
import { HotelPaymentMethodSettingSharedModule } from 'src/modules/hotel-payment-method-setting/modules/hotel-payment-method-setting-shared.module';
import { HotelPaymentTermSharedModule } from 'src/modules/hotel-payment-term/modules/hotel-payment-term-shared.module';
import { HotelRetailFeaturesModule } from 'src/modules/hotel-retail-features/hotel-retail-features.module';
import { HotelTaxRepositoryModule } from 'src/modules/hotel-tax/hotel-tax-repository.module';
import { HotelSharedModule } from 'src/modules/hotel-v2/modules/hotel-shared.module';
import { HotelModule } from 'src/modules/hotel/hotel.module';
import { MappingPmsHotelSharedModule } from 'src/modules/mapping-pms-hotel/modules/mapping-pms-hotel-shared.module';
import { RatePlanSharedModule } from 'src/modules/rate-plan/modules/rate-plan-shared.module';
import { ReservationAmenityDateSharedModule } from 'src/modules/reservation-amenity-date/modules/reservation-amenity-date-shared.module';
import { ReservationAmenitySharedModule } from 'src/modules/reservation-amenity/modules/reservation-amenity-shared.module';
import { ReservationRelatedMrfcSharedModule } from 'src/modules/reservation-related-mrfc/modules/reservation-related-mrfc-shared.module';
import { ReservationRoomSharedModule } from 'src/modules/reservation-room/modules/reservation-room-shared.module';
import { ReservationTimeSliceSharedModule } from 'src/modules/reservation-time-slice/modules/reservation-time-slice-shared.module';
import { ReservationSharedModule } from 'src/modules/reservation/modules/reservation-shared.module';
import { RoomProductRetailFeatureSharedModule } from 'src/modules/room-product-retail-feature/modules/room-product-retail-feature-shared.module';
import { RoomProductStandardFeatureSharedModule } from 'src/modules/room-product-standard-feature/modules/room-product-standard-feature-shared.module';
import { RoomProductSharedModule } from 'src/modules/room-product/modules/room-product-shared.module';
import { TranslationSharedModule } from 'src/modules/translation/modules/translation-shared.module';
import { HotelPaymentAccountSharedModule } from 'src/modules/hotel-payment-account/modules/hotel-payment-account-shared.module';
import { WsModule } from 'src/ws/ws.module';
import { BookingController } from '../controllers/booking.controller';
import { BookingConsumer } from '../queue/booking-consumer';
import { BookingStatusService } from '../services/booking-status.service';
import { BookingSummaryService } from '../services/booking-summary.service';
import { BookingValidatorService } from '../services/booking-validator.service';
import { BookingService } from '../services/booking.service';
import { CreateBookingService } from '../services/create-booking.service';
import { BookingSharedModule } from './booking-shared.module';
import { BookingQueueEvents } from '../queue/booking-queue-events';
import { Company } from 'src/core/entities/booking-entities/company.entity';
import { DB_NAME } from 'src/core/constants/db.const';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IseClientModule } from 'src/core/clients/ise-client.module';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';

@Module({
  imports: [
    OhipModule,
    PaymentModule,
    WsModule,
    BookingSharedModule,
    PmsModule,
    HotelConfigurationSharedModule,
    HotelPaymentMethodSettingSharedModule,
    MappingPmsHotelSharedModule,
    HotelSharedModule,
    ConnectorSharedModule,
    BookingTransactionSharedModule,
    BookingUpsellInformationSharedModule,
    ReservationAmenityDateSharedModule,
    ReservationAmenitySharedModule,
    ReservationRelatedMrfcSharedModule,
    ReservationRoomSharedModule,
    ReservationTimeSliceSharedModule,
    ReservationSharedModule,
    CompanySharedModule,
    CustomerPaymentGatewaySharedModule,
    GuestSharedModule,
    S3Module,
    HotelRetailFeaturesModule,
    RoomProductRetailFeatureSharedModule,
    RoomProductStandardFeatureSharedModule,
    HotelPaymentTermSharedModule,
    HotelCancellationPolicySharedModule,
    BookingCalculateModule,
    PlatformClientModule,
    IseClientModule,
    AvailabilityModule,
    HotelModule,
    RatePlanSharedModule,
    RoomProductSharedModule,
    HotelTaxRepositoryModule,
    HotelCityTaxRepositoryModule,
    HotelAmenitySharedModule,
    TranslationSharedModule,
    HotelPaymentAccountSharedModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.BOOKING
    }),
    TypeOrmModule.forFeature([Company, RoomProduct, RatePlan], DB_NAME.POSTGRES)
  ],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingValidatorService,
    CreateBookingService,
    BookingStatusService,
    BookingSummaryService,
    BookingConsumer,
    BookingQueueEvents
  ]
})
export class BookingModule {}
