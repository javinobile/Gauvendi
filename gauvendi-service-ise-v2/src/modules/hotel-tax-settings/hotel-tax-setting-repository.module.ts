import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTaxSettingRepository } from './hotel-tax-setting.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelTaxSetting], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelTaxSettingRepository],
  exports: [HotelTaxSettingRepository]
})
export class HotelTaxSettingRepositoryModule {}
