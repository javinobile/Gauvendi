import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Filter } from '../../../core/dtos/common.dto';

export class RoomProductLowestRateCalendarFilterDto extends Filter {
  @IsUUID()
  @ApiProperty({ 
    description: 'Hotel ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  hotelId: string;

  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'List of room product rate plan IDs to filter by',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012'],
    type: [String]
  })
  rfcRatePlanIdList?: string[];

  @IsDateString()
  @ApiProperty({ 
    description: 'Start date for the calendar range',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  fromDate: string;

  @IsDateString()
  @ApiProperty({ 
    description: 'End date for the calendar range',
    example: '2023-12-31',
    type: 'string',
    format: 'date'
  })
  toDate: string;
}
