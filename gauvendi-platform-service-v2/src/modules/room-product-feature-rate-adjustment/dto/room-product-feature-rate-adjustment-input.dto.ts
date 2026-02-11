import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsEnum,
  IsNotEmpty
} from 'class-validator';
import { Weekday } from 'src/core/enums/common'; // Using existing Weekday enum

export class RoomProductFeatureRateAdjustmentInputDto {

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ApiProperty({ description: 'Room product ID', example: 'room-product-uuid' })
  @IsUUID()
  @IsNotEmpty()
  roomProductId: string;

  @ApiProperty({ description: 'Start date for the adjustment period', example: '2023-12-01' })
  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @ApiProperty({ description: 'End date for the adjustment period', example: '2023-12-31' })
  @IsDateString()
  @IsNotEmpty()
  toDate: string;

  @ApiPropertyOptional({
    description: 'Days of week to apply the adjustment',
    example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    enum: Weekday,
    isArray: true
  })
  @IsArray()
  @IsEnum(Weekday, { each: true })
  @IsOptional()
  days?: Weekday[];

  @ApiProperty({ description: 'Feature ID', example: 'feature-uuid' })
  @IsUUID()
  @IsNotEmpty()
  featureId: string;

  @ApiProperty({ description: 'Room product rate plan ID', example: 'room-product-rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty()
  roomProductRatePlanId: string;

  @ApiProperty({ description: 'Rate adjustment amount', example: '25.50' })
  @IsString()
  @IsNotEmpty()
  rateAdjustment: string; // BigDecimal in Java maps to string for precision

  @ApiProperty({ description: 'Original rate before adjustment', example: '100.00' })
  @IsString()
  @IsNotEmpty()
  rateOriginal: string; // BigDecimal in Java maps to string for precision
}
