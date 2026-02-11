import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductPricingMethodDetailModule } from '@src/modules/room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { HotelRepositoryModule } from 'src/modules/hotel/modules/hotel-repository.module';
import { HotelTaxRepository } from '../repositories/hotel-tax.repository';

@Module({
  imports: [
    HotelRepositoryModule,
    TypeOrmModule.forFeature([HotelTax, HotelTaxSetting, RatePlan], DbName.Postgres),
    RoomProductPricingMethodDetailModule,
  ],
  providers: [HotelTaxRepository],
  exports: [HotelTaxRepository]
})
export class HotelTaxRepositoryModule {}
