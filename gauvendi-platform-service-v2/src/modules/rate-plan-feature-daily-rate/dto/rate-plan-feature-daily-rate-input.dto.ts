import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min
} from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { IsDateRangeValid } from '../../../core/decorators/is-date-range-valid.decorator';
import { Weekday } from '../../../core/entities/restriction.entity';

export class RatePlanFeatureDailyRateInputDto {
  @ApiProperty({ description: 'Rate plan ID', example: 'rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty()
  ratePlanId: string;

  @ApiProperty({ description: 'Feature ID', example: 'feature-uuid' })
  @IsUUID()
  @IsNotEmpty()
  featureId: string;

  @ApiProperty({ description: 'Daily rate for the feature', example: 25.5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rate: number;

  @ApiProperty({
    description: 'Start date for the rate period',
    example: '2023-12-01',
    format: 'date'
  })
  @IsDateString()
  fromDate: string;

  @ApiProperty({
    description: 'End date for the rate period',
    example: '2023-12-31',
    format: 'date'
  })
  @IsDateString()
  @IsDateRangeValid('fromDate', {
    message: 'End date must be after or equal to start date'
  })
  toDate: string;

  @ApiProperty({
    description: 'Days of week to apply the rate',
    example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    enum: Weekday,
    isArray: true
  })
  @IsEnum(Weekday, { each: true })
  @OptionalArrayProperty()
  dayList: Weekday[];

  @ApiPropertyOptional({
    description: 'Additional rate plan IDs to apply the same rate',
    example: ['rate-plan-uuid-2', 'rate-plan-uuid-3'],
    type: [String]
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  ratePlanIdList?: string[];
}
