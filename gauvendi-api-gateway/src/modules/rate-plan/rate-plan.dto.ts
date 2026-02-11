import { ApiProperty } from "@nestjs/swagger";
import { ArrayProperty, OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { BooleanTransform, OptionalBoolean } from "@src/core/decorators/boolean-transform.decorator";
import {
  CancellationFeeUnitEnum,
  CancellationPolicyDisplayUnitEnum,
  DayOfWeek,
  DistributionChannel,
  RatePlanAdjustmentType,
  RatePlanDerivedSettingInheritedFields,
  RatePlanExpandEnum,
  RatePlanPricingMethodologyEnum,
  RatePlanStatusEnum,
  RatePlanTypeEnum,
  RoomProductStatus,
  RoomProductType,
  RoundingModeEnum,
  SellingStrategyTypeEnum,
  Weekday,
} from "@src/core/enums/common.enum";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

export class RatePlanFilterDto {
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  idList?: string[];

  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  hotelIdList?: string[];

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

  @OptionalArrayProperty()
  statusList?: RatePlanStatusEnum[];

  @IsOptional()
  @IsEnum(RoundingModeEnum)
  roundingMode?: RoundingModeEnum;

  @OptionalArrayProperty()
  typeList?: RatePlanTypeEnum[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mappingRatePlanCodeList?: string[];

  @OptionalArrayProperty()
  promoCodeList?: string[];

  @IsOptional()
  @IsString()
  hotelCxlPolicyCode?: string;

  @IsOptional()
  @OptionalBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languageCodeList?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(RatePlanPricingMethodologyEnum, { each: true })
  pricingMethodologyList?: RatePlanPricingMethodologyEnum[];

  @OptionalArrayProperty()
  distributionChannelList?: DistributionChannel[];

  @IsOptional()
  @IsArray()
  @IsEnum(SellingStrategyTypeEnum, { each: true })
  sellingStrategyTypeList?: SellingStrategyTypeEnum[];

  @IsOptional()
  @IsString()
  searchType?: string; // TODO: Define SalesPlanSearchTypeEnum

  @IsOptional()
  @IsString()
  searchText?: string;

  @IsOptional()
  @OptionalBoolean()
  isSalesPlanManagementSearch?: boolean;

  @IsOptional()
  @OptionalBoolean()
  isSearchPromoCodeExactly?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  marketSegmentIdList?: string[];

  @IsOptional()
  @IsNumber()
  adults?: number;

  @IsOptional()
  @IsNumber()
  pets?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  childrenAgeList?: number[];

  // Pagination
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expand?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sort?: string[];
}

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

export class RatePlanDerivedSettingDto {
  @IsOptional()
  @IsUUID()
  ratePlanId?: string;

  @IsOptional()
  @IsBoolean()
  followDailyCxlPolicy?: boolean;

  @IsOptional()
  @IsBoolean()
  followDailyIncludedAmenity?: boolean;

  @IsOptional()
  @IsBoolean()
  followDailyPaymentTerm?: boolean;

  @IsOptional()
  @IsBoolean()
  followDailyRestriction?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(RatePlanDerivedSettingInheritedFields, { each: true })
  inheritedRestrictionFields: RatePlanDerivedSettingInheritedFields[];

  @IsOptional()
  @IsBoolean()
  followDailyRoomProductAvailability?: boolean;
}

export class RatePlanTranslationDto {
  @IsNotEmpty()
  @IsString()
  languageCode: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class DeleteRatePlanDto {
  @IsNotEmpty()
  @IsUUID()
  hotelId: string;
}

export class DeleteAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsEnum(Weekday, { each: true })
  @OptionalArrayProperty()
  dayList: Weekday[];

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;
}

export class UpsertAdjustmentDto extends DeleteAdjustmentDto {
  @IsEnum(RatePlanAdjustmentType)
  @IsNotEmpty()
  unit: RatePlanAdjustmentType;

  @IsNumber()
  @IsNotEmpty()
  value: number;
}

export class RatePlanDto {
  @IsNotEmpty()
  @IsString()
  hotelId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(RatePlanPricingMethodologyEnum)
  pricingMethodology?: RatePlanPricingMethodologyEnum;

  @IsOptional()
  @IsNumber()
  hourPrior?: number;

  @IsOptional()
  @IsEnum(CancellationPolicyDisplayUnitEnum)
  displayUnit?: CancellationPolicyDisplayUnitEnum;

  @IsOptional()
  @IsNumber()
  cancellationFeeValue?: number;

  @IsOptional()
  @IsEnum(CancellationFeeUnitEnum)
  cancellationFeeUnit?: CancellationFeeUnitEnum;

  @IsOptional()
  @IsString()
  hotelCxlPolicyCode?: string;

  @IsOptional()
  @IsString()
  paymentTermCode?: string;

  @IsOptional()
  @IsNumber()
  payAtHotel?: number;

  @IsOptional()
  @IsNumber()
  payOnConfirmation?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RoundingModeEnum)
  roundingMode?: RoundingModeEnum;

  @IsOptional()
  @IsEnum(RatePlanStatusEnum)
  status?: RatePlanStatusEnum;

  @IsOptional()
  @IsString()
  mappingRatePlanCode?: string;

  @IsOptional()
  @IsEnum(RatePlanTypeEnum)
  type?: RatePlanTypeEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  promoCodeList?: string[];

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(DistributionChannel, { each: true })
  distributionChannelList?: DistributionChannel[];

  @IsOptional()
  @IsBoolean()
  rfcAttributeMode?: boolean;

  @IsOptional()
  @IsBoolean()
  mrfcPositioningMode?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hotelExtrasCodeList?: string[];

  @IsOptional()
  @IsNumber()
  adjustmentValue?: number;

  @IsOptional()
  @IsEnum(RatePlanAdjustmentType)
  adjustmentUnit?: RatePlanAdjustmentType;

  @IsOptional()
  @IsEnum(SellingStrategyTypeEnum)
  sellingStrategyType?: SellingStrategyTypeEnum;

  @IsOptional()
  @IsUUID()
  marketSegmentId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RatePlanDerivedSettingDto)
  ratePlanDerivedSetting?: RatePlanDerivedSettingDto;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  selectedRfcIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatePlanTranslationDto)
  translationList?: RatePlanTranslationDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  unselectedRfcIds?: string[];
}

