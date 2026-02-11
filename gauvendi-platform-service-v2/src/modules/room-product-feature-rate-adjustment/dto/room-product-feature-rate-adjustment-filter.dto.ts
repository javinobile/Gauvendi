import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsArray, IsDateString, IsEnum } from 'class-validator';
import { Filter } from '../../../core/dtos/common.dto';
import { Weekday } from 'src/core/enums/common';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';

export class RoomProductFeatureRateAdjustmentFilterDto extends Filter {
  @ApiPropertyOptional({ description: 'Hotel ID to filter by', example: 'hotel-uuid' })
  @IsUUID()
  @IsOptional()
  hotelId?: string;

  @ApiPropertyOptional({ description: 'Room product ID to filter by', example: 'room-product-uuid' })
  @IsUUID()
  @IsOptional()
  roomProductId?: string;

  @ApiPropertyOptional({ 
    description: 'Start date to filter adjustments (inclusive)',
    example: '2023-12-01'
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date to filter adjustments (inclusive)',
    example: '2023-12-31'
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Days of week to filter by',
    example: ['Monday', 'Tuesday'],
    enum: Weekday,
    isArray: true
  })
  @IsEnum(Weekday, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  days?: Weekday[];

  @ApiPropertyOptional({ description: 'Feature ID to filter by', example: 'feature-uuid' })
  @IsUUID()
  @IsOptional()
  featureId?: string;

  @ApiPropertyOptional({ 
    description: 'List of feature IDs to filter by',
    example: ['feature-uuid-1', 'feature-uuid-2'],
    type: [String]
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  featureIdList?: string[];

  @ApiPropertyOptional({ description: 'Room product rate plan ID to filter by', example: 'room-product-rate-plan-uuid' })
  @IsUUID()
  @IsOptional()
  roomProductRatePlanId?: string;

  @ApiPropertyOptional({ 
    description: 'List of room product rate plan IDs to filter by',
    example: ['room-product-rate-plan-uuid-1', 'room-product-rate-plan-uuid-2'],
    type: [String]
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  roomProductRatePlanIdList?: string[];

  @ApiPropertyOptional({ 
    description: 'List of room product IDs to filter by',
    example: ['room-product-uuid-1', 'room-product-uuid-2'],
    type: [String]
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  roomProductIdList?: string[];

  @ApiPropertyOptional({ 
    description: 'List of rate plan IDs to filter by',
    example: ['rate-plan-uuid-1', 'rate-plan-uuid-2'],
    type: [String]
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  ratePlanIdList?: string[];
}
