import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Filter } from 'src/core/dtos/common.dto';

export class QueryHotelRetailFeaturesDto extends Filter {
  @IsNotEmpty()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsString({ each: true })
  codes?: string[];
  usingSortDefault?: boolean;
}
