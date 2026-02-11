import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelPaymentMethodSetting } from '@src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { HotelPaymentMethodSettingRepository } from '../repositories/hotel-payment-method-setting.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelPaymentMethodSetting], DbName.Postgres)],
  providers: [HotelPaymentMethodSettingRepository],
  exports: [HotelPaymentMethodSettingRepository]
})
export class HotelPaymentMethodSettingSharedModule {}
