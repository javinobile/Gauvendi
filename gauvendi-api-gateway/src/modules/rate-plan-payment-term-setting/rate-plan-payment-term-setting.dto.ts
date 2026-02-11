import { SupportedPaymentMethodCodes } from "@src/core/enums/common.enum";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { OptionalArrayProperty } from "src/core/decorators/array-property.decorator";
import { Filter } from "src/core/dtos/common.dto";

export class RatePlanPaymentTermSettingFilterDto extends Filter {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  ratePlanIdList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  idList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  supportedPaymentMethodCodes?: string[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class RatePlanPaymentTermSettingInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  hotelId: string;

  @IsUUID()
  ratePlanId: string;

  @IsUUID()
  hotelPaymentTermId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedPaymentMethodCodes?: SupportedPaymentMethodCodes[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
export class RatePlanPaymentTermSettingDeleteDto {
  @IsUUID()
  id: string;
}

export class RatePlanPaymentTermSettingDetailInputDto {
  @IsUUID()
  hotelPaymentTermId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedPaymentMethodCodes?: SupportedPaymentMethodCodes[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateRatePlanPaymentTermSettingInputDto {
  @IsUUID()
  hotelId: string;

  @IsUUID()
  ratePlanId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatePlanPaymentTermSettingDetailInputDto)
  detailsInputList: RatePlanPaymentTermSettingDetailInputDto[];
}
