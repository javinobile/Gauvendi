import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { BookingTransaction } from '@src/core/entities/booking-entities/booking-transaction.entity';
import { BookingTransactionRepository } from '../repositories/booking-transaction.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BookingTransaction], DbName.Postgres)],
  providers: [BookingTransactionRepository],
  exports: [BookingTransactionRepository]
})
export class BookingTransactionSharedModule {}
