import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Filter } from 'src/core/dtos/common.dto';
import { HotelTemplateEmailCodesEnum } from 'src/core/entities/hotel-entities/hotel-template-email.entity';

export class HotelTemplateEmailsFilterDto extends Filter {
  @IsString()
  @IsNotEmpty()
  hotelCode?: string;

  @IsString()
  @IsOptional()
  hotelId?: string;
}

export class HotelTemplateEmailResponseDto {
  closingSection: string;
  languageCode: string;
  code: HotelTemplateEmailCodesEnum;
  name: string;
  templateId: string;
  isDefault: boolean;
  signature: string;
}
