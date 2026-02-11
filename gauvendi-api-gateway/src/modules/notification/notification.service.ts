import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { DownloadBookingConfirmationPdfDto, SendConfirmBookingEmailDto, SendTestEmailDto } from "./notification.dto";

@Injectable()
export class NotificationService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  sendConfirmBookingEmail(body: SendConfirmBookingEmailDto) {
    return this.clientProxy.send({ cmd: CMD.NOTIFICATION.SEND_CONFIRM_BOOKING_EMAIL }, body);
  }

  sendProposedBookingEmail(body: SendConfirmBookingEmailDto) {
    return this.clientProxy.send({ cmd: CMD.NOTIFICATION.SEND_PROPOSED_BOOKING_EMAIL }, body);
  }

  sendQuoteBookingEmail(body: SendConfirmBookingEmailDto) {
    return this.clientProxy.send({ cmd: CMD.NOTIFICATION.SEND_QUOTE_BOOKING_EMAIL }, body);
  }

  downloadBookingConfirmationPdf(body: DownloadBookingConfirmationPdfDto) {
    return this.clientProxy.send({ cmd: CMD.NOTIFICATION.DOWNLOAD_BOOKING_CONFIRMATION_PDF }, body);
  }

  sendTestEmail(body: SendTestEmailDto) {
    return this.clientProxy.send({ cmd: CMD.NOTIFICATION.SEND_TEST_EMAIL }, body);
  }
}
