import { ApiProperty } from '@nestjs/swagger';

export class RoomProductFeatureRateAdjustmentDto {
  @ApiProperty({ description: 'Room product feature rate adjustment ID', example: 'uuid-123' })
  id: string;

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  hotelId: string;

  @ApiProperty({ description: 'Room product ID', example: 'room-product-uuid' })
  roomProductId: string;

  @ApiProperty({ description: 'Feature ID', example: 'feature-uuid' })
  featureId: string;

  @ApiProperty({ description: 'Room product rate plan ID', example: 'room-product-rate-plan-uuid' })
  roomProductRatePlanId: string;

  @ApiProperty({ description: 'Rate adjustment amount', example: '25.50' })
  rateAdjustment: string; // BigDecimal in Java maps to string for precision

  @ApiProperty({ description: 'Date for the adjustment', example: '2023-12-01' })
  date: string; // LocalDate in Java maps to string (yyyy-MM-dd)

  @ApiProperty({ description: 'Original rate before adjustment', example: '100.00' })
  rateOriginal: string; // BigDecimal in Java maps to string for precision

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt?: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt?: Date;
}
