import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { DayOfWeek } from 'src/core/enums/common';

export class RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Hotel ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  hotelId: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Room product rate plan ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012'
  })
  rfcRatePlanId : string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Number of extra people',
    example: 2,
    minimum: 0
  })
  extraPeople: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Extra rate amount',
    example: 50.75,
    minimum: 0
  })
  extraRate: number;


  fromDate: string;
  toDate: string;

  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  @IsNotEmpty()
  @ApiProperty({
    description: 'List of days of week to apply the adjustment',
    example: [DayOfWeek.MONDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY],
    enum: DayOfWeek,
    isArray: true
  })
  dayList: DayOfWeek[];
}
