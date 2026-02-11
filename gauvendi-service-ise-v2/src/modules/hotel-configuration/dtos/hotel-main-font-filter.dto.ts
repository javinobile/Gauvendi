import { IsOptional, IsString } from 'class-validator';
import { Filter } from 'src/core/dtos/common.dto';

export class HotelMainFontFilterDto extends Filter {
  @IsOptional()
  @IsString()
  propertyCode?: string;
}
