import { Body, Controller, HttpStatus, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { map } from "rxjs";
import { DownloadBookingConfirmationPdfDto, SendConfirmBookingEmailDto, SendTestEmailDto } from "./notification.dto";
import { NotificationService } from "./notification.service";

@Controller("notification")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post("send-confirm-booking-email")
  sendConfirmBookingEmail(@Body() body: SendConfirmBookingEmailDto, @Res() res: Response) {
    return this.notificationService.sendConfirmBookingEmail(body).pipe(
      map((data) => {
        return res.status(HttpStatus.OK).send(data);
      })
    );
  }

  @Post("send-proposed-booking-email")
  sendProposedBookingEmail(@Body() body: SendConfirmBookingEmailDto, @Res() res: Response) {
    return this.notificationService.sendProposedBookingEmail(body).pipe(
      map((data) => {
        return res.status(HttpStatus.OK).send(data);
      })
    );
  }

  @Post("send-quote-booking-email")
  sendQuoteBookingEmail(@Body() body: SendConfirmBookingEmailDto, @Res() res: Response) {
    return this.notificationService.sendQuoteBookingEmail(body).pipe(
      map((data) => {
        return res.status(HttpStatus.OK).send(data);
      })
    );
  }

  @Post("download-booking-confirmation-pdf")
  downloadBookingConfirmationPdf(@Body() body: DownloadBookingConfirmationPdfDto, @Res() res: Response) {
    return this.notificationService.downloadBookingConfirmationPdf(body).pipe(
      map((data) => {
        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=booking-${body.bookingId}.pdf`,
          "Content-Length": data.length,
        });

        const buffer = Buffer.from(data, "base64");
        return res.status(HttpStatus.OK).send(buffer);
      })
    );
  }

  @Post("send-test-email")
  sendTestEmail(@Body() body: SendTestEmailDto, @Res() res: Response) {
    return this.notificationService.sendTestEmail(body).pipe(
      map((data) => {
        return res.status(HttpStatus.OK).send(data);
      })
    );
  }
}
