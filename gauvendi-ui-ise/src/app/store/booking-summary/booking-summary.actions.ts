import {createAction, props} from "@ngrx/store";
import {
  Booking, BookingPaymentResponse,
  MutationGenerateTransactionArgs, QueryBookingStatusArgs,
  QueryBookingSummaryArgs, QueryCppBookingSummaryArgs,
  Transaction
} from "@core/graphql/generated/graphql";

export const loadBookingSummary = createAction(
  '@BookingSummary/ load booking summary',
  props<{ variables: QueryBookingSummaryArgs }>(),
);

export const loadedBookingSummarySuccessfully = createAction(
  '@BookingSummary/ loaded booking summary successfully',
  props<{ bookingInfo: Booking }>()
);

export const generateTransaction = createAction(
  '@BookingSummary/ generate transaction',
  props<{ variables: MutationGenerateTransactionArgs }>(),
);

export const generateTransactionSuccessfully = createAction(
  '@BookingSummary/ generate transaction successfully',
  props<{ transaction: Transaction }>()
);

export const loadCppBookingSummary = createAction(
  '@BookingSummary/ load cpp booking summary',
  props<{ variables: QueryCppBookingSummaryArgs }>(),
);

export const loadedCppBookingSummarySuccessfully = createAction(
  '@BookingSummary/ loaded cpp booking summary successfully',
  props<{ bookingInfo: Booking }>()
);

export const loadBookingStatus = createAction(
  '@BookingProcessing/ load booking status',
  props<{ variables: QueryBookingStatusArgs }>(),
);

export const loadedBookingStatusSuccessfully = createAction(
  '@BookingProcessing/ loaded booking status successfully',
  props<{ bookingStatus: BookingPaymentResponse[] }>()
);
