import { ApiProperty } from '@nestjs/swagger';
import { ExtraOccupancyRateDto } from './extra-occupancy-rate.dto';

export class DailyExtraOccupancyRateDto {
  @ApiProperty({ 
    description: 'Room product rate plan ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012'
  })
  roomProductRatePlanId?: string;

  rfcRatePlanId?: string;

  @ApiProperty({ 
    description: 'Date for the daily rates',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  date: Date;

  @ApiProperty({ 
    description: 'List of extra occupancy rates for different guest counts',
    type: [ExtraOccupancyRateDto]
  })
  extraOccupancyRateList: ExtraOccupancyRateDto[];
}
