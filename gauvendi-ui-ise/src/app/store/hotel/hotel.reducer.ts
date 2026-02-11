import {ELoadingStatus} from "@models/loading-status.model";
import {HotelState} from "@store/hotel/hotel.state";
import {Action, createReducer, on} from "@ngrx/store";
import {
  loadedHotelRetailCategoryListSuccess,
  loadedHotelRetailFeatureListSuccess,
  loadedHotelSuccessfully,
  loadedHotelSuggestedFeatureListSuccess,
  loadedLocation,
  loadedNearestAvailableSuccess,
  loadedPropertyBrandingListSuccessfully,
  loadedPropertyMainFontSuccessfully,
  loadedWidgetEventFeatureRecommendationListSuccessfully,
  loadHotelRetailCategoryList,
  loadHotelRetailFeatureList,
  loadHotelSuggestedFeatureList,
  loadPropertyBrandingList,
  loadPropertyMainFont,
  loadWidgetEventFeatureRecommendationList,
} from '@store/hotel/hotel.actions';


export const initialState: HotelState = {
  hotelSelected: {status: ELoadingStatus.idle, data: null},
  nearestAvailable: {status: ELoadingStatus.idle, data: null},
  location: {status: ELoadingStatus.idle, data: null},
  hotelRetailCategory: {status: ELoadingStatus.idle, data: null},
  hotelRetailFeature: {status: ELoadingStatus.idle, data: null},
  hotelSuggestedFeature: {status: ELoadingStatus.idle, data: null},
  propertyBranding: {status: ELoadingStatus.idle, data: null},
  eventFeatureRecommendationList: {status: ELoadingStatus.idle, data: null},
  propertyMainFont: {status: ELoadingStatus.idle, data: null},
};

const hotelReducer = createReducer(
  initialState,
  on(loadedHotelSuccessfully, (state, {hotel}) => ({
    ...state,
    hotelSelected: {
      ...state.hotelSelected,
      error: null,
      status: ELoadingStatus.loaded,
      data: hotel,
    },
  })),
  on(loadedNearestAvailableSuccess, (state, {result}) => ({
    ...state,
    nearestAvailable: {
      ...state.nearestAvailable,
      error: null,
      status: ELoadingStatus.loaded,
      data: result
    }
  })),
  on(loadedLocation, (state, location) => ({
    ...state,
    location: {
      ...state.location,
      error: null,
      status: ELoadingStatus.loaded,
      data: location
    }
  })),
  on(loadHotelRetailCategoryList, (state) => ({
    ...state,
    hotelRetailCategory: {
      data: null,
      error: null,
      status: ELoadingStatus.loading,
    },
  })),
  on(loadedHotelRetailCategoryListSuccess, (state, {hotelRetailCategory}) => ({
    ...state,
    hotelRetailCategory: {
      error: null,
      status: ELoadingStatus.loaded,
      data: hotelRetailCategory
    }
  })),
  on(loadHotelRetailFeatureList, (state) => ({
    ...state,
    hotelRetailFeature: {
      data: null,
      error: null,
      status: ELoadingStatus.loading,
    },
  })),
  on(loadedHotelRetailFeatureListSuccess, (state, {hotelRetailFeature}) => ({
    ...state,
    hotelRetailFeature: {
      error: null,
      status: ELoadingStatus.loaded,
      data: hotelRetailFeature
    }
  })),
  on(loadHotelSuggestedFeatureList, (state) => ({
    ...state,
    hotelSuggestedFeature: {
      data: null,
      error: null,
      status: ELoadingStatus.loading,
    },
  })),
  on(loadedHotelSuggestedFeatureListSuccess, (state, {hotelSuggestedFeature}) => ({
    ...state,
    hotelSuggestedFeature: {
      error: null,
      status: ELoadingStatus.loaded,
      data: hotelSuggestedFeature
    }
  })),
  on(loadPropertyBrandingList, (state) => ({
    ...state,
    propertyBranding: {
      data: null,
      error: null,
      status: ELoadingStatus.loading,
    },
  })),
  on(loadedPropertyBrandingListSuccessfully, (state, {branding}) => ({
    ...state,
    propertyBranding: {
      error: null,
      status: ELoadingStatus.loaded,
      data: branding
    }
  })),
  on(loadWidgetEventFeatureRecommendationList, (state) => ({
    ...state,
    eventFeatureRecommendationList: {
      data: null,
      error: null,
      status: ELoadingStatus.loading,
    },
  })),
  on(loadedWidgetEventFeatureRecommendationListSuccessfully, (state, {eventFeatureRecommendationList}) => ({
    ...state,
    eventFeatureRecommendationList: {
      error: null,
      status: ELoadingStatus.loaded,
      data: eventFeatureRecommendationList
    }
  })),
  on(loadPropertyMainFont, (state) => ({
    ...state,
    propertyMainFont: {
      data: null,
      error: null,
      status: ELoadingStatus.loading,
    },
  })),
  on(loadedPropertyMainFontSuccessfully, (state, {mainFontInfo}) => ({
    ...state,
    propertyMainFont: {
      error: null,
      status: ELoadingStatus.loaded,
      data: mainFontInfo
    }
  })),
);

export function HotelReducer(state: HotelState, action: Action) {
  return hotelReducer(state, action);
}
