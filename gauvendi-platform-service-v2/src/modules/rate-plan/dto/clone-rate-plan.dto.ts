import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CloneRatePlanDto {
  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ApiProperty({ description: 'Source rate plan ID to clone from', example: 'rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty()
  ratePlanId: string;
}
