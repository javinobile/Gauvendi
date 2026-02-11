import { Filter } from '@src/core/dtos/common.dto';
import { IsUUID } from 'class-validator';

export class RoomProductMappingPmsFilterDto extends Filter {
  @IsUUID('4')
  hotelId?: string;

  mappingPmsCodes?: string[];
}
