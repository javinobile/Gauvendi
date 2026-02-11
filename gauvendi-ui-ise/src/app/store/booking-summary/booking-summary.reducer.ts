import {ELoadingStatus} from "@models/loading-status.model";
import {Action, createReducer, on} from "@ngrx/store";
import {BookingSummaryState} from "@store/booking-summary/booking-summary.state";
import {
  generateTransaction,
  generateTransactionSuccessfully, loadBookingStatus,
  loadBookingSummary, loadCppBookingSummary, loadedBookingStatusSuccessfully,
  loadedBookingSummarySuccessfully, loadedCppBookingSummarySuccessfully
} from "@store/booking-summary/booking-summary.actions";

export const initialState: BookingSummaryState = {
  bookingSummary: {status: ELoadingStatus.idle, data: null},
  transaction: {status: ELoadingStatus.idle, data: null},
  cppBookingSummary: {status: ELoadingStatus.idle, data: null},
  bookingStatus: {status: ELoadingStatus.idle, data: null},
};

const bookingSummaryReducer = createReducer(
  initialState,
  on(loadBookingSummary, (state) => ({
    ...state,
    bookingSummary: {
      ...state.bookingSummary,
      error: null,
      status: ELoadingStatus.loading,
      data: null,
    },
  })),
  on(loadedBookingSummarySuccessfully, (state, {bookingInfo}) => ({
    ...state,
    bookingSummary: {
      ...state.bookingSummary,
      error: null,
      status: ELoadingStatus.loaded,
      data: bookingInfo,
    },
  })),
  on(generateTransaction, (state) => ({
    ...state,
    transaction: {
      ...state.transaction,
      error: null,
      status: ELoadingStatus.loading,
      data: null,
    },
  })),
  on(generateTransactionSuccessfully, (state, {transaction}) => ({
    ...state,
    transaction: {
      ...state.transaction,
      error: null,
      status: ELoadingStatus.loaded,
      data: transaction,
    },
  })),
  on(loadCppBookingSummary, (state) => ({
    ...state,
    cppBookingSummary: {
      ...state.cppBookingSummary,
      error: null,
      status: ELoadingStatus.loading,
      data: null,
    },
  })),
  on(loadedCppBookingSummarySuccessfully, (state, {bookingInfo}) => ({
    ...state,
    cppBookingSummary: {
      ...state.cppBookingSummary,
      error: null,
      status: ELoadingStatus.loaded,
      data: bookingInfo,
    },
  })),
  on(loadBookingStatus, (state) => ({
    ...state,
    bookingStatus: {
      ...state.bookingStatus,
      error: null,
      status: ELoadingStatus.loading,
      data: null,
    },
  })),
  on(loadedBookingStatusSuccessfully, (state, {bookingStatus}) => ({
    ...state,
    bookingStatus: {
      ...state.bookingStatus,
      error: null,
      status: ELoadingStatus.loaded,
      data: bookingStatus,
    },
  })),
);

export function BookingSummaryReducer(state: BookingSummaryState, action: Action) {
  return bookingSummaryReducer(state, action);
}
