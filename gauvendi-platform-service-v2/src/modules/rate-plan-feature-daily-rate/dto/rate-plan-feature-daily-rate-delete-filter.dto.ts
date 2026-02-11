import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID
} from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { IsDateRangeValid } from '../../../core/decorators/is-date-range-valid.decorator';
import { Weekday } from '../../../core/entities/restriction.entity';

export class RatePlanFeatureDailyRateDeleteFilterDto {
  @ApiProperty({ description: 'Rate plan ID', example: 'rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty()
  ratePlanId: string;

  @ApiProperty({ description: 'Feature ID', example: 'feature-uuid' })
  @IsUUID()
  @IsOptional()
  featureId?: string;

  @ApiProperty({ 
    description: 'Start date for the rate period', 
    example: '2023-12-01',
    format: 'date'
  })
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ 
    description: 'End date for the rate period', 
    example: '2023-12-31',
    format: 'date'
  })
  @IsDateString()
  @IsDateRangeValid('fromDate', {
    message: 'End date must be after or equal to start date'
  })
  toDate?: string;

  @ApiProperty({ 
    description: 'Days of week to apply the rate',
    example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    enum: Weekday,
    isArray: true
  })
  @IsEnum(Weekday, { each: true })
  @OptionalArrayProperty()
  dayList: Weekday[];
}
