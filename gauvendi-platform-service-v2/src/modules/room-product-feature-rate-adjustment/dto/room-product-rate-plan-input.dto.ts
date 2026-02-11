import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class RoomProductRatePlanInputDto {
  @ApiProperty({ description: 'Room product rate plan ID', example: 'room-product-rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
