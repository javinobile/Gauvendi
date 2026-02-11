import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { BookingTransaction } from 'src/core/entities/booking-entities/booking-transaction.entity';
import { BookingTransactionRepository } from '../repositories/booking-transaction.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BookingTransaction], DB_NAME.POSTGRES), ConfigModule],
  providers: [BookingTransactionRepository],
  exports: [BookingTransactionRepository]
})
export class BookingTransactionSharedModule {}
