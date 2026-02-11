import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from 'src/core/dtos/common.dto';
import {
  RatePlanStatusEnum,
  RatePlanTypeEnum,
  RoundingModeEnum
} from 'src/core/entities/pricing-entities/rate-plan.entity';
import { DistributionChannel } from 'src/core/entities/room-product.entity';

export class RatePlanFilterDto extends Filter {
  @IsOptional()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  idList?: string[];

  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  hotelIdList?: string[];

  @IsOptional()
  @IsEnum(RoundingModeEnum)
  roundingMode?: RoundingModeEnum;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codeList?: string[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  hotelCxlPolicyCode?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(RatePlanTypeEnum, { each: true })
  typeList?: RatePlanTypeEnum[];

  @IsOptional()
  @IsArray()
  @IsEnum(RatePlanStatusEnum, { each: true })
  statusList?: RatePlanStatusEnum[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languageCodeList?: string[];

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(DistributionChannel, { each: true })
  distributionChannelList?: DistributionChannel[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  promoCodeList?: string[];

  @IsOptional()
  @IsBoolean()
  isSearchPromoCodeExactly?: boolean;

  @IsOptional()
  @IsInt()
  adults?: number;

  @IsOptional()
  @IsInt()
  pets?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  childrenAgeList?: number[];
}
