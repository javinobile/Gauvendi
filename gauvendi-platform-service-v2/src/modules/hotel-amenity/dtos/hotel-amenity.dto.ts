import { Filter } from '@src/core/dtos/common.dto';
import { AmenityStatusEnum, AmenityTypeEnum } from '@src/core/enums/common';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';

export class HotelAmenityFilterDto extends Filter {
  @IsUUID('4')
  @OptionalArrayProperty()
  ids?: string[];

  mappingPmsCodes?: string[];

  hotelId?: string;

  status?: AmenityStatusEnum;
}


export class HotelAmenityBodyDto extends Filter {
  @IsOptional()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsEnum(AmenityTypeEnum)
  amenityType?: AmenityTypeEnum;

  @IsOptional()
  code?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codes?: string[];

  @IsOptional()
  @IsEnum(AmenityStatusEnum)
  status?: AmenityStatusEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}