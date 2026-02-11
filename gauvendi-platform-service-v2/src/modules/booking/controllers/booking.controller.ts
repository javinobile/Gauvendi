import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import {
  BookingFilterDto,
  BookingForm,
  CalculatePricingDto,
  UpdateBookingBookerInfoDto
} from '../dtos/booking.dto';
import { CppRequestBookingInputDto } from '../dtos/cpp-request-booking.dto';
import { BookingCalculateService } from '../services/booking-calculate.service';
import { BookingService } from '../services/booking.service';
import { AfterPaymentDto, RequestBookingDto } from '../dtos/request-booking.dto';
import { ConfirmBookingProposalInputDto } from '../dtos/confirm-booking-proposal.dto';

@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly bookingCalculateService: BookingCalculateService
  ) {}

  @MessagePattern({ cmd: CMD.BOOKING.DETAILS })
  async getBookingDetails(@Payload() filter: BookingFilterDto) {
    return await this.bookingService.getBookingDetails(filter);
  }

  @MessagePattern({ cmd: CMD.BOOKING.OVERVIEW })
  async getBookingOverview(@Payload() filter: BookingFilterDto) {
    return await this.bookingService.getBookingOverview(filter);
  }

  @MessagePattern({ cmd: CMD.BOOKING.BOOKER_INFO })
  async getBookerInfo(@Payload() filter: BookingFilterDto) {
    return await this.bookingService.getBookerInfo(filter);
  }

  @MessagePattern({ cmd: CMD.BOOKING.UPDATE_BOOKER_INFO })
  async updateBookerInfo(
    @Payload() payload: { bookingNumber: string; input: UpdateBookingBookerInfoDto }
  ) {
    return await this.bookingService.updateBookerInfo(payload.bookingNumber, payload.input);
  }

  @MessagePattern({ cmd: CMD.BOOKING.PAYMENT_METHODS })
  async getBookingPaymentMethods(@Payload() input: BookingFilterDto) {
    return await this.bookingService.getBookingPaymentMethods(input);
  }

  @MessagePattern({ cmd: CMD.BOOKING.CALCULATE_PRICING })
  async calculateBookingPricing(@Payload() input: CalculatePricingDto) {
    return await this.bookingCalculateService.calculateBookingPricing({
      hotelId: input.hotelId,
      isCityTaxIncluded: true,
      reservations: input.reservationList?.map((reservation) => ({
        ...reservation,
        childrenAges: reservation.childrenAgeList,
        roomProductId: reservation.rfcId,
        ratePlanId: reservation.ratePlanId,
        pets: reservation.pets
      }))
    });
  }

  @MessagePattern({ cmd: CMD.BOOKING.CREATE_CPP_REQUEST_BOOKING })
  async createBooking(@Payload() input: CppRequestBookingInputDto) {
    return await this.bookingService.cppRequestBooking(input);
  }

  @MessagePattern({ cmd: CMD.BOOKING.REQUEST_BOOKING_CREATION })
  async requestBookingCreation(@Payload() input: RequestBookingDto) {
    return await this.bookingService.requestBooking(input);
  }

  @MessagePattern({ cmd: CMD.BOOKING.HANDLE_AFTER_PAYMENT })
  async handleAfterPayment(@Payload() input: AfterPaymentDto) {
    input.isAfterHandleSocketPayment = true;
    return await this.bookingService.handleAfterPayment(input);
  }

  @MessagePattern({ cmd: CMD.BOOKING.CPP_CONFIRM_PAYMENT_BOOKING })
  async cppConfirmPaymentBooking(@Payload() input: ConfirmBookingProposalInputDto) {
    return await this.bookingService.cppConfirmPaymentBooking(input);
  }
}
