import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { BookingUpsellInformation } from 'src/core/entities/booking-entities/booking-upsell-information.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BookingUpsellInformationRepository {
  private readonly logger = new Logger(BookingUpsellInformationRepository.name);

  constructor(
    @InjectRepository(BookingUpsellInformation, DB_NAME.POSTGRES)
    private bookingUpsellInformationRepository: Repository<BookingUpsellInformation>
  ) {}

  async createBookingUpsellInformation(
    body: BookingUpsellInformation
  ): Promise<BookingUpsellInformation | null> {
    try {
      return await this.bookingUpsellInformationRepository.save(body);
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }
}
