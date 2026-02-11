import { RfcAllocationSetting } from '@src/core/enums/common';

export interface DirectBookingHistoryItem {
  productCode: string;
  sameBookingPeriod: number;
  totalHistoryBookingTime: number;
  productPopularity: number;
  featurePopularityList: number[];
}

export interface DirectCapacityItem {
  productCode: string;
  type: string;
  isRestricted: boolean;
  capacityScore: number;
  spaceTypeList: string[];
  mergedIndices?: any[];
}

export interface DirectRoomProductAvailable {
  code: string;
  type: string;
  description: string;
  availableRoomIds: string[];
  availableRoomDetails: {
    roomUnitId: string;
    roomNumber: string;
    roomFloor: string;
    space: number;
    building: string;
  }[];
  availableToSell: number;
  isRestricted: boolean;
  allocationType: RfcAllocationSetting;
  spaceTypeList: string[];
  basePrice?: number;
  ratePlanCode?: string;
  featureList: string[];
  numberOfBedrooms: number;
  capacity: {
    adults: number;
    children: number;
    pets: number;
    maximum: number;
  };
  extraCapacity: {
    adults: number;
    children: number;
    pets: number;
    maximum: number;
  };
}

export interface CodeRoomAvailable {
  [code: string]: {
    availableRoomIds: string[];
    availableToSell: number;
    isRestricted: boolean;
    allocationType: RfcAllocationSetting;
    basePrice: number;
    building: string;
  };
}

export interface DirectScoreRow {
  popularScore: number;
  historyScore: number;
  periodScore: number;
  capacityScore: number;
  mergedIndices: any[];
  productPopularity: number;
  sameBookingPeriod: number;
  totalHistoryBookingTime: number;
}

export interface DirectCombinationResult {
  combination: string[];
  value: number;
  type?: string;
  isRoomIdsAvailable?: boolean;
  isAvailableToSell?: boolean;
  isRoomAvailability?: boolean;
  isRestricted?: boolean;
  isMatched?: boolean;
  building?: Set<string>;
}

export interface DirectBestCombinations {
  restricted: Array<[string[], number]>;
  notRestricted: Array<[string[], number]>;
}

export interface DirectPrecomputedData {
  roomProductAvailabilityMap: Map<string, DirectRoomProductAvailable>;
}

export interface DirectOptimizationParams {
  topMatchDfs: any[]; // array per slot: each element is array of candidate objects
  listExcludeCombination: string[][];
  listExcludeBasePrice: number[];
  roomProductAvailabilityMap: Map<string, DirectRoomProductAvailable>;
  codeRoomAvailable: CodeRoomAvailable;
  sortedCodes: string[][];
  scoreType: DirectScoreType;
  defaultMaxCount: number;
  maxCountsConstraint: Record<string, number>;
  maxRestricted?: number;
}

export type DirectPipeline = 'mostPopular' | 'direct' | 'ourTip' | 'compareMatching';
export type DirectScoreType =
  | 'mostPopularScore'
  | 'directScore'
  | 'ourTipScore'
  | 'compareMatchingScore';

export class DirectProcessExecuteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProcessExecuteError';
  }
}

export class ValueEmptyException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueEmptyException';
  }
}

export interface DirectFeatureItem {
  code: string;
  name: string;
  popularity: number;
  priority?: number;
}

export interface DirectEventItem {
  featureList: string[];
  [key: string]: any;
}

export interface DirectRoomProductItem {
  code: string;
  featureList: string[];
  basePrice?: number;
  [key: string]: any;
}

export interface DirectOurTipPopularity {
  productCode: string;
  'highPopularity5*': number;
  'highPopularity4*': number;
  productPopularity: number;
}

export interface DirectOurTipRow extends DirectScoreRow {
  'highPopularity5*': number;
  'highPopularity4*': number;
  ourTipScore: number;
}
