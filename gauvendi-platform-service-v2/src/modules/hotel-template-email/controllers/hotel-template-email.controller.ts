import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import {
  EmailTranslationInput,
  HotelTemplateEmailFilterDto,
  MigrateTemplateEmailTranslationInput,
  UpdateEmailContentInput,
  UpdateEmailTranslationInput
} from '../dtos/hotel-template-emai.dto';
import { HotelTemplateEmailService } from '../services/hotel-template-email.service';

@Controller('hotel-template-email')
export class HotelTemplateEmailController {
  constructor(private readonly hotelTemplateEmailService: HotelTemplateEmailService) {}

  @MessagePattern({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.GET_LIST })
  async hotelTemplateEmailList(@Payload() filter: HotelTemplateEmailFilterDto) {
    return await this.hotelTemplateEmailService.getHotelTemplateEmails(filter);
  }

  @MessagePattern({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.UPDATE_EMAIL_CONTENT })
  async updateEmailContent(@Payload() input: UpdateEmailContentInput) {
    return await this.hotelTemplateEmailService.updateEmailContent(input);
  }

  @MessagePattern({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.GET_EMAIL_TRANSLATION })
  async getEmailTranslation(@Payload() input: EmailTranslationInput) {
    return await this.hotelTemplateEmailService.getEmailTranslation(input);
  }

  @MessagePattern({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.UPDATE_EMAIL_TRANSLATION })
  async updateEmailTranslation(@Payload() input: UpdateEmailTranslationInput[]) {
    return await this.hotelTemplateEmailService.updateEmailTranslation(input);
  }

  @MessagePattern({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.MIGRATE_EMAIL_TRANSLATION })
  async migrateEmailTranslation(@Payload() input: MigrateTemplateEmailTranslationInput) {
    return await this.hotelTemplateEmailService.migrateEmailTranslation(input);
  }
}
