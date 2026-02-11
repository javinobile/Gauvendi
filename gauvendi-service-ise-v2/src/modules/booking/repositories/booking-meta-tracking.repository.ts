import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { BookingMetaTracking } from 'src/core/entities/booking-entities/booking-meta-tracking.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BookingMetaTrackingRepository {
  private readonly logger = new Logger(BookingMetaTrackingRepository.name);

  constructor(
    @InjectRepository(BookingMetaTracking, DB_NAME.POSTGRES)
    private bookingMetaTrackingRepository: Repository<BookingMetaTracking>
  ) {}

  async createMetaTracking(data: Partial<BookingMetaTracking>): Promise<BookingMetaTracking> {
    try {
      const metaTracking = this.bookingMetaTrackingRepository.create(data);
      return await this.bookingMetaTrackingRepository.save(metaTracking);
    } catch (error) {
      this.logger.error(`Failed to create meta tracking: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async getByBookingId(bookingId: string): Promise<BookingMetaTracking | null> {
    try {
      return await this.bookingMetaTrackingRepository.findOne({
        where: { bookingId }
      });
    } catch (error) {
      this.logger.error(`Failed to get meta tracking: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
