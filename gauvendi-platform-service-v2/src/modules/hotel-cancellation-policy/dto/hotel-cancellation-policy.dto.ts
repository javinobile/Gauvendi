import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested
} from 'class-validator';
import { CancellationFeeUnitEnum } from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelCxlPolicyTranslationDto } from './hotel-cxl-policy-translation.dto';

export class HotelCancellationPolicyDto {
  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cancellation policy ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  id?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Hotel ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012'
  })
  hotelId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cancellation policy name',
    example: 'Standard Cancellation Policy'
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cancellation policy code',
    example: 'CXL001'
  })
  code?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether this is the default cancellation policy',
    example: true
  })
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Type of cancellation',
    example: 'FLEXIBLE'
  })
  cancellationType?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Mapping cancellation policy code',
    example: 'MAP_CXL001'
  })
  mappingCancellationPolicyCode?: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Hours prior to check-in for cancellation',
    example: 24,
    minimum: 0
  })
  hourPrior?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Display unit for the cancellation period',
    example: 'hours'
  })
  displayUnit?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cancellation fee value',
    example: 50.0,
    minimum: 0
  })
  cancellationFeeValue?: number;

  @IsEnum(CancellationFeeUnitEnum)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cancellation fee unit type',
    enum: CancellationFeeUnitEnum,
    example: CancellationFeeUnitEnum.PERCENTAGE
  })
  cancellationFeeUnit?: CancellationFeeUnitEnum;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cancellation policy description',
    example: 'Free cancellation up to 24 hours before check-in'
  })
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelCxlPolicyTranslationDto)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'List of translations for this cancellation policy',
    type: [HotelCxlPolicyTranslationDto]
  })
  translationList?: HotelCxlPolicyTranslationDto[];
}
