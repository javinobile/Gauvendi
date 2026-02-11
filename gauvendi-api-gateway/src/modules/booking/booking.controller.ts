import { Body, Controller, Get, HttpStatus, Param, Post, Put, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { map } from "rxjs";
import { BookingFilterDto, CalculatePricingDto, UpdateBookingBookerInfoDto } from "./booking.dto";
import { BookingService } from "./booking.service";
import { CppRequestBookingInputDto } from "./dto/cpp-request-booking.dto";

@Controller("booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post("calculate-pricing")
  calculatePricing(@Body() body: CalculatePricingDto) {
    return this.bookingService.calculatePricing(body);
  }

  @Get("details")
  getBookingDetails(@Query() query: BookingFilterDto) {
    return this.bookingService.getBookingDetails(query);
  }

  @Get("overview")
  getBookingOverview(@Query() query: BookingFilterDto) {
    return this.bookingService.getBookingOverview(query);
  }

  @Get("booker-info")
  getBookingBookerInfo(@Query() query: BookingFilterDto) {
    return this.bookingService.getBookingBookerInfo(query);
  }

  @Put(":bookingNumber/booker-info")
  updateBookingBookerInfo(@Body() body: UpdateBookingBookerInfoDto, @Param("bookingNumber") bookingNumber: string) {
    return this.bookingService.updateBookingBookerInfo(bookingNumber, body).pipe(
      map((data) => {
        return {
          ...data,
          isCustomResponse: true,
        };
      })
    );
  }

  @Get("payment-methods")
  getBookingPaymentMethods(@Query() query: BookingFilterDto) {
    return this.bookingService.getBookingPaymentMethods(query);
  }

  @Post("cpp-request-booking")
  cppRequestBooking(@Body() body: CppRequestBookingInputDto) {
    return this.bookingService.createCppRequestBooking(body);
  }
}
