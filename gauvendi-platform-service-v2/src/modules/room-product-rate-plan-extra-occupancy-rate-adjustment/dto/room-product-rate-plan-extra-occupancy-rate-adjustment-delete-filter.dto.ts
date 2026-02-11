import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Weekday } from 'src/core/enums/common';


export class RoomProductRatePlanExtraOccupancyRateAdjustmentDeleteFilterDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Room product rate plan ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012'
  })
  roomProductRatePlanId: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Number of extra people',
    example: 2,
    minimum: 0
  })
  @IsOptional()
  extraPeople: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Extra rate amount',
    example: 50.75,
    minimum: 0
  })
  @IsOptional()
  extraRate: number;

  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Start date for the adjustment period',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  @IsOptional()
  fromDate: Date;

  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty({
    description: 'End date for the adjustment period',
    example: '2023-12-31',
    type: 'string',
    format: 'date'
  })
  @IsOptional()
  toDate: Date;

  @IsEnum(Weekday, { each: true })
  @IsNotEmpty()
  @ApiProperty({
    description: 'List of days of week to apply the adjustment',
    example: [Weekday.Monday, Weekday.Friday, Weekday.Saturday],
    enum: Weekday,
    isArray: true
  })
  @OptionalArrayProperty()
  dayList: Weekday[];
}
