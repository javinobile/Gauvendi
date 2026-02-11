import {
  IsUUID,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNumber
} from 'class-validator';
import {
  RatePlanStatusEnum,
  RoundingModeEnum,
  RatePlanTypeEnum,
  RatePlanPricingMethodologyEnum,
  SellingStrategyTypeEnum,
  LanguageCodeEnum
} from 'src/core/enums/common';
import { DistributionChannel, RatePlanExpandEnum } from '../enums';
import { ArrayProperty, OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { BooleanTransform } from '@src/core/decorators/boolean-transform.decorator';
import { Filter } from '@src/core/dtos/common.dto';

export class RatePlanFilterDto extends Filter {
  idList?: string[];

  id?: string;

  hotelId?: string;

  hotelIdList?: string[];

  code?: string;

  codeList?: string[];

  name?: string;

  statusList?: RatePlanStatusEnum[];

  roundingMode?: RoundingModeEnum;

  typeList?: RatePlanTypeEnum[];

  mappingRatePlanCodeList?: string[];

  promoCodeList?: string[];

  hotelCxlPolicyCode?: string;

  isPrimary?: boolean;

  languageCodeList?: string[];

  pricingMethodologyList?: RatePlanPricingMethodologyEnum[];

  distributionChannelList?: DistributionChannel[];

  sellingStrategyTypeList?: SellingStrategyTypeEnum[];

  searchType?: string; // TODO: Define SalesPlanSearchTypeEnum

  searchText?: string;

  isSalesPlanManagementSearch?: boolean;

  isSearchPromoCodeExactly?: boolean;

  marketSegmentIdList?: string[];

  adults?: number;

  pets?: number;

  childrenAgeList?: number[];

  // Pagination
  page?: number;

  expand?: string[];
}

export class MonthlyRatePlanOverviewFilterDto {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsString()
  month: string;

  @IsNumber()
  year: number;
}
