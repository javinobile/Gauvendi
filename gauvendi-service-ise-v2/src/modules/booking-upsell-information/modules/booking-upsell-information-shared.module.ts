import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { BookingUpsellInformation } from 'src/core/entities/booking-entities/booking-upsell-information.entity';
import { BookingUpsellInformationRepository } from '../repositories/booking-upsell-information.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BookingUpsellInformation], DB_NAME.POSTGRES), ConfigModule],
  providers: [BookingUpsellInformationRepository],
  exports: [BookingUpsellInformationRepository]
})
export class BookingUpsellInformationSharedModule {}
