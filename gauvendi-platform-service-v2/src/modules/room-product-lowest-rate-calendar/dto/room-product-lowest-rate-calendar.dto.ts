import { ApiProperty } from '@nestjs/swagger';

export class RoomProductLowestRateCalendarDto {
  @ApiProperty({ 
    description: 'Date for the lowest rate',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  date: Date;

  @ApiProperty({ 
    description: 'Lowest rate for the date',
    example: 150.50,
    type: 'number'
  })
  lowestRate: number;
}
