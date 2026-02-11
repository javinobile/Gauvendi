import {LoadingStatus} from "@models/loading-status.model";
import {Booking, BookingPaymentResponse, Transaction} from "@core/graphql/generated/graphql";

export const BOOKING_SUMMARY_FEATURE_KEY = 'BOOKING-SUMMARY-STATE';

export interface BookingSummaryState {
  bookingSummary: {
    status: LoadingStatus;
    data: Booking;
    error?: string;
  };

  transaction: {
    status: LoadingStatus;
    data: Transaction;
    error?: string;
  };

  cppBookingSummary: {
    status: LoadingStatus;
    data: Booking;
    error?: string;
  };

  bookingStatus: {
    status: LoadingStatus;
    data: BookingPaymentResponse[];
    error?: string;
  };

}
