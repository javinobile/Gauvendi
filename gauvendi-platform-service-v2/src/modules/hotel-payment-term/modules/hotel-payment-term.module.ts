import { Module } from '@nestjs/common';
import { GlobalPaymentMethodSharedModule } from '@src/modules/global-payment-method/modules/global-payment-method-shared.module';
import { HotelPaymentTermController } from '../controllers/hotel-payment-term.controller';
import { HotelPaymentTermService } from '../services/hotel-payment-term.service';
import { HotelPaymentTermSharedModule } from './hotel-payment-term-shared.module';

@Module({
  imports: [HotelPaymentTermSharedModule, GlobalPaymentMethodSharedModule],
  controllers: [HotelPaymentTermController],
  providers: [HotelPaymentTermService]
})
export class HotelPaymentTermModule {}