export class RatePlanDailyHotelOccupancyRateFilterDto {
  @IsNotEmpty()
  @IsString()
  hotelCode: string;

  @IsNotEmpty()
  @IsString()
  fromDate: string;

  @IsNotEmpty()
  @IsString()
  toDate: string;

  @IsOptional()
  @OptionalBoolean()
  onlyOccRate: boolean;
}

export class DailySalesPlanPricingBreakdownFilterDto {
  @IsNotEmpty()
  @IsString()
  propertyCode: string;

  @IsNotEmpty()
  @IsString()
  fromDate: string; // yyyy-MM-dd format

  @IsNotEmpty()
  @IsString()
  toDate: string; // yyyy-MM-dd format

  @OptionalArrayProperty()
  salesPlanIdList?: string[];

  @IsOptional()
  @OptionalBoolean()
  isFollowingRetailStrategy?: boolean;

  @IsOptional()
  @OptionalBoolean()
  hasPriceCombinedByDate?: boolean;

  @OptionalArrayProperty()
  distributionChannelList?: DistributionChannel[];

  @IsOptional()
  @IsNumber()
  guestCount?: number;

  @IsOptional()
  @OptionalBoolean()
  hasIncludedServicesInPrice?: boolean;

  @IsOptional()
  @OptionalBoolean()
  hasCityTaxInPrice?: boolean;

  @IsEnum(RatePlanTypeEnum, { each: true })
  @OptionalArrayProperty()
  ratePlanTypes?: RatePlanTypeEnum[];
}

