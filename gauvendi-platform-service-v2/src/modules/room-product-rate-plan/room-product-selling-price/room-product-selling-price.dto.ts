import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import { RatePlanTypeEnum, RoomProductType } from 'src/core/enums/common';
import { RatePlanPricingMappingDto } from 'src/modules/pms/pms.dto';

export class SellingPriceQuery {
  hotelId: string;

  ratePlanId: string;

  roomProductIds: string[];

  fromDate: string;

  toDate: string;
}
export class GetSellingPriceQueryDto {
  hotelId: string;

  ratePlanId: string;

  fromDate: string;

  toDate: string;

  occupancy?: number = 1;
}

export class RefreshSellingPriceDto {
  hotelId: string;

  //
  // ratePlanId: string;

  fromDate: string;

  toDate: string;

  occupancy?: number = 1;
}

export class BulkRefreshSellingPriceDto {
  hotelId: string;

  fromDate?: string;

  toDate?: string;

  roomProductId: string;

  ratePlanId: string;
}

export class SellingPriceStatsResponse {
  totalRecords: number;

  staleRecords: number;

  recentRecords: number;

  oldestRecord: Date | null;

  newestRecord: Date | null;
}

export interface ComputedPriceResult {
  basePrice: number;
  featureAdjustments: number;
  ratePlanAdjustments: number;
  netPrice: number;
}

export interface BulkRefreshResult {
  processedCount: number;
  totalCombinations: number;
  processingTimeSeconds: number;
}

export class GetRoomProductPricingModeDto {
  hotelId: string;
  roomProductIds: string[];
}

export class CalculateSellingPriceDto {
  hotelId: string;

  roomProductId: string;
  roomProductType: RoomProductType;
  ratePlanId: string;

  fromDate: string;

  toDate: string;
}

export interface DailyFeatureBasePriceDto {
  date: string;
  featureBasedRate: number;
}

export enum PricingDataSourceEnum {
  INTERNAL = 'internal',
  PMS = 'pms',
  POSITIONING = 'positioning',
  LINK = 'link',
  DERIVED = 'derived',
  ATTRIBUTE = 'attribute',
  FIXED = 'fixed',
  REVERSED = 'reversed'
}

export class CalculateSellingPriceWithSourceDto extends CalculateSellingPriceDto {
  pricingDataSource?: PricingDataSourceEnum = PricingDataSourceEnum.INTERNAL;

  pmsBasePrices?: RatePlanPricingMappingDto[];

  positioningBasePrices?: Partial<RoomProductDailySellingPrice>[];

  linkBasePrices?: Partial<RoomProductDailySellingPrice>[];

  derivedBasePrices?: Partial<RoomProductDailySellingPrice>[];

  attributeBasePrices?: Partial<RoomProductDailySellingPrice>[];

  fixedBasePrices?: Partial<RoomProductDailySellingPrice>[];

  reversedBasePrices?: Partial<RoomProductDailySellingPrice>[];
}

export interface CalculateSellingPriceResponseDto {
  date: string;
  roomProductId: string;
  ratePlanId: string;
  hotelId: string;
  adjustmentRate?: number;
  featureBasedRate?: number;
  extraServiceRate?: number;
  accommodationRate?: number;
  netPrice?: number;
  grossPrice?: number;
  totalTaxAmount?: number;
  accommodationTaxAmount?: number;
  extrasTaxAmount?: number;
  accommodationTaxRate?: number;
}

export class RoomProductPricingRequestDto {
  propertyCode: string;

  fromDate: string;

  toDate: string;

  totalAdult: number;

  totalPet: number;

  childAgeList?: number[];

  roomProductCodes?: string[];
  promoCodeList?: string[];

  ratePlanTypes?: RatePlanTypeEnum[];
}

export class RoomProductRequestDto {
  id: string;

  code: string;

  name: string;
}
