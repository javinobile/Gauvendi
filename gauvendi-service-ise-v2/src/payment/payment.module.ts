import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { GlobalPaymentMethod } from 'src/core/entities/hotel-entities/global-payment-method.entity';
import { GlobalPaymentProvider } from 'src/core/entities/hotel-entities/global-payment-provider.entity';
import { HotelCancellationPolicy } from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelPaymentMethodSetting } from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { HotelPaymentTerm } from 'src/core/entities/hotel-entities/hotel-payment-term.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RatePlanDerivedSetting } from 'src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanPaymentTermSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanCxlPolicyDaily } from 'src/core/entities/rate-plan-cxl-policy-daily.entity';
import { RatePlanDailyPaymentTerm } from 'src/core/entities/rate-plan-daily-payment-term.entity';
import { SellingRatePlanModule } from 'src/modules/hotel-rate-plan/selling-rate-plan.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    SellingRatePlanModule,

    TypeOrmModule.forFeature(
      [
        Hotel,
        RatePlan,
        GlobalPaymentMethod,
        GlobalPaymentProvider,
        HotelPaymentMethodSetting,
        RatePlanPaymentTermSetting,
        HotelCancellationPolicy,
        HotelPaymentTerm,
        RatePlanDailyPaymentTerm,
        RatePlanDerivedSetting,
        RatePlanCxlPolicyDaily
      ],
      DB_NAME.POSTGRES
    ),
    ConfigModule
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService]
})
export class PaymentModule {}
