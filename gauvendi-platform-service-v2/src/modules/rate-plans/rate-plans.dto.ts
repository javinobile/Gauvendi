import {
  ArrayProperty,
  OptionalArrayProperty
} from '@src/core/decorators/array-property.decorator';
import { BooleanTransform } from '@src/core/decorators/boolean-transform.decorator';
import {
  DayOfWeek,
  RatePlanStatusEnum,
  RatePlanTypeEnum,
  RoomProductStatus,
  RoomProductType
} from '@src/core/enums/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { DistributionChannel, RatePlanExpandEnum } from '../rate-plan/enums';

export class ExtranetRatePlanFilter {
  @IsOptional()
  @IsString()
  searchText?: string;

  @IsOptional()
  @OptionalArrayProperty()
  distributionChannelList?: DistributionChannel[];

  @IsOptional()
  @ArrayProperty()
  statusList?: RatePlanStatusEnum[];

  @IsOptional()
  @IsString()
  searchType?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @OptionalArrayProperty()
  idList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  expand?: RatePlanExpandEnum[];

  @IsOptional()
  @BooleanTransform()
  isSalesPlanManagementSearch?: boolean;

  @OptionalArrayProperty()
  typeList?: RatePlanTypeEnum[];
}

export class DailySalesPlanPricingBreakdownFilter {
  @IsString()
  propertyCode: string;

  @IsString()
  fromDate: string;

  @IsString()
  toDate: string;

  @BooleanTransform()
  isFollowingRetailStrategy: boolean;

  @BooleanTransform()
  hasPriceCombinedByDate: boolean;

  @IsNumber()
  guestCount: number;

  @OptionalArrayProperty()
  salesPlanIdList: string[];

  @BooleanTransform()
  hasIncludedServicesInPrice: boolean;

  @IsBoolean()
  hasCityTaxInPrice: boolean;

  @OptionalArrayProperty()
  distributionChannelList: DistributionChannel[];

  @IsEnum(RatePlanTypeEnum, { each: true })
  @OptionalArrayProperty()
  ratePlanTypes?: RatePlanTypeEnum[];
}

export class RoomProductDailyRateListFilter {
  @IsString()
  propertyCode: string;

  @IsString()
  adults: number;

  @IsString()
  fromDate: string;

  @IsString()
  toDate: string;

  @OptionalArrayProperty()
  childrenAgeList: number[];

  @OptionalArrayProperty()
  expand: string[];

  @OptionalArrayProperty()
  roomProductIdList: string[];

  @OptionalArrayProperty()
  roomProductRetailFeatureIdList: string[];

  @OptionalArrayProperty()
  roomProductStatusList: RoomProductStatus[];

  @OptionalArrayProperty()
  roomProductTypeList: RoomProductType[];

  @ArrayProperty()
  salesPlanIdList: string[];

  @IsOptional()
  @IsString()
  text?: string;
}

export class DailyRatePlanAdjustmentListFilter {
  @IsString()
  hotelCode: string;

  @IsString()
  fromDate: string;

  @IsString()
  toDate: string;

  @OptionalArrayProperty()
  ratePlanIdList: string[];
}

export class SetLowestSellingPriceDto {
  @IsNotEmpty()
  @IsString()
  propertyCode: string;

  @IsUUID()
  salesPlanId: string;

  @IsUUID()
  @IsOptional()
  roomProductId: string;

  @IsNotEmpty()
  @IsString()
  fromDate: string; // yyyy-MM-dd format

  @IsNotEmpty()
  @IsString()
  toDate: string; // yyyy-MM-dd format

  @IsNumber()
  targetPrice: number;

  @IsNumber()
  currentISELowestSellingPrice: number;

  @IsNumber()
  basePrice: number;

  @IsNumber()
  ratePlanAdjustments: number;

  @IsEnum(DayOfWeek, { each: true })
  @OptionalArrayProperty()
  dayList: DayOfWeek[];
}

export class RoomProductDailyRateDetailsFilter {
  @IsString()
  hotelCode: string;

  @IsNumber()
  guestCount: number;

  @IsString()
  fromDate: string;

  @IsString()
  toDate: string;

  @BooleanTransform()
  isIncludedDailyExtrasPricing: boolean;

  @BooleanTransform()
  isIncludedCityTax: boolean;

  @IsUUID()
  rfcId: string;

  @IsUUID()
  rfcRatePlanId: string;
}

export class RatePlanProductsToSellDailyDto {
  roomProductIds: string[];
  productToSell: number;
  date: string;
}

export class RatePlanProductsToSellDailyFilterDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsOptional()
  ratePlanId: string;

  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @IsDateString()
  @IsNotEmpty()
  toDate: string;

  @IsOptional()
  @OptionalArrayProperty()
  types: RoomProductType[];
}

export class ApaleoRatePlanPmsMappingListFilter {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsOptional()
  @OptionalArrayProperty()
  ratePlanIds?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  roomProductIds?: string[];
}

export class ApaleoRoomProductRatePlanPmsMappingInput {
  @IsUUID()
  @IsNotEmpty()
  ratePlanId: string;

  @IsUUID()
  @IsNotEmpty()
  roomProductId: string;

  @IsString()
  @IsOptional()
  mappingRatePlanCode: string;
}

export class ApaleoRoomProductRatePlanPmsMappingBulkInput {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoRoomProductRatePlanPmsMappingInput)
  mappingList?: ApaleoRoomProductRatePlanPmsMappingInput[];
}

export class ApaleoRatePlanPmsMappingInput {
  @IsUUID()
  @IsNotEmpty()
  ratePlanId: string;

  @IsString()
  @IsOptional()
  mappingRatePlanCode: string;
}

export class ApaleoRatePlanPmsMappingBulkInput {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoRatePlanPmsMappingInput)
  mappingList?: ApaleoRatePlanPmsMappingInput[];
}

export class DailyTrendDto {
  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;
}

export class DailyOccPaceTrendResponseDto {
  propertyId: string;

  date: string;

  paceTrend: number;
}

export class DailyPropertyAdrListResponseDto {
  propertyId: string;

  date: string;

  adr: number;
}

export class DailyPropertyPickupAdrListResponseDto extends DailyPropertyAdrListResponseDto {
  percentageDifference: number;
}
