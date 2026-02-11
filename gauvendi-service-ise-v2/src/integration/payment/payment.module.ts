import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BookingSharedModule } from 'src/modules/booking/modules/booking-shared.module';
import { BookingTransactionSharedModule } from 'src/modules/booking-transaction/modules/booking-transaction-shared.module';
import { CustomerPaymentGatewaySharedModule } from 'src/modules/customer-payment-gateway/modules/customer-payment-gateway-shared.module';
import { ReservationSharedModule } from 'src/modules/reservation/modules/reservation-shared.module';
import { WsModule } from 'src/ws/ws.module';
import { PaymentService } from './payment.service';
import { ApaleoPaymentService } from './services/apaleo-payment.service';
import { MewsPaymentService } from './services/mews-payment.service';
import { PaymentInterfaceService } from './services/payment-interface.service';
import { PayPalPaymentService } from './services/paypal-payment.service';
import { RatePlanPaymentSettlementSettingSharedModule } from 'src/modules/rate-plan-payment-settlement-setting/modules/rate-plan-payment-settlement-setting-shared.module';
import { GauvendiPaymentService } from './services/gauvendi-payment.service';

@Module({
  imports: [
    HttpModule,
    BookingSharedModule,
    BookingTransactionSharedModule,
    WsModule,
    CustomerPaymentGatewaySharedModule,
    ReservationSharedModule,
    RatePlanPaymentSettlementSettingSharedModule
  ],
  exports: [PaymentService, PaymentInterfaceService],
  providers: [
    PaymentService,
    PaymentInterfaceService,
    MewsPaymentService,
    ApaleoPaymentService,
    PayPalPaymentService,
    GauvendiPaymentService
  ]
})
export class PaymentModule {}
