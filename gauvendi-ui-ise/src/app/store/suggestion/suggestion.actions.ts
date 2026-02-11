import {
  AvailablePaymentMethod,
  HotelAmenity,
  HotelPaymentMode,
  QueryAvailableAmenityArgs,
  QueryAvailablePaymentMethodListArgs,
  QueryDedicatedStayOptionListArgs,
  QueryPaymentOptionsBySalesPlanArgs,
  QueryRatePlanListArgs,
  QueryStayOptionRecommendationListV2Args,
  RatePlan,
  StayOptionSuggestion
} from '@core/graphql/generated/graphql';
import { createAction, props } from '@ngrx/store';
import { ELoadingStatus } from '@models/loading-status.model';

export const loadStayOptionRecommendationListV2 = createAction(
  '@stay options/ load stay option recommendation list v2',
  props<{
    variables: QueryStayOptionRecommendationListV2Args;
    isMatchFlow: boolean;
    status?: ELoadingStatus;
  }>()
);

export const loadedStayOptionRecommendationListV2Success = createAction(
  '@stay options/ loaded stay option recommendation list v2 success',
  props<{
    stayOptionSuggestionList: StayOptionSuggestion[];
    isMatchFlow: boolean;
  }>()
);

export const loadCombinedAccommodationList = createAction(
  '@stay options/ load combined accommodation list',
  props<{
    variables: QueryStayOptionRecommendationListV2Args;
  }>()
);

export const loadedCombinedAccommodationList = createAction(
  '@stay options/ loaded combined accommodation list',
  props<{
    combinedAccommodationList: StayOptionSuggestion[];
  }>()
);

export const loadDirectStayOption = createAction(
  '@stay options/ load direct stay option',
  props<{ variables: QueryDedicatedStayOptionListArgs }>()
);

export const loadedDirectStayOptionSuccessfully = createAction(
  '@stay options/ load direct stay option successfully',
  props<{ data: StayOptionSuggestion[] }>()
);

export const resetDirectStayOption = createAction(
  '@stay options/ reset direct stay option'
);

export const loadRatePlanList = createAction(
  '@stay options/ load rate plan list',
  props<{ variables: QueryRatePlanListArgs }>()
);

export const loadedRatePlanListSuccess = createAction(
  '@stay options/ loaded rate plan list success',
  props<{ result: RatePlan[] }>()
);

export const loadPaymentOptionsBySalesPlan = createAction(
  '@stay options/ load payment options by sales plan',
  props<{ variables: QueryPaymentOptionsBySalesPlanArgs }>()
);

export const loadedPaymentOptionsBySalesPlanSuccessfully = createAction(
  '@stay options/ load payment options by sales plan successfully',
  props<{ paymentOptions: HotelPaymentMode[] }>()
);

export const loadAvailableAmenity = createAction(
  '@stay options/ load amenity options',
  props<{ variables: QueryAvailableAmenityArgs }>()
);

export const loadedAvailableAmenitySuccess = createAction(
  '@stay options/ loaded amenity options success',
  props<{ result: HotelAmenity[] }>()
);

export const loadAvailablePaymentMethodList = createAction(
  '@stay options/ load AvailablePaymentMethodList',
  props<{ variables: QueryAvailablePaymentMethodListArgs }>()
);

export const loadedAvailablePaymentMethodListSuccess = createAction(
  '@stay options/ loaded AvailablePaymentMethodList success',
  props<{ availablePaymentMethodList: AvailablePaymentMethod[] }>()
);
