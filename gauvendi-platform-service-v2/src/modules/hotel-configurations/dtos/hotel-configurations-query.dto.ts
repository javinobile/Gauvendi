import { OptionalArrayProperty } from '@src/core/decorators/array-property.decorator';
import { HotelConfigurationTypeEnum } from '@src/core/enums/common';
import { IsNotEmpty, IsString } from 'class-validator';

export class HotelConfigurationsQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @OptionalArrayProperty()
  configTypeList: HotelConfigurationTypeEnum[];
}

export class HotelConfigurationsCacheQueryDto {
  hotelId: string;

  configTypeList: HotelConfigurationTypeEnum[];
}
