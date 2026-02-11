import { Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException } from 'src/core/exceptions';
import { BookingStatusFilterDto, BookingStatusResponseDto } from '../dtos/booking-status.dto';
import { BookingRepository } from '../repositories/booking.repository';
import { PaymentProviderCodeEnum } from 'src/core/enums/payment';

@Injectable()
export class BookingStatusService {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async getBookingStatus(filter: BookingStatusFilterDto): Promise<BookingStatusResponseDto> {
    try {
      const booking = await this.bookingRepository.getBookingWithRelations({
        id: filter.bookingId,
        relations: ['reservations', 'bookingTransactions']
      });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      const authenticationActionData = JSON.parse(
        booking.bookingTransactions?.[0]?.authenticationActionData || '{}'
      );
      return {
        booking: booking,
        bookingTransaction: booking.bookingTransactions?.[0],
        action: {
          ...authenticationActionData
        }
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
