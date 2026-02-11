import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { NotFoundException } from 'src/core/exceptions';
import { Repository } from 'typeorm';
import { BookingFilterDto } from '../dtos/booking.dto';
import { BookingSummaryFilterDto } from '../dtos/booking-status.dto';

@Injectable()
export class BookingRepository {
  private readonly logger = new Logger(BookingRepository.name);
  constructor(
    @InjectRepository(Booking, DB_NAME.POSTGRES)
    private bookingRepository: Repository<Booking>
  ) {}

  async getBooking(id: string): Promise<Booking | null> {
    try {
      return await this.bookingRepository.findOne({
        where: { id },
        relations: ['reservations']
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async getBookingWithRelations(filter: BookingFilterDto): Promise<Booking | null> {
    try {
      const { id } = filter;
      return await this.bookingRepository.findOne({
        where: { id },
        relations: filter.relations
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async updateBooking(booking: Partial<Booking> & Pick<Booking, 'id'>) {
    try {
      await this.bookingRepository.update(booking.id, { ...booking });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async createBooking(body: Partial<Booking>) {
    body.bookingNumber = String(Date.now());
    const booking = this.bookingRepository.create(body);
    try {
      return await this.bookingRepository.save(booking);
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async getBookingSummary(filter: BookingSummaryFilterDto) {
    try {
      const { bookingId } = filter;

      const booking = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.booker', 'booker')
        .leftJoinAndSelect('booking.bookingTransactions', 'bookingTransactions')
        .leftJoinAndSelect('booking.reservations', 'reservations')
        .leftJoinAndSelect('reservations.rfc', 'rfc')
        .leftJoinAndSelect('rfc.roomProductImages', 'roomProductImages')
        // .leftJoinAndSelect('rfc.roomProductRetailFeatures', 'roomProductRetailFeatures')
        // .leftJoinAndSelect('roomProductRetailFeatures.retailFeature', 'retailFeature')
        // .leftJoinAndSelect('rfc.roomProductStandardFeatures', 'roomProductStandardFeatures')
        // .leftJoinAndSelect('roomProductStandardFeatures.standardFeature', 'standardFeature')
        .leftJoinAndSelect('reservations.ratePlan', 'ratePlan')
        .leftJoinAndSelect('reservations.reservationAmenities', 'reservationAmenities')
        .leftJoinAndSelect('reservations.primaryGuest', 'primaryGuest')
        .where('booking.id = :id', { id: bookingId })
        .getOne();

      // const booking = await this.bookingRepository.findOne({
      //   where: { id: bookingId },
      //   relations: [
      //     'reservations',
      //     'booker',
      //     'reservations.rfc',
      //     'reservations.rfc.roomProductImages',
      //     // 'reservations.rfc.roomProductRetailFeatures',
      //     // 'reservations.rfc.roomProductRetailFeatures.retailFeature',
      //     // 'reservations.rfc.roomProductStandardFeatures',
      //     // 'reservations.rfc.roomProductStandardFeatures.standardFeature',
      //     'reservations.ratePlan'
      //   ]
      // });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      return booking;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
