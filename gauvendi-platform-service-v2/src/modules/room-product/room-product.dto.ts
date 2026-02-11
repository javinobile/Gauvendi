import { RoomProduct } from 'src/core/entities/room-product.entity';
import {
  BasePriceMode,
  RfcAllocationSetting,
  RoomProductBasePriceSettingModeEnum,
  RoomProductExtraType,
  RoomProductStatus,
  RoomProductType
} from 'src/core/enums/common';
import { DistributionChannel } from '../rate-plan/enums';
import { Filter } from '@src/core/dtos/common.dto';
import { Translation } from '@src/core/database/entities/base.entity';

export enum RoomProductRelation {
  ROOM_PRODUCT_DAILY_AVAILABILITY = 'roomProductDailyAvailabilities',
  ROOM_PRODUCT_IMAGES = 'roomProductImages',
  ROOM_PRODUCT_EXTRAS = 'roomProductExtras',
  ROOM_PRODUCT_ASSIGNED_UNITS = 'roomProductAssignedUnits',
  ROOM_PRODUCT_RESTRICTIONS = 'roomProductRestrictions',
  ROOM_PRODUCT_AUTOMATE_SETTINGS = 'roomProductAutomateSettings',
  ROOM_PRODUCT_STANDARD_FEATURES = 'roomProductStandardFeatures',
  ROOM_PRODUCT_RETAIL_FEATURES = 'roomProductRetailFeatures',
  ROOM_PRODUCT_RETAIL_FEATURES_RETAIL_FEATURE = 'roomProductRetailFeatures.retailFeature',
  ROOM_PRODUCT_STANDARD_FEATURES_STANDARD_FEATURE = 'roomProductStandardFeatures.standardFeature',
  ROOM_PRODUCT_RATE_PLANS = 'roomProductRatePlans',
  ROOM_PRODUCT_MAPPINGS = 'roomProductMappings',
  ROOM_PRODUCT_EXTRA_OCCUPANCY_RATES = 'roomProductExtraOccupancyRates'
}

export class RoomProductListQueryDto {
  // filter
  ids?: string[];

  status?: RoomProductStatus[];

  name?: string[];

  distributionChannel?: DistributionChannel[];

  type?: RoomProductType[];

  code?: string[];

  hotelId: string;

  roomUnitIds?: string[];

  retailFeatureIds?: string[];

  isGetAllRoomProductRetailFeatures?: boolean;

  // relations
  relations?: RoomProductRelation[];

  // pagination
  limit?: number;

  offset?: number;

  isPresignedUrl?: boolean;

  isGroupByMrfcCluster?: boolean;
}

export type RoomProductItemDto = RoomProduct & {
  roomProductPricingMode?: RoomProductPricingModeDto;
  roomProductRfcs?: RoomProductItemDto[];
};

export class RoomProductAvailabilityListQueryDto extends RoomProductListQueryDto {
  // filter
  startDate: string;

  endDate: string;
}

export class RoomProductQueryDto {
  // filter
  ids?: string[];

  status?: RoomProductStatus[];

  distributionChannel?: DistributionChannel[];

  type?: RoomProductType[];

  code?: string[];

  hotelId: string;

  startDate: string;

  endDate: string;

  // relations
  relations?: RoomProductRelation[];

  // pagination
  limit?: number;

  offset?: number;
  retailFeatureIds?: string[];
}

export class TotalDailyAvailabilityDto {
  date: string;
  totalAvailable: number;
  totalSold: number;
  totalSellLimit: number;
  totalAdjustment: number;
  effectiveAvailability: number;
  roomProductCount: number;
  occupancyRate: string;
}

export class HouseLevelAvailabilityResponseDto {
  roomProducts: RoomProduct[];
  totalDailyAvailability: TotalDailyAvailabilityDto[];
  summary: {
    totalRoomProducts: number;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    hotelId: string;
  };
}

export class AvailabilitySummaryDto {
  totalDays: number;
  totalAvailable: number;
  totalSold: number;
  totalSellLimit: number;
  averageOccupancyRate: string;
  peakAvailabilityDate: string | null;
  lowestAvailabilityDate: string | null;
  dailyBreakdown: TotalDailyAvailabilityDto[];
}

export class CreateRoomProductDto {
  hotelId: string;

  name: string;

  type: RoomProductType;

  productCode?: string;

  additionalData?: Partial<RoomProduct>;
}

export class UpdateRoomProductDto {
  name?: string;

  description?: string;

  hotelId: string;

  status?: RoomProductStatus;

  space?: number;

  numberOfBedrooms?: number;

  capacityDefault?: number;

  maximumAdult?: number;

  maximumKid?: number;

  maximumPet?: number;

  capacityExtra?: number;

  extraBedAdult?: number;

  extraBedKid?: number;

  distributionChannel?: DistributionChannel[];

  basePriceMode?: BasePriceMode;

