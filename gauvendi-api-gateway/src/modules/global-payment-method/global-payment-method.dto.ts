import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Filter } from "@src/core/dtos/common.dto";
import { GlobalPaymentProviderCodeEnum } from "@src/core/enums/common.enum";
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";

export class GetGlobalPaymentMethodListDto extends Filter {
  @IsUUID()
  hotelId: string;

  @IsOptional()
  @OptionalArrayProperty()
  codes?: string[];
}

export class ActivateHotelPaymentMethodInputDto {
  @IsUUID()
  @IsNotEmpty()
  globalPaymentMethodId: string;
  
  @IsUUID()
  @IsOptional()
  globalPaymentProviderId: string;

  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsObject()
  @IsOptional()
  metadata?: {
    value: any | null;
    metadata: any;
  };
}

export class DeactivateHotelPaymentMethodInputDto {
  @IsUUID()
  @IsNotEmpty()
  hotelPaymentMethodSettingId: string;

  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export class GeneratePaymentOnboardingUrlInputDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsEnum(GlobalPaymentProviderCodeEnum)
  paymentProviderCode: GlobalPaymentProviderCodeEnum;

  @IsString()
  @IsOptional()
  accountType: string;

  @IsString()
  @IsOptional()
  countryCode: string;

  @IsString()
  @IsOptional()
  returnUrl: string;

  @IsString()
  @IsOptional()
  refreshUrl: string;
}
