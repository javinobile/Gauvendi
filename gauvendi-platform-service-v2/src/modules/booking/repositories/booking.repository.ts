import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from '@src/core/constants/db.const';
import { Filter } from '@src/core/dtos/common.dto';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { BadRequestException, NotFoundException } from '@src/core/exceptions';
import { Repository } from 'typeorm';
import { BookingFilterDto, BookingSummaryFilterDto } from '../dtos/booking.dto';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(Booking, DB_NAME.POSTGRES)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(BookingProposalSetting, DB_NAME.POSTGRES)
    private readonly bookingProposalSettingRepository: Repository<BookingProposalSetting>
  ) {}

  async getBooking(id: string, relations?: string[]): Promise<Booking | null> {
    try {
      return await this.bookingRepository.findOne({
        where: { id },
        relations: relations || {
          reservations: {
            primaryGuest: true
          }
        }
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  async getBookingByNumber(bookingNumber: string, relations?: string[]): Promise<Booking | null> {
    try {
      return await this.bookingRepository.findOne({
        where: { bookingNumber },
        relations: relations || ['reservations']
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createBooking(body: Partial<Booking>) {
    body.bookingNumber = String(Date.now());
    const booking = this.bookingRepository.create(body);
    try {
      return await this.bookingRepository.save(booking);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createProposalSetting(body: Partial<BookingProposalSetting>) {
    const setting = this.bookingProposalSettingRepository.create(body);
    try {
      return await this.bookingProposalSettingRepository.save(setting);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateBooking(booking: Partial<Booking> & Pick<Booking, 'id'>) {
    try {
      await this.bookingRepository.update(booking.id, { ...booking });
    } catch (error) {
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
        .andWhere('booking.deletedAt IS NULL')
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

  async getBookings(filter: BookingFilterDto) {
    try {
      const { bookingMappingCodes, hotelId, bookingNumber, ids } = filter;
      const queryBuilder = this.bookingRepository.createQueryBuilder('booking');

      // Filter out soft-deleted records
      queryBuilder.andWhere('booking.deletedAt IS NULL');

      if (ids?.length) {
        queryBuilder.andWhere('booking.id IN (:...ids)', { ids });
      }

      if (bookingMappingCodes?.length) {
        queryBuilder.andWhere('booking.mappingBookingCode IN (:...bookingMappingCodes)', {
          bookingMappingCodes
        });
      }
      if (hotelId) {
        queryBuilder.andWhere('booking.hotelId = :hotelId', { hotelId });
      }
      if (bookingNumber) {
        queryBuilder.andWhere('booking.bookingNumber = :bookingNumber', { bookingNumber });
      }
      if (filter.relations?.length) {
        Filter.setQueryBuilderRelations(queryBuilder, 'booking', filter.relations);
      }
      return await queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getBookingsWithRoomDetails(filter: BookingFilterDto) {
    try {
      const { bookingMappingCodes } = filter;
      const queryBuilder = this.bookingRepository.createQueryBuilder('booking');
      
      // Filter out soft-deleted records
      queryBuilder.andWhere('booking.deletedAt IS NULL');
      
      if (bookingMappingCodes?.length) {
        queryBuilder.andWhere('booking.mappingBookingCode IN (:...bookingMappingCodes)', {
          bookingMappingCodes
        });
      }
      if (filter.relations?.length) {
        Filter.setQueryBuilderRelations(queryBuilder, 'booking', filter.relations);
      }
      return await queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async upsertBookings(bookings: Partial<Booking>[]) {
    await this.bookingRepository.upsert(bookings, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true
    });
  }

  async getById(id: string) {
    return this.bookingRepository.findOne({
      where: { id }
    });
  }
}
