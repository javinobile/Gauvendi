import {createFeatureSelector, createSelector} from "@ngrx/store";
import {Booking, BookingInformation, BookingPaymentResponse, Transaction} from "@core/graphql/generated/graphql";
import {BOOKING_SUMMARY_FEATURE_KEY, BookingSummaryState} from "@store/booking-summary/booking-summary.state";

export const selectBookingSummaryState = createFeatureSelector<BookingSummaryState>(BOOKING_SUMMARY_FEATURE_KEY);

export const selectorBookingSummary = createSelector(
  selectBookingSummaryState,
  ({bookingSummary}) => bookingSummary?.data as BookingInformation
);

export const selectorTransaction = createSelector(
  selectBookingSummaryState,
  ({transaction}) => transaction?.data as Transaction
);

export const selectorCppBookingSummary = createSelector(
  selectBookingSummaryState,
  ({cppBookingSummary}) => cppBookingSummary?.data as Booking
);

export const selectorBookingStatus = createSelector(
  selectBookingSummaryState,
  ({bookingStatus}) => bookingStatus?.data?.[0] as BookingPaymentResponse
);
