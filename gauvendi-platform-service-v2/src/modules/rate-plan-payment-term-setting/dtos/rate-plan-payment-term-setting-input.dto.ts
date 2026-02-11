import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { SupportedPaymentMethodCodes } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';

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
