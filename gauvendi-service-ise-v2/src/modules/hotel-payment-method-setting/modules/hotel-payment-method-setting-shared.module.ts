import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelPaymentMethodSetting } from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { HotelPaymentMethodSettingRepository } from '../repositories/hotel-payment-method-setting.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelPaymentMethodSetting], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelPaymentMethodSettingRepository],
  exports: [HotelPaymentMethodSettingRepository]
})
export class HotelPaymentMethodSettingSharedModule {}
