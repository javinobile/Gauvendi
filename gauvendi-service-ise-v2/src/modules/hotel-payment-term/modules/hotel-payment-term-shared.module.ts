import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelPaymentTerm } from 'src/core/entities/hotel-entities/hotel-payment-term.entity';
import { HotelPaymentTermRepository } from 'src/modules/hotel-payment-term/repositories/hotel-payment-term.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelPaymentTerm], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelPaymentTermRepository],
  exports: [HotelPaymentTermRepository]
})
export class HotelPaymentTermSharedModule {}
