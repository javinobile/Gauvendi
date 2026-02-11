import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';

export class DailyRoomProductRatePlanExtraOccupancyRateFilterDto {

  @IsUUID(4, { each: true })
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'List of room product rate plan IDs',
    example: ['b2c3d4e5-f6g7-8901-bcde-f23456789012', 'c3d4e5f6-g7h8-9012-cdef-g34567890123'],
    type: [String]
  })
  @OptionalArrayProperty()
  roomProductRatePlanIdList: string[];

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'Start date for the daily rates',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  fromDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'End date for the daily rates',
    example: '2023-12-31',
    type: 'string',
    format: 'date'
  })
  toDate: Date;
}
