import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {map, switchMap} from "rxjs/operators";
import {Booking, BookingInformation, BookingPaymentResponse, Transaction} from "@core/graphql/generated/graphql";
import {PaymentService} from "@app/apis/payment.service";
import {
  generateTransaction,
  generateTransactionSuccessfully, loadBookingStatus,
  loadBookingSummary,
  loadCppBookingSummary, loadedBookingStatusSuccessfully,
  loadedBookingSummarySuccessfully,
  loadedCppBookingSummarySuccessfully
} from "@store/booking-summary/booking-summary.actions";

@Injectable()
export class BookingSummaryEffects {
  constructor(
    private paymentService: PaymentService,
    private actions$: Actions,
  ) {
  }

  loadBookingSummary$ = createEffect(() => this.actions$.pipe(
    ofType(loadBookingSummary),
    switchMap(({variables}) => this.paymentService.bookingSummary({
      filter: variables?.filter
    })
      .pipe(
        map(result => loadedBookingSummarySuccessfully({bookingInfo: result || {} as BookingInformation})),
      ))
  ));

  generateTransaction$ = createEffect(() => this.actions$.pipe(
    ofType(generateTransaction),
    switchMap(({variables}) => this.paymentService.generateTransaction(variables)
      .pipe(
        map(result => generateTransactionSuccessfully({transaction: result?.data as Transaction})),
      ))
  ));

  loadCppBookingSummary$ = createEffect(() => this.actions$.pipe(
    ofType(loadCppBookingSummary),
    switchMap(({variables}) => this.paymentService.cppBookingSummary({
      filter: variables?.filter
    })
      .pipe(
        map(result => loadedCppBookingSummarySuccessfully({bookingInfo: result || {} as Booking})),
      ))
  ));

  loadBookingStatus$ = createEffect(() => this.actions$.pipe(
    ofType(loadBookingStatus),
    switchMap(({variables}) => this.paymentService.bookingStatus({
      filter: variables?.filter
    })
      .pipe(
        map(result => loadedBookingStatusSuccessfully({bookingStatus: result?.data as BookingPaymentResponse[]})),
      ))
  ));
}
