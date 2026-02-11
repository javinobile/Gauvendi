import { DbName } from '@constants/db-name.constant';
import { HotelTaxSetting } from '@entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from '@entities/hotel-entities/hotel-tax.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PmsModule } from '../pms/pms.module';
import { HotelTaxsController } from './hotel-taxs.controller';
import { HotelTaxsService } from './hotel-taxs.service';

@Module({
  controllers: [HotelTaxsController],
  providers: [HotelTaxsService],
  imports: [
    TypeOrmModule.forFeature([HotelTax, HotelTaxSetting, Hotel], DbName.Postgres),
    PmsModule
  ]
})
export class HotelTaxsModule {}