  rfcAllocationSetting?: RfcAllocationSetting;

  retailFeaturesAdded?: RoomProductRetailFeatureDto[];

  retailFeaturesUpdated?: RoomProductRetailFeatureDto[];

  retailFeaturesRemoved?: RoomProductRetailFeatureDto[];

  translations?: Translation[];

  roomUnitIds: string[];

  isLockedUnit?: boolean;

  // Geo fields (optional - for RFCs where location differs from hotel location)
  latitude?: string;

  longitude?: string;

  address?: string;

  city?: string;
}

export class RoomProductRetailFeatureDto {
  code: string;

  quantity: number;
}

// export class UpdateRoomProductRetailFeaturesDto {
//
//
//   hotelId: string;

//
//
//
//
//   retailFeatures?: RoomProductRetailFeatureDto[];
// }

export class UpdateRoomProductExtrasDto {
  hotelId: string;

  type: RoomProductExtraType;

  serviceId: string;
}

// Room Product Extra Management DTOs (Multi-Extra Operations)
export class RoomProductExtraItemDto {
  extrasId: string;

  type: RoomProductExtraType;
}

export class CreateRoomProductExtrasDto {
  hotelId: string;

  id: string;

  extras: RoomProductExtraItemDto[];
}

export class DeleteRoomProductExtrasDto {
  hotelId: string;

  extraIds: string[];
}

export class UploadRoomProductImageDto {
  hotelCode: string;
}

export class UpdateRoomProductImageDto {
  sequence: number;

  description: string;
}

export class UploadRoomProductImagesFromGalleryDto {
  id: string;
  imageKeys: string[];
}

export class ReorderRoomProductImageDto {
  ids: string[];
}

export class RoomProductPricingModeDto {
  mode: RoomProductBasePriceSettingModeEnum;
  roomProductId: string;
  rate: number;
  linkedRoomProducts: any[];
}

export class RoomProductDetailDto {
  roomProduct: RoomProduct;
  pricingModes: RoomProductPricingModeDto[];
}

export class CreateRoomProductExtraOccupancyRateDto {
  extraPeople: number;

  extraRate: number;
}

export class CreateRoomProductExtraOccupancyRatesDto {
  hotelId: string;

  extraOccupancyRates: CreateRoomProductExtraOccupancyRateDto[];
}
export class CreateRoomProductBasePriceSettingDto {
  mode: RoomProductBasePriceSettingModeEnum;

  fixedPrice?: number;
}
export class CreateRoomProductRoomMappingDto {
  relatedRoomProductId: string;
}

export enum SHOW_MODE_ENUM {
  ALL = 'ALL',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED'
}

export class GetRatePlanRfcAssignmentListDto {
  hotelId: string;
  ratePlanIdList: string[];
  showMode: SHOW_MODE_ENUM;
  type?: RoomProductType;
  sort?: string[];

  pageIndex?: number;
  pageSize?: number;
}

export class UnassignAllRoomProductFromRatePlanDto {
  hotelId: string;
  ratePlanId: string;
  allowUnassignedAllDerived?: boolean;
  roomProductIds?: string[];
}

export class AssignRoomProductToRatePlanDto extends UnassignAllRoomProductFromRatePlanDto {
  rfcIdList: string[];
}

export class UnassignRoomProductFromRatePlanDto extends AssignRoomProductToRatePlanDto {}

// Clone Room Product DTOs
export class CloneRoomProductInput {
  roomProductId: string;

  hotelId: string;

  roomProductType?: RoomProductType;
}

export class ProductCartDetailsList {
  roomProductId: string;

  salesPlanId: string;
}

export class CppProductCartListFilterDto {
  hotelId: string;

  productCartDetailsList: ProductCartDetailsList[];
}

export class RoomProductFilterDto extends Filter {
  hotelCode?: string;

  hotelId?: string;

  fromTime?: number;

  toTime?: number;

  text?: string;

  idList?: string[];

  excludeIdList?: string[];

  codeList?: string[];

  typeList?: RoomProductType[];

  statusList?: RoomProductStatus[];

  roomProductAllocationSettingList?: RfcAllocationSetting[];

  travelTagList?: string[];

  occasionList?: string[];

  languageCodeList?: string[];

  distributionChannelList?: DistributionChannel[];

  capacity?: number;

  capacityIncludesExtraBed?: boolean;
}

export class DeleteRoomProductDto {
  hotelId: string;
  ids: string[];
}

export class BulkUpsertRoomProductRetailFeatureItemDto {
  hotelRetailFeatureId: string;

  code: string;

  quantity: number;
}

export class BulkUpsertRoomProductRetailFeatureDto {
  productId: string;

  retailFeatures: BulkUpsertRoomProductRetailFeatureItemDto[];
}

export class BulkUpsertRoomProductRetailFeaturesDto {
  hotelId: string;
  items: BulkUpsertRoomProductRetailFeatureDto[];
}
