import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsArray } from 'class-validator';
import { Filter } from '../../../core/dtos/common.dto';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';

export class RoomProductExtraOccupancyRateFilterDto extends Filter {
  @ApiPropertyOptional({ description: 'Hotel ID to filter by', example: 'hotel-uuid' })
  @IsUUID()
  @IsOptional()
  hotelId?: string;

  @ApiPropertyOptional({ 
    description: 'List of RFC IDs to filter by',
    example: ['rfc-uuid-1', 'rfc-uuid-2'],
    type: [String]
  })


  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  roomProductIdList?: string[];

  @ApiPropertyOptional({ 
    description: 'List of IDs to filter by',
    example: ['uuid-1', 'uuid-2'],
    type: [String]
  })

  
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  idList?: string[];
}
