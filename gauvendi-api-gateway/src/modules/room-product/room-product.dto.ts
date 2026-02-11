import { BooleanTransform } from "@src/core/decorators/boolean-transform.decorator";
import { BasePriceMode, DistributionChannel, RfcAllocationSetting, RoomProductBasePriceSettingModeEnum, RoomProductExtraType, RoomProductStatus, RoomProductType } from "@src/core/enums/common.enum";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { ArrayProperty, OptionalArrayProperty } from "src/core/decorators/array-property.decorator";

export enum RoomProductRelation {
  ROOM_PRODUCT_DAILY_AVAILABILITY = "roomProductDailyAvailabilities",
  ROOM_PRODUCT_IMAGES = "roomProductImages",
  ROOM_PRODUCT_EXTRAS = "roomProductExtras",
  ROOM_PRODUCT_ASSIGNED_UNITS = "roomProductAssignedUnits",
  ROOM_PRODUCT_RESTRICTIONS = "roomProductRestrictions",
  ROOM_PRODUCT_AUTOMATE_SETTINGS = "roomProductAutomateSettings",
  ROOM_PRODUCT_STANDARD_FEATURES = "roomProductStandardFeatures",
  ROOM_PRODUCT_RETAIL_FEATURES = "roomProductRetailFeatures",
  ROOM_PRODUCT_RETAIL_FEATURES_RETAIL_FEATURE = "roomProductRetailFeatures.retailFeature",
  ROOM_PRODUCT_STANDARD_FEATURES_STANDARD_FEATURE = "roomProductStandardFeatures.standardFeature",
  ROOM_PRODUCT_RATE_PLANS = "roomProductRatePlans",
  ROOM_PRODUCT_MAPPINGS = "roomProductMappings",
  ROOM_PRODUCT_EXTRA_OCCUPANCY_RATES = "roomProductExtraOccupancyRates",
}

export class RoomProductListQueryDto {
  // filter
  @ArrayProperty()
  @IsOptional()
  ids?: string[];

  @ArrayProperty()
  @IsOptional()
  status?: RoomProductStatus[];

  @ArrayProperty()
  @IsOptional()
  distributionChannel?: DistributionChannel[];

  @ArrayProperty()
  @IsOptional()
  type?: RoomProductType[];

  @ArrayProperty()
  @IsOptional()
  code?: string[];

  @ArrayProperty()
  @IsOptional()
  name?: string[];

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @ArrayProperty()
  @IsOptional()
  roomUnitIds?: string[];

  @ArrayProperty()
  @IsOptional()
  retailFeatureIds?: string[];

  @IsBoolean()
  @IsOptional()
  isGetAllRoomProductRetailFeatures?: boolean;

  // relations
  @ArrayProperty()
  @IsOptional()
  relations?: RoomProductRelation[];

  // pagination
  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  offset?: number;

  @IsBoolean()
  @IsOptional()
  isPresignedUrl?: boolean;

  @IsOptional()
  @BooleanTransform()
  isGroupByMrfcCluster?: boolean;
}

export class RoomProductQueryDto {
  // filter
  @ArrayProperty()
  @IsOptional()
  ids?: string[];

  @ArrayProperty()
  @IsOptional()
  status?: RoomProductStatus[];

  @ArrayProperty()
  @IsOptional()
  distributionChannel?: DistributionChannel[];

  @ArrayProperty()
  @IsOptional()
  type?: RoomProductType[];

  @ArrayProperty()
  @IsOptional()
  code?: string[];

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  // relations
  @ArrayProperty()
  @IsOptional()
  relations?: RoomProductRelation[];

  // pagination
  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  offset?: number;

  @ArrayProperty()
  @IsOptional()
  @IsString({ each: true })
  retailFeatureIds?: string[];
}

export class CreateRoomProductDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(RoomProductType)
  @IsNotEmpty()
  type: RoomProductType;
}

