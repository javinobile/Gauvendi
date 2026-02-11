import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { EmailTranslationInput, HotelTemplateEmailFilterDto, MigrateTemplateEmailTranslationInput, UpdateEmailContentInput, UpdateEmailTranslationInput } from "./hotel-template-email.dto";

@Injectable()
export class HotelTemplateEmailService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getHotelTemplateEmailList(query: HotelTemplateEmailFilterDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.GET_LIST }, query);
  }

  updateEmailContent(dto: UpdateEmailContentInput) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.UPDATE_EMAIL_CONTENT }, dto);
  }

  getEmailTranslation(query: EmailTranslationInput) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.GET_EMAIL_TRANSLATION }, query);
  }

  updateEmailTranslation(dto: UpdateEmailTranslationInput[]) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.UPDATE_EMAIL_TRANSLATION }, dto);
  }

  migrateTranslationTemplateEmail(dto: MigrateTemplateEmailTranslationInput) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_TEMPLATE_EMAIL.MIGRATE_EMAIL_TRANSLATION }, dto);
  }
}
