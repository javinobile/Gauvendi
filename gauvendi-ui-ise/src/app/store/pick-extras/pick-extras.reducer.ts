import { ELoadingStatus } from '@models/loading-status.model';
import { Action, createReducer, on } from '@ngrx/store';
import {
  loadAvailableAmenityByDistributionChannel,
  loadCalculateBookingPricing,
  loadedAvailableAmenityByDistributionChannelSuccess,
  loadedCalculateBookingPricingSuccessfully,
  loadedHotelAmenityIncludedSuccessfully,
  loadedSearchMatchingRfc,
  loadedSurchargeAmenityListSuccessfully,
  loadHotelAmenityIncluded,
  loadSearchMatchingRfc,
  loadSurchargeAmenityList,
  loadSurchargeAmenityListFailed
} from '@store/pick-extras/pick-extras.actions';
import { PickExtrasState } from '@store/pick-extras/pick-extras.state';

export const initialState: PickExtrasState = {
  calculatePaymentReservation: { status: ELoadingStatus.idle, data: null },
  hotelAmenityIncluded: { status: ELoadingStatus.idle, data: null },
  searchMatchingRfc: { status: ELoadingStatus.idle, data: null },
  availableAmenityByDistributionChannel: {
    status: ELoadingStatus.idle,
    data: null
  },
  bookingPricing: { status: ELoadingStatus.idle, data: null },
  surchargeAmenityList: { status: ELoadingStatus.idle, data: null }
};

const pickExtrasReducer = createReducer(
  initialState,
  on(loadHotelAmenityIncluded, (state) => ({
    ...state,
    hotelAmenityIncluded: {
      ...state.hotelAmenityIncluded,
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(loadedHotelAmenityIncludedSuccessfully, (state, { amenity }) => ({
    ...state,
    hotelAmenityIncluded: {
      ...state.hotelAmenityIncluded,
      error: null,
      status: ELoadingStatus.loaded,
      data: amenity
    }
  })),
  on(loadSearchMatchingRfc, (state) => ({
    ...state,
    searchMatchingRfc: {
      ...state.searchMatchingRfc,
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(loadedSearchMatchingRfc, (state, { rfc }) => ({
    ...state,
    searchMatchingRfc: {
      ...state.searchMatchingRfc,
      error: null,
      status: ELoadingStatus.loaded,
      data: rfc
    }
  })),
  on(loadAvailableAmenityByDistributionChannel, (state) => ({
    ...state,
    availableAmenityByDistributionChannel: {
      ...state.availableAmenityByDistributionChannel,
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(
    loadedAvailableAmenityByDistributionChannelSuccess,
    (state, { result }) => ({
      ...state,
      availableAmenityByDistributionChannel: {
        ...state.availableAmenityByDistributionChannel,
        error: null,
        status: ELoadingStatus.loaded,
        data: result
      }
    })
  ),
  on(loadCalculateBookingPricing, (state) => ({
    ...state,
    bookingPricing: {
      ...state.bookingPricing,
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(
    loadedCalculateBookingPricingSuccessfully,
    (state, { bookingPricing }) => ({
      ...state,
      bookingPricing: {
        ...state.bookingPricing,
        error: null,
        status: ELoadingStatus.loaded,
        data: bookingPricing
      }
    })
  ),
  on(loadSurchargeAmenityList, (state) => ({
    ...state,
    surchargeAmenityList: {
      ...state.surchargeAmenityList,
      error: null,
      status: ELoadingStatus.loading,
      data: null
    }
  })),
  on(
    loadedSurchargeAmenityListSuccessfully,
    (state, { surchargeAmenityList }) => ({
      ...state,
      surchargeAmenityList: {
        ...state.surchargeAmenityList,
        error: null,
        status: ELoadingStatus.loaded,
        data: surchargeAmenityList
      }
    })
  ),
  on(loadSurchargeAmenityListFailed, (state, { error }) => ({
    ...state,
    surchargeAmenityList: {
      ...state.surchargeAmenityList,
      error,
      status: ELoadingStatus.error
    }
  }))
);

export function PickExtrasReducer(state: PickExtrasState, action: Action) {
  return pickExtrasReducer(state, action);
}
