import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min
} from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Weekday } from 'src/core/entities/restriction.entity';
import { RatePlanAdjustmentType } from 'src/core/enums/common';

// Output DTO - No validation, only Swagger documentation
export class RatePlanDailyAdjustmentDto {
  @ApiProperty({ description: 'Rate plan adjustment ID', example: 'uuid-123' })
  id: string;

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  hotelId: string;

  @ApiProperty({ description: 'Rate plan ID', example: 'rate-plan-uuid' })
  ratePlanId: string;

  @ApiProperty({
    enum: RatePlanAdjustmentType,
    description: 'Adjustment unit type',
    example: RatePlanAdjustmentType.PERCENTAGE
  })
  unit: RatePlanAdjustmentType;

  @ApiProperty({ description: 'Adjustment value', example: 15.5 })
  value: number;

  @ApiProperty({
    description: 'Date for this adjustment',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  date: Date;
}

// Input DTO - Based on Java validation logic
export class RatePlanDailyAdjustmentInput {
  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  @IsNotEmpty() // Java: ValidationNullObject(input.getHotelId(), REQUIRE_HOTEL_ID)
  hotelId: string;

  @ApiProperty({ description: 'Rate plan ID', example: 'rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty() // Java: ValidationNullObject(input.getRatePlanId(), REQUIRE_RATE_PLAN_ID)
  ratePlanId: string;

  @ApiProperty({
    enum: RatePlanAdjustmentType,
    description: 'Adjustment unit type',
    example: RatePlanAdjustmentType.PERCENTAGE
  })
  @IsEnum(RatePlanAdjustmentType)
  @IsNotEmpty() // Java: ValidationNullObject(input.getUnit(), REQUIRE_UNIT)
  unit: RatePlanAdjustmentType;

  @ApiProperty({ description: 'Adjustment value', example: 15.5 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsNotEmpty() // Java: ValidationNullObject(input.getValue(), REQUIRE_VALUE)
  @Min(0)
  @Max(999999.9999)
  value: number;

  @ApiProperty({
    description: 'Start date for adjustment period',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  @IsNotEmpty() // Java: ValidationNullObject(input.getFromDate(), REQUIRE_FROM_DATE)
  fromDate: string;

  @ApiProperty({
    description: 'End date for adjustment period',
    example: '2023-12-31',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  @IsNotEmpty() // Java: ValidationNullObject(input.getToDate(), REQUIRE_TO_DATE)
  toDate: string;

  @ApiProperty({
    type: [String],
    enum: Weekday,
    description: 'Days of week to apply adjustment',
    example: [Weekday.Monday, Weekday.Friday]
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Weekday, { each: true })
  dayList: Weekday[];
}

// Filter DTO - Based on Java Filter class
export class RatePlanDailyAdjustmentFilter {
  @ApiPropertyOptional({
    type: [String],
    description: 'List of IDs to filter by',
    example: ['uuid-1', 'uuid-2']
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  idList?: string[];

  @ApiPropertyOptional({
    description: 'Hotel ID to filter by',
    example: 'hotel-uuid'
  })
  @IsUUID()
  @IsOptional()
  hotelId?: string;

  @ApiPropertyOptional({
    description: 'Rate plan ID to filter by',
    example: 'rate-plan-uuid'
  })
  @IsUUID()
  @IsOptional()
  ratePlanId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of rate plan IDs to filter by',
    example: ['rate-plan-uuid-1', 'rate-plan-uuid-2']
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  ratePlanIdList?: string[];

  @ApiPropertyOptional({
    description: 'Start date filter',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter',
    example: '2023-12-31',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  // Pagination fields (inherited from Java Filter class)
  @ApiPropertyOptional({ description: 'Page size', example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Offset for pagination', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

// Delete DTO - Specific for DELETE operation
export class DeleteRatePlanDailyAdjustmentDto {
  @ApiProperty({ description: 'Rate plan adjustment ID to delete', example: 'uuid-123' })
  @IsUUID()
  @IsNotEmpty() // Java: ValidationNullObject(input.getId(), REQUIRE_ID)
  id: string;

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ApiPropertyOptional({ description: 'Rate plan ID', example: 'rate-plan-uuid' })
  @IsUUID()
  @IsOptional()
  ratePlanId?: string;

  @ApiPropertyOptional({
    description: 'Start date for deletion range',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'End date for deletion range',
    example: '2023-12-31',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({
    type: [String],
    enum: Weekday,
    description: 'Days of week to delete adjustments',
    example: [Weekday.Monday, Weekday.Friday]
  })
  @IsArray()
  @IsOptional()
  @IsEnum(Weekday, { each: true })
  dayList?: Weekday[];
}

// Delete Filter DTO - Based on deleteByFilter method parameters
export class RatePlanDailyAdjustmentDeleteFilter {
  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ApiPropertyOptional({ description: 'Rate plan ID', example: 'rate-plan-uuid' })
  @IsUUID()
  @IsOptional()
  ratePlanId?: string;

  @ApiPropertyOptional({
    description: 'Start date for deletion period',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'End date for deletion period',
    example: '2023-12-31',
    type: 'string',
    format: 'date'
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({
    type: [String],
    enum: Weekday,
    description: 'Days of week to delete adjustments for',
    example: [Weekday.Monday, Weekday.Friday]
  })
  @IsOptional()
  @IsEnum(Weekday, { each: true })
  @OptionalArrayProperty()
  dayList?: Weekday[];
}

export class DeleteAdjustmentDto {
  hotelId: string;
  dayList: Weekday[];
  fromDate: string;
  toDate: string;
  ratePlanId: string;
}

export class UpsertAdjustmentDto extends DeleteAdjustmentDto {
  unit: RatePlanAdjustmentType;
  value: number;
}
