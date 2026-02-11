import { ELoadingStatus } from '@models/loading-status.model';
import { Action, createReducer, on } from '@ngrx/store';
import {
  loadAvailableAmenity,
  loadAvailablePaymentMethodList,
  loadCombinedAccommodationList,
  loadDirectStayOption,
  loadedAvailableAmenitySuccess,
  loadedAvailablePaymentMethodListSuccess,
  loadedCombinedAccommodationList,
  loadedDirectStayOptionSuccessfully,
  loadedPaymentOptionsBySalesPlanSuccessfully,
  loadedRatePlanListSuccess,
  loadedStayOptionRecommendationListV2Success,
  loadPaymentOptionsBySalesPlan,
  loadRatePlanList,
  loadStayOptionRecommendationListV2,
  resetDirectStayOption
} from '@store/suggestion/suggestion.actions';
import { SuggestionState } from '@store/suggestion/suggestion.state';

export const initialState: SuggestionState = {
  stayOptionSuggestionList: { status: ELoadingStatus.idle, data: null },
  directStayOption: { status: ELoadingStatus.idle, data: null },
  ratePlanList: { status: ELoadingStatus.idle, data: null },
  paymentOptions: { status: ELoadingStatus.idle, data: null },
  availableAmenity: { status: ELoadingStatus.idle, data: null },
  // moreStayOptionSuggestionList: {status: ELoadingStatus.idle, data: null},
  lowestStayOption: { status: ELoadingStatus.idle, data: null },
  lowestDirectStayOption: { status: ELoadingStatus.idle, data: null },
  availablePaymentMethodList: { status: ELoadingStatus.idle, data: null },
  combinedStayOptionList: { status: ELoadingStatus.idle, data: null }
};

const suggestionReducer = createReducer(
  initialState,
  on(loadDirectStayOption, (state) => ({
    ...state,
    directStayOption: {
      ...state.directStayOption,
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(loadedDirectStayOptionSuccessfully, (state, { data }) => {
    return {
      ...state,
      directStayOption: {
        ...state.directStayOption,
        error: null,
        status: ELoadingStatus.loaded,
        data: data ? data[0] : null
      }
    };
  }),
  on(resetDirectStayOption, (state) => ({
    ...state,
    directStayOption: {
      ...state.directStayOption,
      error: null,
      status: ELoadingStatus.idle,
      data: null
    }
  })),
  on(loadRatePlanList, (state) => ({
    ...state,
    ratePlanList: {
      ...state.ratePlanList,
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(loadedRatePlanListSuccess, (state, { result }) => ({
    ...state,
    ratePlanList: {
      ...state.ratePlanList,
      error: null,
      status: ELoadingStatus.loaded,
      data: result
    }
  })),
  on(loadPaymentOptionsBySalesPlan, (state) => ({
    ...state,
    paymentOptions: {
      ...state.paymentOptions,
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(
    loadedPaymentOptionsBySalesPlanSuccessfully,
    (state, { paymentOptions }) => ({
      ...state,
      paymentOptions: {
        ...state.paymentOptions,
        error: null,
        status: ELoadingStatus.loaded,
        data: paymentOptions
      }
    })
  ),
  on(loadAvailableAmenity, (state) => ({
    ...state,
    availableAmenity: {
      ...state.availableAmenity,
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(loadedAvailableAmenitySuccess, (state, { result }) => ({
    ...state,
    availableAmenity: {
      ...state.availableAmenity,
      error: null,
      status: ELoadingStatus.loaded,
      data: result
    }
  })),
  on(loadAvailablePaymentMethodList, (state) => ({
    ...state,
    availablePaymentMethodList: {
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(
    loadedAvailablePaymentMethodListSuccess,
    (state, { availablePaymentMethodList }) => {
      return {
        ...state,
        availablePaymentMethodList: {
          error: null,
          status: ELoadingStatus.loaded,
          data: availablePaymentMethodList
        }
      };
    }
  ),
  on(loadStayOptionRecommendationListV2, (state, { status }) => {
    return {
      ...state,
      stayOptionSuggestionList: {
        ...state.stayOptionSuggestionList,
        status: status || ELoadingStatus.loading
      }
    };
  }),
  on(
    loadedStayOptionRecommendationListV2Success,
    (state, { stayOptionSuggestionList, isMatchFlow }) => {
      return {
        ...state,
        stayOptionSuggestionList: {
          ...state.stayOptionSuggestionList,
          error: null,
          status: ELoadingStatus.loaded,
          data: stayOptionSuggestionList
        }
      };
    }
  ),
  on(loadCombinedAccommodationList, (state) => {
    return {
      ...state,
      combinedStayOptionList: {
        ...state.combinedStayOptionList,
        status: ELoadingStatus.loading
      }
    };
  }),
  on(
    loadedCombinedAccommodationList,
    (state, { combinedAccommodationList }) => {
      return {
        ...state,
        combinedStayOptionList: {
          error: null,
          status: ELoadingStatus.loaded,
          data: combinedAccommodationList
        }
      };
    }
  )
);

export function SuggestionReducer(state: SuggestionState, action: Action) {
  return suggestionReducer(state, action);
}
