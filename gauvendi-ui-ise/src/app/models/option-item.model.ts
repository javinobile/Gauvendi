import {
  BookingFlow,
  HotelStandardFeature,
  StayOptionSuggestion,
  Rfc,
  RfcRatePlan,
  RatePlan
} from '@app/core/graphql/generated/graphql';
import { Observable } from 'rxjs';

export interface IOptionItem {
  imgUrls: string[];
  title: string;
  adults: number;
  children: number;
  roomKey: number;
  extraBeds: number;
  bedRooms: number;
  pets?: number;
  roomSpace: number;
  features: IFeature[];
  matchFeatures: IFeature[];
  notMatchFeatures: IFeature[];
  standardFeatures: HotelStandardFeature[];
  tag: BookingFlow;
  isLocked?: boolean;
  rfcRatePlan: RfcRatePlan;
  rfcRatePlanList: RfcRatePlan[];
  matchPercent?: number;
  // salePlans: [
  //   {
  //     title: string,
  //   }
  // ]
  metadata: Rfc;
  baseOption?: StayOptionSuggestion;
  isSpaceTypeSearchMatched?: boolean;
}

export interface ICombinationOptionItem {
  title: string;
  adults: number;
  children: number;
  roomKey: number;
  extraBeds: number;
  bedRooms: number;
  tag: BookingFlow;
  metadata: StayOptionSuggestion;
  isLocked?: boolean;
  matchPercent?: number;
  matched?: boolean;
  pets?: number;
  items: IOptionItem[];
  isSpaceTypeSearchMatched?: boolean;
}

export interface IBundleItem {
  ratePlan: RatePlan;
  items: ICombinationOptionItem[];
}

export interface IFeature {
  name: string;
  recommendation: boolean;
  matched: boolean;
  metadata: any;
}

export enum EPriceView {
  PerNight = 1,
  PerStay = 2
}

export enum EFilterType {
  SINGLE = 1,
  COMBINATION = 2,
  MATCH = 3
}

export enum PricingDisplayModeEnum {
  TOTAL = 'TOTAL', // for per stay, total price
  PER_NIGHT = 'PER_NIGHT', // for per night, price per night
  DEFAULT = 'DEFAULT'
}
