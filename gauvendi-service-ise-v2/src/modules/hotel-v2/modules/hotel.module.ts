import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { CurrencyModule } from 'src/modules/currency/currency.module';
import { HotelController } from '../controllers/hotel.controller';
import { HotelService } from '../services/hotel.service';
import { HotelSharedModule } from './hotel-shared.module';
@Module({
  imports: [
    HotelSharedModule,
    TypeOrmModule.forFeature([HotelTaxSetting, HotelAmenity], DB_NAME.POSTGRES),
    S3Module,
    CurrencyModule
  ],
  controllers: [HotelController],
  providers: [HotelService],
  exports: [HotelService]
})
export class HotelModule {}
