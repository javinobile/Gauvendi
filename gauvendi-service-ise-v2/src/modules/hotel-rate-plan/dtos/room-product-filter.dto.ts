import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from 'src/core/dtos/common.dto';
import {
  DistributionChannel,
  RfcAllocationSetting,
  RoomProductStatus,
  RoomProductType
} from 'src/core/entities/room-product.entity';

export enum RfcStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT'
}

export class RoomProductFilterDto extends Filter {
  @IsOptional()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsNumber()
  fromTime?: number;

  @IsOptional()
  @IsNumber()
  toTime?: number;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  idList?: string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  excludeIdList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @IsString({ each: true })
  codeList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @IsEnum(RoomProductType, { each: true })
  typeList?: RoomProductType[];

  @IsOptional()
  @OptionalArrayProperty()
  @IsEnum(RoomProductStatus, { each: true })
  statusList?: RoomProductStatus[];

  @IsOptional()
  @OptionalArrayProperty()
  @IsEnum(RfcAllocationSetting, { each: true })
  roomProductAllocationSettingList?: RfcAllocationSetting[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  travelTagList?: string[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  occasionList?: string[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  languageCodeList?: string[];

  @IsOptional()
  @IsEnum(DistributionChannel, { each: true })
  @OptionalArrayProperty()
  distributionChannelList?: DistributionChannel[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  capacityIncludesExtraBed?: boolean;
}
