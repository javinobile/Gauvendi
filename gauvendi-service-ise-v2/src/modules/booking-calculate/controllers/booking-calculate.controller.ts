import { Body, Controller, Logger, Post } from '@nestjs/common';
import { BookingCalculateService } from 'src/modules/booking-calculate/booking-calculate.service';
import { CalculateBookingPricingInputDto } from 'src/modules/booking-calculate/dtos/calculate-booking-pricing-input.dto';

@Controller('booking-calculate')
export class BookingCalculateController {
  private readonly logger = new Logger(BookingCalculateController.name);
  constructor(

    private readonly bookingCalculateService: BookingCalculateService
  ) {}

  @Post('')
  calculateBooking(@Body() body: CalculateBookingPricingInputDto): Promise<any> {
    return this.bookingCalculateService.calculateBookingPricing(body);
  }
}
