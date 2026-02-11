import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  IsDateString,
  IsNotEmpty
} from 'class-validator';

export class DynamicRoomProductFeatureRateAdjustmentInputDto {
  @ApiProperty({ description: 'Date for the adjustment', example: '2023-12-01' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Feature ID', example: 'feature-uuid' })
  @IsUUID()
  @IsNotEmpty()
  featureId: string;

  @ApiProperty({ description: 'Room product rate plan ID', example: 'room-product-rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty()
  roomProductRatePlanId: string;

  @ApiProperty({ description: 'Original rate before adjustment', example: '100.00' })
  @IsString()
  @IsNotEmpty()
  rateOriginal: string; // BigDecimal in Java maps to string for precision

  @ApiProperty({ description: 'Price gap to apply', example: '25.50' })
  @IsString()
  @IsNotEmpty()
  priceGap: string; // BigDecimal in Java maps to string for precision
}
