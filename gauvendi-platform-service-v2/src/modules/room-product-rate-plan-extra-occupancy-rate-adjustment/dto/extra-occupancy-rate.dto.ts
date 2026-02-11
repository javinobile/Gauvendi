import { ApiProperty } from '@nestjs/swagger';

export class ExtraOccupancyRateDto {
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

  constructor(extraPeople: number = 0, extraRate: number = 0) {
    this.extraPeople = extraPeople;
    this.extraRate = extraRate;
  }
}
