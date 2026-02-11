import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Filter } from "@src/core/dtos/common.dto";
import { LanguageCodeEnum } from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

export class HotelPaymentTermFilterDto extends Filter {
  @IsOptional()
  @IsUUID("4")
  hotelId?: string;

  @OptionalArrayProperty()
  ids?: string[];
}

export class HotelPaymentTermTranslationDto {
  id: string;
  hotelId?: string;
  hotelPaymentTermId?: string;
  languageCode: string;
  name: string;
  description: string;
  payAtHotelDescription: string;
  payOnConfirmationDescription: string;
}

export class PaymentMethodDto {
  id: string;
  code: string;
  name: string;
  description: string;
  supportedPaymentProviderCodeList?: string[];
}

export class HotelPaymentTermResponseDto {
  id: string;
  name: string;
  code: string;
  payOnConfirmation: number;
  payAtHotel: number;
  description: string;
  payAtHotelDescription: string;
  payOnConfirmationDescription: string;
  translationList: HotelPaymentTermTranslationDto[];
  paymentMethodList: PaymentMethodDto[];
  supportedPaymentMethodCodeList: string[];
}

export class HotelPaymentTermTranslationRequestDto {
  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  payUponBookingDescription?: string;

  @IsString()
  @IsOptional()
  payAtHotelDescription?: string;
}

export class HotelPaymentTermInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  payOnConfirmation: number;

  @IsString()
  @IsOptional()
  payOnConfirmationDescription?: string;

  @IsNumber()
  payAtHotel: number;

  @IsString()
  @IsOptional()
  payAtHotelDescription?: string;

  @IsArray()
  @IsString({ each: true })
  supportedPaymentMethodCodeList: string[];

  @ValidateNested()
  @IsOptional()
  @Type(() => HotelPaymentTermTranslationRequestDto)
  translations?: HotelPaymentTermTranslationRequestDto[];
}
