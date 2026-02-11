import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { BookingFilterDto, CalculatePricingDto, UpdateBookingBookerInfoDto } from "./booking.dto";
import { CppRequestBookingInputDto } from "./dto/cpp-request-booking.dto";

@Injectable()
export class BookingService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy) {}

  getBookingDetails(query: BookingFilterDto) {
    return this.hotelClient.send({ cmd: CMD.BOOKING.DETAILS }, query);
  }

  getBookingOverview(query: BookingFilterDto) {
    return this.hotelClient.send({ cmd: CMD.BOOKING.OVERVIEW }, query);
  }

  getBookingBookerInfo(query: BookingFilterDto) {
    return this.hotelClient.send({ cmd: CMD.BOOKING.BOOKER_INFO }, query);
  }

  updateBookingBookerInfo(bookingNumber: string, body: UpdateBookingBookerInfoDto) {
    return this.hotelClient.send({ cmd: CMD.BOOKING.UPDATE_BOOKER_INFO }, { bookingNumber, input:body });
  }

  getBookingPaymentMethods(query: BookingFilterDto) {
    return this.hotelClient.send({ cmd: CMD.BOOKING.PAYMENT_METHODS }, query);
  }

  calculatePricing(body: CalculatePricingDto) {
    return this.hotelClient.send({ cmd: CMD.BOOKING.CALCULATE_PRICING }, body);
  }

  createCppRequestBooking(body: CppRequestBookingInputDto) {
    return this.hotelClient.send({ cmd: CMD.BOOKING.CREATE_CPP_REQUEST_BOOKING }, body);
  }
}
