import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from '../../../core/dtos/common.dto';

export class DailyRfcRatePlanExtraOccupancyRateFilterDto {
  fromDate: string;

  toDate: string;

  rfcRatePlanIdList: string[];
}


export class RoomProductRatePlanExtraOccupancyRateAdjustmentFilterDto extends Filter {
  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'Hotel ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  hotelId?: string;


  @IsUUID(4, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'List of room product rate plan IDs to filter by',
    example: ['b2c3d4e5-f6g7-8901-bcde-f23456789012', 'c3d4e5f6-g7h8-9012-cdef-g34567890123'],
    type: [String]
  })
  @OptionalArrayProperty()
  roomProductRatePlanIdList?: string[];


  @IsUUID(4, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'List of adjustment IDs to filter by',
    example: ['d4e5f6g7-h8i9-0123-defg-h45678901234'],
    type: [String]
  })
  @OptionalArrayProperty()
  idList?: string[];


  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'Start date for filtering adjustments',
    example: '2023-12-01',
    type: 'string',
    format: 'date'
  })
  fromDate?: Date;


  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'End date for filtering adjustments',
    example: '2023-12-31',
    type: 'string',
    format: 'date'
  })
  toDate?: Date;
}
