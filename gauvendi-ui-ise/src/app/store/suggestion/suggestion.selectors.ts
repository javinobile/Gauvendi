import { AmenityCodeEnum } from '@app/constants/extras.const';
import { AmenityTypeEnum, HotelAmenity } from '@core/graphql/generated/graphql';
import { ELoadingStatus } from '@models/loading-status.model';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  SUGGESTION_FEATURE_KEY,
  SuggestionState
} from '@store/suggestion/suggestion.state';

export const selectSuggestionState = createFeatureSelector<SuggestionState>(
  SUGGESTION_FEATURE_KEY
);

export const selectorStayOptionSuggestionList = createSelector(
  selectSuggestionState,
  (res: SuggestionState) =>
    [...(res?.stayOptionSuggestionList?.data || [])]
      ?.map((item) => {
        const newItem = {
          ...item,
          availableRfcRatePlanList:
            item?.availableRfcRatePlanList?.filter(
              (itemBreakdown) =>
                !itemBreakdown?.ratePlan?.code?.startsWith('BUNDLE')
            ) || item?.availableRfcRatePlanList,
          unavailableRfcRatePlanList:
            item?.unavailableRfcRatePlanList?.filter(
              (itemBreakdown) =>
                !itemBreakdown?.ratePlan?.code?.startsWith('BUNDLE')
            ) || item?.unavailableRfcRatePlanList
        };
        return newItem;
      })
      ?.filter(
        (item) =>
          item?.availableRfcRatePlanList?.length > 0 ||
          item?.unavailableRfcRatePlanList?.length > 0
      )
);

export const selectorStayOptionBundleList = createSelector(
  selectSuggestionState,
  (res: SuggestionState) =>
    [...(res?.stayOptionSuggestionList?.data || [])]
      ?.filter((item) =>
        item?.availableRfcRatePlanList?.some((itemBreakdown) =>
          itemBreakdown?.ratePlan?.code?.startsWith('BUNDLE')
        )
      )
      ?.map((item) => {
        const newList = item?.availableRfcRatePlanList?.filter(
          (itemBreakdown) => itemBreakdown?.ratePlan?.code?.startsWith('BUNDLE')
        );
        return {
          ...item,
          availableRfcRatePlanList: newList
        };
      })
);

export const selectorCombinedAccommodationList = createSelector(
  selectSuggestionState,
  (res: SuggestionState) =>
    [...(res?.combinedStayOptionList?.data || [])]?.filter(
      (item) => item?.availableRfcRatePlanList?.length > 0
    )
);
export const selectorCombinedAccommodationListLoading = createSelector(
  selectSuggestionState,
  (res: SuggestionState) =>
    res.combinedStayOptionList?.status === ELoadingStatus.loading
);

export const selectorStayOptionSuggestionListLoaded = createSelector(
  selectSuggestionState,
  (res: SuggestionState) =>
    res?.stayOptionSuggestionList.status === ELoadingStatus.loaded
);

export const selectorStayOptionSuggestionListStatus = createSelector(
  selectSuggestionState,
  (res: SuggestionState) =>
    res?.stayOptionSuggestionList.status as ELoadingStatus
);

// export const selectorMoreStayOptionSuggestionList = createSelector(
//   selectSuggestionState,
//   (res: SuggestionState) => res?.moreStayOptionSuggestionList?.data
// );

export const selectorDirectStayOption = createSelector(
  selectSuggestionState,
  (res: SuggestionState) => res?.directStayOption?.data
);

export const selectorRatePlanList = createSelector(
  selectSuggestionState,
  (res: SuggestionState) => res?.ratePlanList?.data
);

export const selectorPaymentOptionList = createSelector(
  selectSuggestionState,
  (res: SuggestionState) => res?.paymentOptions?.data
);

export const selectorHotelAvailableAmenities = createSelector(
  selectSuggestionState,
  (res: SuggestionState) => res?.availableAmenity?.data as HotelAmenity[]
);

export const selectorHotelAvailableAmenitiesStatus = createSelector(
  selectSuggestionState,
  (res: SuggestionState) => res?.availableAmenity?.status
);

export const selectorAvailableMealPlan = createSelector(
  selectSuggestionState,
  (res: SuggestionState) =>
    res?.availableAmenity?.data?.filter(
      (x) => x.amenityType === AmenityTypeEnum.MealPlan
    )
);

export const selectorAvailableAmenity = createSelector(
  selectSuggestionState,
  (res: SuggestionState) =>
    res?.availableAmenity?.data?.filter(
      (x) =>
        x.amenityType === AmenityTypeEnum.Amenity ||
        x.code === AmenityCodeEnum.PET_SURCHARGE
    )
);

export const selectorAvailableAmenityStatus = createSelector(
  selectSuggestionState,
  (res: SuggestionState) => res?.availableAmenity?.status
);

export const selectorAvailableServices = createSelector(
  selectSuggestionState,
  (res: SuggestionState) =>
    res?.availableAmenity?.data?.filter(
      (x) => x.amenityType === AmenityTypeEnum.Service
    )
);

export const selectorLowestPriceStayOption = createSelector(
  selectSuggestionState,
  (res: SuggestionState) => res?.lowestStayOption?.data
);

export const selectorLowestPriceDirectStayOption = createSelector(
  selectSuggestionState,
  (res: SuggestionState) => res?.lowestDirectStayOption?.data
);

export const selectorAvailablePaymentMethodList = createSelector(
  selectSuggestionState,
  (res: SuggestionState) => res?.availablePaymentMethodList?.data
);
