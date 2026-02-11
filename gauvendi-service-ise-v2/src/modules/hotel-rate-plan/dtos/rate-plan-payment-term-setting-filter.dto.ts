import { IsArray, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Filter } from 'src/core/dtos/common.dto';

export class RatePlanPaymentTermSettingFilterDto extends Filter {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  idList?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  hotelIdList?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ratePlanIdList?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  hotelPaymentTermIdList?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedPaymentMethodCodeList?: string[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
