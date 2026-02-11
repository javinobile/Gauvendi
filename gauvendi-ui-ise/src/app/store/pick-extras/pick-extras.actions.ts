import {
  BookingPricing,
  HotelAmenity,
  MutationCalculateBookingPricingArgs,
  QueryAvailableAmenityArgs,
  QueryRoomProductIncludedHotelExtraListArgs,
  QuerySearchMatchingRfcV2Args,
  QuerySurchargeAmenityListArgs,
  Rfc
} from '@core/graphql/generated/graphql';
import { createAction, props } from '@ngrx/store';

export const loadHotelAmenityIncluded = createAction(
  '@pick-extras/ load hotel amenity included',
  props<{ variables: QueryRoomProductIncludedHotelExtraListArgs }>()
);

export const loadedHotelAmenityIncludedSuccessfully = createAction(
  '@pick-extras/ loaded hotel amenity included successfully',
  props<{ amenity: HotelAmenity[] }>()
);

export const loadSearchMatchingRfc = createAction(
  '@pick-extras/ load search matching rfc',
  props<{ variables: QuerySearchMatchingRfcV2Args[] }>()
);

export const loadedSearchMatchingRfc = createAction(
  '@pick-extras/ loaded search matching rfc',
  props<{ rfc: Rfc[] }>()
);

export const loadAvailableAmenityByDistributionChannel = createAction(
  '@Amenity/ load available amenity by distribution channel',
  props<{ variables: QueryAvailableAmenityArgs }>()
);

export const loadedAvailableAmenityByDistributionChannelSuccess = createAction(
  '@Amenity/ loaded available amenity by distribution channel success',
  props<{ result: HotelAmenity[] }>()
);

export const loadCalculateBookingPricing = createAction(
  '@pick-extras/ load calculate booking pricing',
  props<{ variables: MutationCalculateBookingPricingArgs }>()
);

export const loadedCalculateBookingPricingSuccessfully = createAction(
  '@pick-extras/ loaded calculate booking pricing successfully',
  props<{ bookingPricing: BookingPricing }>()
);

export const loadSurchargeAmenityList = createAction(
  '@pick-extras/ load surcharge amenity list',
  props<{ variables: QuerySurchargeAmenityListArgs }>()
);

export const loadedSurchargeAmenityListSuccessfully = createAction(
  '@pick-extras/ loaded surcharge amenity list successfully',
  props<{ surchargeAmenityList: HotelAmenity[] }>()
);

export const loadSurchargeAmenityListFailed = createAction(
  '@pick-extras/ load surcharge amenity list failed',
  props<{ error: string }>()
);
