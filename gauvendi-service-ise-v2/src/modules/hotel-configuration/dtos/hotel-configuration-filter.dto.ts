import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from 'src/core/dtos/common.dto';
import { HotelConfigurationTypeEnum } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelConfigurationConfigTypeEnum } from './hotel-configuration.enums';

export class HotelConfigurationFilterDto extends Filter {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  @OptionalArrayProperty()
  hotelIds?: string[];

  @IsEnum(HotelConfigurationConfigTypeEnum, { each: true })
  @OptionalArrayProperty()
  configTypes?: HotelConfigurationTypeEnum[];
}
