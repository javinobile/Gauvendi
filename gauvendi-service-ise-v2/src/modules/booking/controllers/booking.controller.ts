import { Body, Controller, Get, HttpStatus, Logger, Post, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { getCurlCommand } from 'src/core/utils/curl.util';
import { BookingCalculateService } from 'src/modules/booking-calculate/booking-calculate.service';
import { CalculateBookingPricingInputDto } from 'src/modules/booking-calculate/dtos/calculate-booking-pricing-input.dto';
import { BookingStatusFilterDto, BookingSummaryFilterDto } from '../dtos/booking-status.dto';
import { CancelBookingFilterDto } from '../dtos/cancel-booking.dto';
import { ConfirmBookingProposalInputDto } from '../dtos/confirm-booking-proposal.dto';
import { DeclineProposalBookingDto } from '../dtos/decline-propsal-booking.dto';
import {
  CompleteBookingPaymentDto,
  ConfirmBookingPaymentDto,
  RequestBookingDto,
  WSCreatePaymentStatusDto,
  WSPaymentCompleteDto
} from '../dtos/request-booking.dto';
import { UpdateBookingInformationDto } from '../dtos/update-booking-information.dto';
import { BookingStatusService } from '../services/booking-status.service';
import { BookingSummaryService } from '../services/booking-summary.service';
import { BookingService } from '../services/booking.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ISE_SOCKET_CMD } from 'src/core/constants/cmd.const';

@Controller('booking')
export class BookingController {
  private readonly logger = new Logger(BookingController.name);
  constructor(
    private readonly bookingService: BookingService,
    private readonly bookingStatusService: BookingStatusService,
    private readonly bookingSummaryService: BookingSummaryService,
    private readonly bookingCalculateService: BookingCalculateService
  ) {}

  @Post('request-booking')
  requestBooking(@Body() body: RequestBookingDto, @Req() req: any, @Res() res: Response): any {
    const curl = getCurlCommand(
      'booking/request-booking',
      'POST',
      req.headers as Record<string, string>,
      body
    );
    this.logger.log(`Curl command request booking: ${JSON.stringify(curl)}`);

    // Derive IP from request if not provided by client
    const xff = (req.headers['x-forwarded-for'] as string) || '';
    const forwardedIp = xff?.split(',').map((s) => s.trim())[0];
    body.browserIp = forwardedIp || req.ip || req?.connection?.remoteAddress || null;
    this.logger.log(`Request booking from ${body.browserIp}`);
    body.browserInfo = {
      userAgent: req.headers['user-agent'] || null,
      ip: body.browserIp,
      accept: req.headers['accept'] || null,
      acceptHeader: req.headers['accept'] || null
    };
    this.logger.log(`Request booking from ${JSON.stringify(body.browserInfo)}`);
    body.origin = req.headers['origin'] || null;
    return this.bookingService.requestBooking(body, res);
  }

  @Get('summary')
  getBookingSummary(@Query() filter: BookingSummaryFilterDto): Promise<any> {
    return this.bookingSummaryService.getBookingSummary(filter);
  }

  @Get('status')
  getBookingStatus(@Query() filter: BookingStatusFilterDto): Promise<any> {
    return this.bookingStatusService.getBookingStatus(filter);
  }

  @Post('update-information')
  updateBookingInformation(@Body() body: UpdateBookingInformationDto): Promise<any> {
    return this.bookingService.updateBookingInformation(body);
  }

  @Post('cancel-booking')
  cancelBooking(@Body() body: CancelBookingFilterDto): Promise<any> {
    return this.bookingService.cancelBooking(body);
  }

  @Post('calculate-booking')
  calculateBooking(@Body() body: CalculateBookingPricingInputDto): Promise<any> {
    return this.bookingCalculateService.calculateBookingPricing(body);
  }

  @Post('confirm-booking-proposal')
  async cppConfirmPaymentBooking(
    @Body() body: ConfirmBookingProposalInputDto,
    @Res() res: Response
  ): Promise<any> {
    const response = await this.bookingService.cppConfirmPaymentBooking(body);
    return res.status(HttpStatus.OK).send(response);
  }

  @Post('decline-booking-proposal')
  declineBookingProposal(@Body() body: DeclineProposalBookingDto): Promise<any> {
    return this.bookingService.declineProposalBooking(body);
  }

  @Post('complete-booking-payment')
  completeBookingPayment(@Body() body: CompleteBookingPaymentDto): Promise<any> {
    return this.bookingService.completeBookingPayment(body);
  }

  @Post('confirm-booking-payment')
  confirmBookingPayment(@Body() body: ConfirmBookingPaymentDto): Promise<any> {
    return this.bookingService.confirmBookingPayment(body);
  }

  @MessagePattern({ cmd: 'ise_request_booking' })
  async handle(@Payload() data: RequestBookingDto) {
    return await this.bookingService.requestBookingQueue(data);
  }

  @MessagePattern({ cmd: ISE_SOCKET_CMD.CREATE_PAYMENT_STATUS })
  async wsCreatePaymentStatus(@Payload() data: WSCreatePaymentStatusDto) {
    return await this.bookingService.wsCreatePaymentStatus(data);
  }

  @MessagePattern({ cmd: ISE_SOCKET_CMD.PAYMENT_COMPLETE })
  async wsPaymentComplete(@Payload() data: WSPaymentCompleteDto) {
    return await this.bookingService.wsPaymentComplete(data);
  }
}
