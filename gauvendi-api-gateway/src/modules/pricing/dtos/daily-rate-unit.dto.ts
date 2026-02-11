import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class DailyRateUnitDto {
  @ApiProperty({ description: 'Daily rate amount', example: 25.50 })
  @IsNumber()
  rate: number;

  @ApiProperty({ description: 'Date for the rate', example: '2023-12-01' })
  @IsDateString()
  date: Date;

  constructor(rate: number = 0, date: Date = new Date()) {
    this.rate = rate;
    this.date = date;
  }
}
