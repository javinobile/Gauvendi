import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BookingSharedModule } from 'src/modules/booking/modules/booking-shared.module';
import { BookingTransactionSharedModule } from 'src/modules/booking-transaction/modules/booking-transaction-shared.module';
import { ReservationSharedModule } from 'src/modules/reservation/modules/reservation-shared.module';
import { PaymentService } from './payment.service';
import { ApaleoPaymentService } from './services/apaleo-payment.service';
import { MewsPaymentService } from './services/mews-payment.service';
import { PaymentInterfaceService } from './services/payment-interface.service';
import { PayPalPaymentService } from './services/paypal-payment.service';
import { GauvendiPaymentService } from './services/gauvendi-payment.service';
import { RatePlanPaymentSettlementSettingSharedModule } from '../rate-plan-payment-settlement-setting/modules/rate-plan-payment-settlement-setting-shared.module';
import { CustomerPaymentGatewaySharedModule } from '../customer-payment-gateway/modules/customer-payment-gateway-shared.module';
import { IseSocketClientModule } from '@src/core/client/ise-socket-client.module';

@Module({
  imports: [
    HttpModule,
    BookingSharedModule,
    BookingTransactionSharedModule,
    CustomerPaymentGatewaySharedModule,
    ReservationSharedModule,
    RatePlanPaymentSettlementSettingSharedModule,
    IseSocketClientModule
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
