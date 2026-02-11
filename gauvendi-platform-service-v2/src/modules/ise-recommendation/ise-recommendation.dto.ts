import { RatePlan } from '@entities/pricing-entities/rate-plan.entity';
import { BookingFlow, IsePricingDisplayModeEnum, RoundingModeEnum } from '@enums/common';

export class RoomRequestDto {
  adult: number;

  childrenAgeList: number[];

  pets: number;
}

export class PriorityCategoryCodeDto {
  codeList: string[];

  sequence: number;
}

export class StayOptionsDto {
  hotelCode: string;

  arrival: string;

  departure: string;

  bookingFlow: BookingFlow = BookingFlow.DIRECT;

  priorityCategoryCodeList?: PriorityCategoryCodeDto[] = [];

  translateTo?: string;

  travelTagCodeList?: string[] = [];

  occasionCodeList?: string[] = [];

  promoCodeList?: string[] = [];

  roomRequestList: RoomRequestDto[];

  spaceTypeRequestList?: string[] = [];

  splitToDoubleRooms?: boolean = false;
}

export class StayOptionDetailsDto {
  hotelCode: string;

  dedicatedProductCode: string;

  arrival: string;

  departure: string;

  roomRequest: RoomRequestDto;
  priorityCategoryCodeList?: PriorityCategoryCodeDto[] = [];
  translateTo?: string;

  promoCodeList?: string[] = [];
}

export class RoomProductStayOptionResponseDto {
  code: string;
  name: string;
  description: string;
  matchingPercentage: number;
  isSpaceTypeSearchMatched: boolean;
  rfcImageList: {
    imageUrl: string;
  };
  mostPopularFeatureList: any;
  retailFeatureList: RetailFeatureStayOptionResponseDto[];
  additionalFeatureList: any;
  layoutFeatureList: any;
  rfcRatePlanList: RfcRatePlanStayOptionResponseDto[];
  capacityDefault: number;
  capacityExtra: number;
  allocatedExtraBedAdultCount: number;
  allocatedExtraBedChildCount: number;
  allocatedAdultCount: number;
  allocatedChildCount: number;
  allocatedPetCount: number;
  numberOfBedrooms: number;
  space: number;
  travelTagList: any;
  occasionList: any;
  standardFeatureList: StandardFeatureStayOptionResponseDto[];
}

export interface RfcImageStayOptionResponseDto {
  imageUrl: string;
}

export interface RetailFeatureStayOptionResponseDto {
  name: string;
  code: string;
  matched: boolean;
  quantity: number;
  description: string;
  hotelRetailCategory: HotelRetailCategoryStayOptionResponseDto;
  measurementUnit?: string;
}

export interface HotelRetailCategoryStayOptionResponseDto {
  code: string;
  name: string;
}

export interface RfcRatePlanStayOptionResponseDto {
  name: any;
  code: string;
  averageDailyRate: number;
  totalSellingRate: number;
  restrictionValidationList: any[];
  ratePlan: RatePlanStayOptionResponseDto;
}

export interface RatePlanStayOptionResponseDto {
  code: string;
  name: string;
  description: string;
  IsPromoted: boolean;
  hotelPaymentTerm?: {
    name: string;
    code: string;
    description: string;
  } | null;
  hotelCancellationPolicy?: {
    name: string;
    description: string;
  } | null;
  includedHotelExtrasList: HotelExtraListStayOptionResponseDto[];
}

