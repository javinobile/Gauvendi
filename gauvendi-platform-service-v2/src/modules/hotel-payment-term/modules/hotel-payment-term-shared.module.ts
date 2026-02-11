import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { HotelPaymentTermRepository } from '../repositories/hotel-payment-term.repository';
import { RatePlanPaymentTermSetting } from '@src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HotelPaymentTerm, RatePlanPaymentTermSetting], DbName.Postgres)],
  providers: [HotelPaymentTermRepository],
  exports: [HotelPaymentTermRepository]
})
export class HotelPaymentTermSharedModule {}