export class RoomProductTranslationDto {
  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRoomProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsEnum(RoomProductStatus)
  @IsOptional()
  status?: RoomProductStatus;

  @IsNumber()
  @IsOptional()
  space?: number;

  @IsNumber()
  @IsOptional()
  numberOfBedrooms?: number;

  @IsNumber()
  @IsOptional()
  capacityDefault?: number;

  @IsNumber()
  @IsOptional()
  maximumAdult?: number;

  @IsNumber()
  @IsOptional()
  maximumKid?: number;

  @IsNumber()
  @IsOptional()
  maximumPet?: number;

  @IsNumber()
  @IsOptional()
  capacityExtra?: number;

  @IsNumber()
  @IsOptional()
  extraBedAdult?: number;

  @IsNumber()
  @IsOptional()
  extraBedKid?: number;

  @ArrayProperty()
  @IsOptional()
  distributionChannel?: DistributionChannel[];

  @IsEnum(BasePriceMode)
  @IsOptional()
  basePriceMode?: BasePriceMode;

  @IsEnum(RfcAllocationSetting)
  @IsOptional()
  rfcAllocationSetting?: RfcAllocationSetting;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoomProductRetailFeatureDto)
  retailFeaturesAdded?: RoomProductRetailFeatureDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoomProductRetailFeatureDto)
  retailFeaturesUpdated?: RoomProductRetailFeatureDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoomProductRetailFeatureDto)
  retailFeaturesRemoved?: RoomProductRetailFeatureDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoomProductTranslationDto)
  translations?: RoomProductTranslationDto[];

  @ArrayProperty()
  @IsOptional()
  roomUnitIds: string[];

  @IsOptional()
  @IsBoolean()
  isLockedUnit?: boolean;

  // Geo fields (optional - for when location differs from hotel location)
  @IsString()
  @IsOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  longitude?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;
}

export class RoomProductRetailFeatureDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

// export class UpdateRoomProductRetailFeaturesDto {
//   @IsString()
//   @IsNotEmpty()
//   hotelId: string;

//   @IsArray()
//   @IsOptional()
//   @ValidateNested({ each: true })
//   @Type(() => RoomProductRetailFeatureDto)
//   retailFeatures?: RoomProductRetailFeatureDto[];
// }

export class UpdateRoomProductExtrasDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsEnum(RoomProductExtraType)
  @IsNotEmpty()
  type: RoomProductExtraType;

  @IsString()
  @IsNotEmpty()
  serviceId: string;
}

// Room Product Extra Management DTOs (Multi-Extra Operations)
export class RoomProductExtraItemDto {
  @IsString()
  @IsNotEmpty()
  extrasId: string;

  @IsEnum(RoomProductExtraType)
  @IsNotEmpty()
  type: RoomProductExtraType;
}

export class CreateRoomProductExtrasDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomProductExtraItemDto)
  extras: RoomProductExtraItemDto[];
}

export class DeleteRoomProductExtrasDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  extraIds: string[];
}

export class UploadRoomProductImageDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class UpdateRoomProductImageDto {
  @IsNumber()
  @IsOptional()
  sequence: number;

  @IsString()
  @IsOptional()
  description: string;
}

export class UploadRoomProductImagesFromGalleryDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  imageKeys: string[];
}

export class ReorderRoomProductImageDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[];
}

export class RoomProductPricingModeDto {
  mode: string;
  roomProductId: string;
  rate: number;
  linkedRoomProducts: any[];
}

export class CreateRoomProductExtraOccupancyRateDto {
  @IsNumber()
  @IsNotEmpty()
  extraPeople: number;

  @IsNumber()
  @IsOptional()
  extraRate: number;
}

export class CreateRoomProductExtraOccupancyRatesDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomProductExtraOccupancyRateDto)
  extraOccupancyRates: CreateRoomProductExtraOccupancyRateDto[];
}
export class CreateRoomProductBasePriceSettingDto {
  @IsEnum(RoomProductBasePriceSettingModeEnum)
  @IsNotEmpty()
  mode: RoomProductBasePriceSettingModeEnum;

