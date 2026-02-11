import { HotelTemplateEmailCodeEnum } from '@src/core/entities/hotel-entities/hotel-template-email.entity';
import { LanguageCodeEnum } from '@src/core/enums/common';

export class SendTestEmailDto {
  hotelId: string;
  hotelTemplateEmail: HotelTemplateEmailCodeEnum;
  language?: LanguageCodeEnum;
  toEmail?: string;
}
