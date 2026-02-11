import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Filter } from '@src/core/dtos/common.dto';
import { BookingTransaction } from '@src/core/entities/booking-entities/booking-transaction.entity';
import { BadRequestException } from '@src/core/exceptions';
import { Repository } from 'typeorm';
import { BookingTransactionFilterDto } from '../dtos/booking-transaction.dto';

@Injectable()
export class BookingTransactionRepository {
  constructor(
    @InjectRepository(BookingTransaction, DbName.Postgres)
    private readonly bookingTransactionRepository: Repository<BookingTransaction>
  ) {}

  async getBookingTransactionByBookingId(bookingId: string): Promise<BookingTransaction | null> {
    try {
      const bookingTransaction = await this.bookingTransactionRepository.findOne({
        where: { bookingId }
      });
      return bookingTransaction;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createBookingTransaction(body: Partial<BookingTransaction>): Promise<BookingTransaction> {
    try {
      const bookingTransaction = await this.bookingTransactionRepository.save(body);

      return bookingTransaction;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateBookingTransaction(
    body: Partial<BookingTransaction> & Pick<BookingTransaction, 'id'>
  ): Promise<void> {
    try {
      await this.bookingTransactionRepository.update(body.id, { ...body });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getBookingTransactions(filter: BookingTransactionFilterDto): Promise<BookingTransaction[]> {
    try {
      const { bookingIds } = filter;
      if (!bookingIds?.length) return [];

      const queryBuilder =
        this.bookingTransactionRepository.createQueryBuilder('bookingTransaction');
      queryBuilder.where('bookingTransaction.bookingId IN (:...bookingIds)', { bookingIds });
      if (filter.relations?.length) {
        Filter.setQueryBuilderRelations(queryBuilder, 'bookingTransaction', filter.relations);
      }
      // If isPmsSync is not true or false, no additional filtering is applied
      return await queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async upsertBookingTransactions(
    bookingTransactions: Partial<BookingTransaction>[]
  ): Promise<void> {
    await this.bookingTransactionRepository.upsert(bookingTransactions, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true
    });
  }
}