  @IsNumber()
  @IsOptional()
  fixedPrice?: number;
}
export class CreateRoomProductRoomMappingDto {
  @IsString()
  @IsNotEmpty()
  relatedRoomProductId: string;
}

export enum ModeEnumQuery {
  CREATED = "created",
  UPDATED = "updated",
  COLLIDING = "colliding",
}

export class RoomProductRestrictionQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(ModeEnumQuery)
  @IsOptional()
  mode?: ModeEnumQuery = ModeEnumQuery.CREATED;
}

export class RoomProductRestrictionAutomateSettingBodyDto {
  @IsString()
  @IsNotEmpty()
  roomProductId: string;

  @IsBoolean()
  @IsNotEmpty()
  isAutomated: boolean;

  @IsBoolean()
  @IsNotEmpty()
  overrideDefault: boolean;

  @IsBoolean()
  @IsNotEmpty()
  overrideDefaultSetMaximum: boolean;

  @IsString()
  @IsNotEmpty()
  hotelId: string;
}

export class RoomProductRestrictionDto {
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  roomProductIds?: string[]; // if empty, process all active products
}

export class AutomateLosRequestDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsOptional()
  fromDate?: string; // defaults to today

  @IsString()
  @IsOptional()
  toDate?: string; // defaults to today

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  roomProductIds?: string[]; // if empty, process all active products
}

export enum SHOW_MODE_ENUM {
  ALL = "ALL",
  ASSIGNED = "ASSIGNED",
  UNASSIGNED = "UNASSIGNED",
}

export class GetRatePlanRfcAssignmentListDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ArrayProperty()
  ratePlanIdList: string[];

  @IsEnum(SHOW_MODE_ENUM)
  @IsNotEmpty()
  showMode: SHOW_MODE_ENUM;

  @IsEnum(RoomProductType)
  @IsOptional()
  type?: RoomProductType;

  @OptionalArrayProperty()
  sort?: string[];

  @IsNumber()
  @IsOptional()
  pageIndex?: number;

  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

export class UnassignAllRoomProductFromRatePlanDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsNotEmpty()
  ratePlanId: string;

  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    return value === "true" || value === true;
  })
  allowUnassignedAllDerived?: any;

  @ArrayProperty()
  @IsOptional()
  roomProductIds?: string[];
}

export class AssignRoomProductToRatePlanDto extends UnassignAllRoomProductFromRatePlanDto {
  @ArrayProperty()
  @IsNotEmpty()
  rfcIdList: string[];

  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    return value === "true" || value === true;
  })
  allowAssignAllDerived?: any;
}

export class UnassignRoomProductFromRatePlanDto extends AssignRoomProductToRatePlanDto {}

export class CloneRoomProductDto {
  @IsString()
  @IsNotEmpty()
  roomProductId: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsEnum(RoomProductType)
  @IsOptional()
  roomProductType?: RoomProductType;
}

export class ProductCartDetailsList {
  @IsString()
  @IsNotEmpty()
  roomProductId: string;

  @IsString()
  @IsNotEmpty()
  salesPlanId: string;
}

export class CppProductCartListFilterDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductCartDetailsList)
  productCartDetailsList: ProductCartDetailsList[];
}

export class DeleteRoomProductDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  ids: string[];
}

export class BulkUpsertRoomProductRetailFeatureItemDto {
  @IsString()
  @IsNotEmpty()
  hotelRetailFeatureId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class BulkUpsertRoomProductRetailFeatureDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsertRoomProductRetailFeatureItemDto)
  retailFeatures: BulkUpsertRoomProductRetailFeatureItemDto[];
}

export class BulkUpsertRoomProductRetailFeaturesDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsertRoomProductRetailFeatureDto)
  items: BulkUpsertRoomProductRetailFeatureDto[];
}
