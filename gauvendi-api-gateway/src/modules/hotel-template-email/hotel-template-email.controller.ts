import { Body, Controller, Get, HttpStatus, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { map } from "rxjs";
import { EmailTranslationInput, HotelTemplateEmailFilterDto, MigrateTemplateEmailTranslationInput, UpdateEmailContentInput, UpdateEmailTranslationInput } from "./hotel-template-email.dto";
import { HotelTemplateEmailService } from "./hotel-template-email.service";

@Controller("hotel-template-email")
export class HotelTemplateEmailController {
  constructor(private readonly hotelTemplateEmailService: HotelTemplateEmailService) {}

  @Get("list")
  getHotelTemplateEmailList(@Query() query: HotelTemplateEmailFilterDto) {
    return this.hotelTemplateEmailService.getHotelTemplateEmailList(query);
  }

  @Post("update-email-content")
  updateEmailContent(@Body() dto: UpdateEmailContentInput, @Res() response: Response) {
    return this.hotelTemplateEmailService.updateEmailContent(dto).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Get("get-email-translation")
  getEmailTranslation(@Query() dto: EmailTranslationInput) {
    return this.hotelTemplateEmailService.getEmailTranslation(dto);
  }

  @Post("update-email-translation")
  updateEmailTranslation(@Body() dto: UpdateEmailTranslationInput[], @Res() response: Response) {
    return this.hotelTemplateEmailService.updateEmailTranslation(dto).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("migrate-translation-template-email")
  migrateTranslationTemplateEmail(@Body() dto: MigrateTemplateEmailTranslationInput, @Res() response: Response) {
    return this.hotelTemplateEmailService.migrateTranslationTemplateEmail(dto).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }
}
