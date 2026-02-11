import { IsOptional, IsString, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from 'src/core/dtos/common.dto';

export class HotelRetailCategoryFilterDto extends Filter {
  @IsOptional()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  idList?: string[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  codes: string[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  languageCodes?: string[];
}
