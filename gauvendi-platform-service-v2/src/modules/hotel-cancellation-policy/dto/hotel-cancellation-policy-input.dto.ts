import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { CancellationFeeUnitEnum } from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelCxlPolicyTranslationInputDto } from './hotel-cxl-policy-translation-input.dto';

export class HotelCancellationPolicyInputDto {
  @ApiPropertyOptional({
    description: 'Hotel cancellation policy ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    description: 'Hotel ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  hotelId: string;

  @ApiPropertyOptional({
    description: 'Policy name',
    example: 'Standard Cancellation Policy'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Cancellation type',
    example: 'FLEXIBLE'
  })
  @IsOptional()
  @IsString()
  cancellationType?: string;

  @ApiPropertyOptional({
    description: 'Hours prior to check-in for cancellation',
    example: 24,
    minimum: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  hourPrior?: number;

  @ApiPropertyOptional({
    description: 'Display unit for time',
    example: 'HOURS'
  })
  @IsOptional()
  @IsString()
  displayUnit?: string;

  @ApiPropertyOptional({
    description: 'Cancellation fee value',
    example: 50.0,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationFeeValue?: number;

  @ApiPropertyOptional({
    description: 'Cancellation fee unit',
    enum: CancellationFeeUnitEnum,
    example: CancellationFeeUnitEnum.PERCENTAGE
  })
  @IsOptional()
  @IsEnum(CancellationFeeUnitEnum)
  cancellationFeeUnit?: CancellationFeeUnitEnum;

  @ApiPropertyOptional({
    description: 'Policy description',
    example: 'Free cancellation up to 24 hours before check-in'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelCxlPolicyTranslationInputDto)
  translationList?: HotelCxlPolicyTranslationInputDto[];
}