export class DailySellingRateDto {
  @IsOptional()
  @IsUUID()
  rfcRatePlanId?: string;

  @IsOptional()
  @IsUUID()
  retailFeatureId?: string;

  @IsOptional()
  @IsString()
  date?: string; // yyyy-MM-dd format

  @IsOptional()
  @OptionalBoolean()
  isDerived?: boolean;

  @IsOptional()
  @IsNumber()
  originalSellingRate?: number;

  @IsOptional()
  @IsNumber()
  featureAdjustmentRate?: number;

  @IsOptional()
  @IsNumber()
  ratePlanAdjustmentRate?: number;

  @IsOptional()
  @IsNumber()
  salesPlanAdjustmentValue?: number;

  @IsOptional()
  @IsNumber()
  includedExtraServicesRate?: number;

  @IsOptional()
  @IsNumber()
  includedExtraServicesRateAfterTax?: number;

  @IsOptional()
  @IsNumber()
  sellingRate?: number;

  @IsOptional()
  @IsNumber()
  originalTotalSellingRate?: number;

  @IsOptional()
  @OptionalBoolean()
  isAdjusted?: boolean;

  @IsOptional()
  @IsNumber()
  adjustmentValue?: number;

  @IsOptional()
  @OptionalBoolean()
  isSoldOut?: boolean;

  @IsOptional()
  @IsNumber()
  cityTaxAmount?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  netPrice?: number;

  @IsOptional()
  @IsNumber()
  grossPrice?: number;

  @IsOptional()
  @IsUUID()
  roomProductId?: string;

  @IsOptional()
  @IsUUID()
  salesPlanId?: string;

  @IsOptional()
  @IsNumber()
  rateBeforeAdjustment?: number;

  @IsOptional()
  @IsNumber()
  rateAfterAdjustment?: number;

  @IsOptional()
  @IsNumber()
  includedExtraServicesRateBeforeAdjustment?: number;

  @IsOptional()
  @IsNumber()
  includedExtraServicesRateAfterAdjustment?: number;

  @IsOptional()
  @IsNumber()
  extraOccupancySurchargeAmount?: number;

  @IsOptional()
  @IsNumber()
  baseSellingRate?: number;

  @IsOptional()
  @IsNumber()
  roomOnlySellingPrice?: number;

  @IsOptional()
  @IsNumber()
  extraBedAmount?: number;

  @IsOptional()
  @IsNumber()
  roomSellingRateGap?: number;

  @IsOptional()
  @IsNumber()
  roundingGap?: number;

  @IsOptional()
  @IsNumber()
  roomOnlyTaxAmount?: number;

  @IsOptional()
  @IsNumber()
  includedServicesAmountAfterTax?: number;

  @IsOptional()
  @IsNumber()
  includedServicesTaxAmount?: number;
}

export class DailySalesPlanPricingBreakdownDto {
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  salesPlanId?: string;

  @IsOptional()
  @IsString()
  date?: string; // yyyy-MM-dd format

  @IsOptional()
  @IsNumber()
  lowestPrice?: number;

  @IsOptional()
  @IsNumber()
  highestPrice?: number;

  @IsOptional()
  lowestPriceObject?: DailySellingRateDto;
}

export class SellabilityDto {
  @IsNotEmpty()
  @IsEnum(DistributionChannel)
  distributionChannel: DistributionChannel;

  @IsNotEmpty()
  @IsBoolean()
  isSellable: boolean;
}

export class UpsertSalePlanSellAbilityDto {
  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellabilityDto)
  sellabilityList: SellabilityDto[];
}

export class RoomProductDailyRateListFilter {
  @IsString()
  propertyCode: string;

  @IsNumber()
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

  @OptionalArrayProperty()
  salesPlanIdList: string[];

  @IsOptional()
  text: string;
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

export class MonthlyRatePlanOverviewFilterDto {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsString()
  month: string;

  @IsNumber()
  year: number;
}

export class DailyTrendDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  toDate: string;
}
