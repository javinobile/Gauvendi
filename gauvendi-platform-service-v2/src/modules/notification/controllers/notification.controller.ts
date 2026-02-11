import { Body, Controller, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { LanguageCodeEnum } from '@src/core/enums/common';
import { SendConfirmBookingEmailDto } from '../dtos/send-confirm-booking-email.dto';
import { NotificationService } from '../services/notification.service';
import { SendTestEmailDto } from '../dtos/send-test-email.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern({ cmd: CMD.NOTIFICATION.SEND_CONFIRM_BOOKING_EMAIL })
  async sendConfirmBookingEmail(@Payload() filter: SendConfirmBookingEmailDto) {
    return await this.notificationService.sendCppBookingConfirmationEmail(filter, false);
  }

  @MessagePattern({ cmd: CMD.NOTIFICATION.SEND_PROPOSED_BOOKING_EMAIL })
  async sendProposedBookingEmail(@Payload() filter: SendConfirmBookingEmailDto) {
    return await this.notificationService.sendProposedBookingEmail(filter);
  }

  @MessagePattern({ cmd: CMD.NOTIFICATION.SEND_TEST_EMAIL })
  async sendTestEmail(@Payload() filter: SendTestEmailDto) {
    return await this.notificationService.sendTestEmail(filter);
  }

  /**
   * Send CPP booking confirmation email
   */
  @Post('cpp-booking-confirmation')
  async sendCppBookingConfirmationEmail(@Body() request: SendConfirmBookingEmailDto) {
    try {
      const result = await this.notificationService.sendCppBookingConfirmationEmail(request, false);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @MessagePattern({ cmd: CMD.NOTIFICATION.DOWNLOAD_BOOKING_CONFIRMATION_PDF })
  async downloadBookingConfirmationPdf(
    @Payload()
    body: {
      bookingId: string;
      reservationNumber?: string;
      isOriginPdf?: boolean;
      language?: string;
    }
  ) {
    return await this.notificationService.downloadBookingConfirmationPdf(
      body.bookingId,
      body.reservationNumber,
      body.isOriginPdf,
      body.language || LanguageCodeEnum.EN
    );
  }
  /**
   * Send booking confirmation email (alias for CPP)
   */
  @Post('booking-confirmation')
  async sendBookingConfirmationEmail(@Body() request: SendConfirmBookingEmailDto) {
    try {
      const result = await this.notificationService.sendConfirmBookingEmail(request);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
