import { ApiProperty } from '@nestjs/swagger';
import { DistributionChannel } from 'src/core/entities/room-product.entity';

export class RatePlanDailySellabilityDto {
  @ApiProperty({
    description: 'Unique identifier for the rate plan daily sellability adjustment',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Hotel ID',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  hotelId: string;

  @ApiProperty({
    description: 'Rate plan ID (maps from Java salesPlanId)',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  ratePlanId: string;

  @ApiProperty({
    description: 'Distribution channel',
    enum: DistributionChannel,
    example: DistributionChannel.GV_SALES_ENGINE
  })
  distributionChannel: DistributionChannel;

  @ApiProperty({
    description: 'Date for the sellability adjustment',
    example: '2024-01-15'
  })
  date: string;

  @ApiProperty({
    description: 'Whether the rate plan is sellable on this date',
    example: true
  })
  isSellable: boolean;
}
