import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class RoomProductExtraOccupancyRateInputDto {
  @ApiProperty({ description: 'Room Product ID', example: 'room-product-uuid' })
  @IsUUID()
  roomProductId: string;

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  hotelId: string;

  @ApiPropertyOptional({ description: 'Number of extra people', example: 2 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  extraPeople?: number;

  @ApiPropertyOptional({ description: 'Extra rate for additional occupancy', example: '50.00' })
  @IsString()
  @IsOptional()
  extraRate?: string; // BigDecimal in Java maps to string for precision
}
