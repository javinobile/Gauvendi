import { ServiceTypeEnum } from '@enums/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTaxSettingsItemInputDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Service code',
    example: 'ACCOMMODATION_001'
  })
  serviceCode?: string;

  @IsEnum(ServiceTypeEnum)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Service type',
    enum: ServiceTypeEnum,
    example: ServiceTypeEnum.ACCOMMODATION
  })
  serviceType?: ServiceTypeEnum;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'List of tax codes',
    type: [String],
    example: ['TAX001', 'TAX002', 'CITY_TAX']
  })
  taxCodeList?: string[];

  /**
   * Getter method to ensure taxCodeList is never null
   * Returns empty array if taxCodeList is null or undefined
   */
  getTaxCodeList(): string[] {
    return this.taxCodeList && this.taxCodeList.length > 0 ? this.taxCodeList : [];
  }
}
