import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { BookingTransaction } from 'src/core/entities/booking-entities/booking-transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BookingTransactionRepository {
  private readonly logger = new Logger(BookingTransactionRepository.name);

  constructor(
    @InjectRepository(BookingTransaction, DB_NAME.POSTGRES)
    private bookingTransactionRepository: Repository<BookingTransaction>
  ) {}

  async createBookingTransaction(body: Partial<BookingTransaction>): Promise<BookingTransaction> {
    try {
      const bookingTransaction = await this.bookingTransactionRepository.save(body);
      this.logger.log(`Booking transaction created: ${bookingTransaction?.id}`);
      return bookingTransaction;
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error);
    }
  }

  async updateBookingTransaction(
    body: Partial<BookingTransaction> & Pick<BookingTransaction, 'id'>
  ): Promise<void> {
    try {
      const bookingTransaction = await this.bookingTransactionRepository.findOne({
        where: { id: body.id }
      });
      if (!bookingTransaction) {
        throw new BadRequestException('Booking transaction not found');
      }
      body.paymentMessages = [
        ...(body.paymentMessages || []),
        ...(bookingTransaction.paymentMessages || [])
      ];
      await this.bookingTransactionRepository.update(body.id, { ...body });
      this.logger.log(`Booking transaction updated: ${body?.id}`);
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error);
    }
  }

  async getBookingTransactionByBookingId(bookingId: string): Promise<BookingTransaction | null> {
    try {
      const bookingTransaction = await this.bookingTransactionRepository.findOne({
        where: { bookingId }
      });
      this.logger.log(`Booking transaction found: ${bookingTransaction?.id}`);
      return bookingTransaction;
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error);
    }
  }
}
