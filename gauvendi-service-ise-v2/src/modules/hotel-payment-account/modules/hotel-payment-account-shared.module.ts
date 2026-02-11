import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelPaymentAccount } from 'src/core/entities/hotel-entities/hotel-payment-account.entity';
import { HotelPaymentAccountRepository } from '../repositories/hotel-payment-account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelPaymentAccount], DB_NAME.POSTGRES)],
  providers: [HotelPaymentAccountRepository],
  exports: [HotelPaymentAccountRepository]
})
export class HotelPaymentAccountSharedModule {}

