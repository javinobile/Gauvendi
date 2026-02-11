import { Filter } from '@src/core/dtos/common.dto';
import { IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';

export class RoomProductMappingFilterDto extends Filter {
  @IsUUID('4')
  hotelId?: string;

  @IsUUID('4')
  @OptionalArrayProperty()
  roomProductIds?: string[];
}