export interface HotelExtraListStayOptionResponseDto {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface StandardFeatureStayOptionResponseDto {
  name: string;
  code: string;
  description: string;
  iconImageUrl: string;
}

export interface RoomProductRatePlanListDto {
  code: string;
  name: string;
  averageDailyRate: number;
  totalSellingRate: number;
  restrictionValidationList: any[];
  ratePlan: Partial<RatePlanStayOptionResponseDto>;
}

export interface AvailableRoomProductRatePlanListDto {
  id?: string;
  roomProductId?: string;
  roomProductCode?: string;
  code: string;
  name: string;
  averageDailyRate: number;
  totalGrossAmount: number;
  totalBaseAmount: number;
  totalSellingRate: number;
  totalBaseAmountBeforeAdjustment: number;
  totalGrossAmountBeforeAdjustment: number;
  restrictionValidationList: any[];
  adjustmentPercentage: number;
  shouldShowStrikeThrough: boolean;
  ratePlan: Partial<RatePlanStayOptionResponseDto>;
}

export interface RecommendationBookingHistoryDto {
  roomProductId: string | null;
  sameBookingPeriod: number;
  totalBookingHistoryTime: number;
}

export interface RecommendationFeatureHistoryDto {
  code: string;
  count: number;
}

export interface IseRecommendationResponseDto {
  availableRfcList: RoomProductStayOptionResponseDto[];
  availableRfcRatePlanList: AvailableRoomProductRatePlanListDto[];
  label: BookingFlow;
}

export class CalculateRoomProductRatePlanPricingDto {
  hotelId: string;

  roomProductRatePlanIds: string[];

  fromDate: string;

  toDate: string;

  totalAdult: number;

  childAgeList: number[];

  totalPet: number;

  hotelConfigRoundingMode: {
    roundingMode: RoundingModeEnum;
    decimalPlaces: number;
  };

  isIsePricingDisplay: IsePricingDisplayModeEnum;
}

export enum DateBookingStatus {
  BOOKABLE = 'BOOKABLE', // Available and sellable
  SOLD_OUT = 'SOLD_OUT', // No availability
  NOT_SELLABLE = 'NOT_SELLABLE', // Sellability disabled
  MIN_LOS_VIOLATION = 'MIN_LOS_VIOLATION', // Minimum length of stay not met
  RESTRICTED = 'RESTRICTED' // Has active restrictions (CTA/CTD/etc)
}

export class LowestPriceResponseDto {
  price: number | null;
  ratePlanId: string;
  roomProductId: string;
  date: string;
  netPrice: number | null;
  grossPrice: number | null;
  adjustmentRate: number | null;

  // Booking status and availability info
  status?: DateBookingStatus;
  availableRooms?: number;

  // Optional restriction details for frontend display
  restrictions?: RestrictionDetails;

  // Next date when booking is allowed (when current date is restricted)
  nextBookableDate?: string;

  normalized?: any;
  roomProductRatePlanSellabilities?: {
    ratePlanId: string;
    roomProductId: string;
    isSellable: boolean;
  }[];
}

// Detailed restriction information
export interface RestrictionDetails {
  minLength?: number;
  maxLength?: number;
  minAdvance?: number;
  maxAdvance?: number;
  minLosThrough?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  closedToStay?: boolean;
}

// Result from comprehensive restriction analysis
export interface RestrictionAnalysisResult {
  isBookable: boolean;
  status: DateBookingStatus;
  restrictions?: RestrictionDetails;
  normalized?: any;
  ratePlanSellableIds?: string[];
  nextBookableDate?: string;
  // Source tracking for debugging
  appliedRestrictions?: {
    houseLevel?: string[]; // restriction IDs
    roomProductLevel?: string[];
    ratePlanLevel?: string[];
  };
}

export interface DailySellability {
  date: string; // YYYY-MM-DD
  roomProductRatePlanSellabilities?: {
    roomProductId: string;
    ratePlanId: string;
    isSellable: boolean;
  }[];
}

export interface SellabilityCalendarZip {
  dict: {
    roomProducts: string[];
    ratePlans: string[];
  };

  /**
   * Each entry = 1 (roomProduct, ratePlan)
   * timeline is RLE by date
   */
  series: Array<{
    rp: number; // roomProduct index
    plan: number; // ratePlan index
    timeline: Array<
      [
        fromDay: number, // day offset
        toDay: number, // day offset
        isSellable: 0 | 1
      ]
    >;
  }>;

  baseDate: string; // YYYY-MM-DD
}
