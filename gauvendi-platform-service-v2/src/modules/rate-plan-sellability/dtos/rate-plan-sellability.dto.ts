import { ApiProperty } from '@nestjs/swagger';
import { DistributionChannel } from 'src/core/enums/common';

export class RatePlanSellabilityDto {
  @ApiProperty({
    description: 'Unique identifier for the rate plan sellability',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Hotel ID (maps from Java propertyId)',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  hotelId: string;

  @ApiProperty({
    description: 'Rate plan ID (maps from Java salesPlanId)',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  ratePlanId: string;

  @ApiProperty({
    description: 'Distribution channels',
    enum: DistributionChannel,
    isArray: true,
    example: [DistributionChannel.GV_SALES_ENGINE, DistributionChannel.GV_VOICE]
  })
  distributionChannel: DistributionChannel[];
}
