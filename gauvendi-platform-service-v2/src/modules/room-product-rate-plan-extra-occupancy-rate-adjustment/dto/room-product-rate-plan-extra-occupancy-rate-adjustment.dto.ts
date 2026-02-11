import { ApiProperty } from '@nestjs/swagger';

export class RoomProductRatePlanExtraOccupancyRateAdjustmentDto {
  @ApiProperty({ 
    description: 'Unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  id: string;

  @ApiProperty({ 
    description: 'Hotel ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  hotelId: string;

  @ApiProperty({ 
    description: 'Room product rate plan ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012'
  })
  roomProductRatePlanId: string;

  @ApiProperty({ 
    description: 'Number of extra people',
    example: 2
  })
  extraPeople: number;

  @ApiProperty({ 
    description: 'Extra rate amount',
    example: 50.75
  })
  extraRate: number;

  @ApiProperty({ 
    description: 'Date for the adjustment',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  date: Date;
}
