import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { Filter } from "src/core/dtos/common.dto";

export enum HotelTemplateEmailCodeEnum {
  BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION",
  BOOKING_CONFIRMATION_V2 = "BOOKING_CONFIRMATION_V2",
  RESERVATION_CANCELLATION = "RESERVATION_CANCELLATION",
  VOICE_BOOKING_CONFIRMATION = "VOICE_BOOKING_CONFIRMATION",
  PROPOSAL_BOOKING_CONFIRMATION = "PROPOSAL_BOOKING_CONFIRMATION",
  RELEASED_EMAIL = "RELEASED_EMAIL",
  CPP_BOOKING_CONFIRMATION = "CPP_BOOKING_CONFIRMATION",
  CPP_VERIFY_BOOKING_CONFIRMATION = "CPP_VERIFY_BOOKING_CONFIRMATION",
  CPP_PROPOSAL_BOOKING_CONFIRMATION = "CPP_PROPOSAL_BOOKING_CONFIRMATION",
  QUOTE = "QUOTE",
}

export class HotelTemplateEmailFilterDto extends Filter {
  @IsUUID()
  hotelId: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  languageCode?: string;

  @IsString({ each: true })
  @OptionalArrayProperty()
  codes?: string[];
}

export class UpdateEmailContentInput {
  @IsEnum(HotelTemplateEmailCodeEnum)
  code: HotelTemplateEmailCodeEnum;

  @IsOptional()
  title?: string;

  @IsUUID()
  id: string;

  @IsOptional()
  closingSection?: string;

  @IsOptional()
  openingSection?: string;

  @IsBoolean()
  isEnable: boolean;
}

export class EmailTranslationInput {
  @IsString()
  code: string;

  @IsUUID()
  hotelId: string;
}

export class UpdateEmailTranslationInput {
  @IsUUID()
  id: string;

  @IsString()
  @IsOptional()
  openingSection?: string;

  @IsString()
  @IsOptional()
  closingSection?: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class MigrateTemplateEmailTranslationInput {
  @IsUUID()
  hotelId: string;
}
