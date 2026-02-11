import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min
} from 'class-validator';
import { Translation } from 'src/core/database/entities/base.entity';
import { PropertyTaxType } from '../enums/property-tax-type.enum';
import { PropertyTaxUnit } from '../enums/property-tax-unit.enum';

export class PropertyTaxDto {
  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Property tax ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  id?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Tax code',
    example: 'CITY_TAX_001'
  })
  code?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Tax name',
    example: 'City Tax'
  })
  name?: string;

  @IsEnum(PropertyTaxType)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Property tax type',
    enum: PropertyTaxType,
    example: PropertyTaxType.CITY_TAX
  })
  type?: PropertyTaxType;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Tax value',
    example: 2.5,
    minimum: 0
  })
  value?: number;

  @IsEnum(PropertyTaxUnit)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Tax unit type',
    enum: PropertyTaxUnit,
    example: PropertyTaxUnit.PER_PERSON
  })
  unit?: PropertyTaxUnit;

  @IsDateString()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Valid from date',
    example: '2024-01-01',
    type: 'string',
    format: 'date'
  })
  validFrom?: Date | null;

  @IsDateString()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Valid to date',
    example: '2024-12-31',
    type: 'string',
    format: 'date'
  })
  validTo?: Date | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Mapping tax code for external systems',
    example: 'EXT_CITY_TAX_001'
  })
  mappingTaxCode?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether this is the default tax',
    example: true
  })
  isDefault?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Set of mapping service codes',
    type: [String],
    example: ['BOOKING_SERVICE', 'PAYMENT_SERVICE']
  })
  mappingServiceCodeList?: string[];

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Tax description',
    example: 'City tax applied per person per night for stays in the city center'
  })
  description?: string;

  translationList?: Translation[];
}
