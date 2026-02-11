import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID
} from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Weekday } from 'src/core/enums/common'; // Using existing Weekday enum

export class RoomProductFeatureRateAdjustmentDeleteFilterDto {


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
  @IsEnum(Weekday, { each: true })
  @IsOptional()
  @OptionalArrayProperty() 
  days?: Weekday[];

  @ApiProperty({ description: 'Feature ID', example: 'feature-uuid' })
  @IsUUID()
  @IsNotEmpty()
  featureId: string;

  @ApiProperty({ description: 'Room product rate plan ID', example: 'room-product-rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty()
  roomProductRatePlanId: string;
}
