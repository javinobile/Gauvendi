import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomProductExtraOccupancyRateDto {
  @ApiProperty({ description: 'RFC extra occupancy rate ID', example: 'uuid-123' })
  id: string;

  @ApiProperty({ description: 'RFC ID', example: 'rfc-uuid' })
  rfcId: string;

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  hotelId: string;

  @ApiPropertyOptional({ description: 'Number of extra people', example: 2 })
  extraPeople?: number;

  @ApiPropertyOptional({ description: 'Extra rate for additional occupancy', example: '50.00' })
  extraRate?: string; // BigDecimal in Java maps to string for precision

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt?: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt?: Date;
}
