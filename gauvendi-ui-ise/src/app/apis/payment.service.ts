import { Injectable } from '@angular/core';
import {
  BookingInformation,
  MutationCompleteBookingPaymentArgs,
  MutationConfirmBookingPaymentArgs,
  MutationConfirmBookingProposalArgs,
  MutationDeclineProposalBookingArgs,
  MutationGenerateTransactionArgs,
  MutationRequestBookingArgs,
  MutationUpdateBookingInformationArgs,
  QueryBookingStatusArgs,
  QueryBookingSummaryArgs,
  QueryCppBookingSummaryArgs,
  QueryHotelTemplateEmailListArgs,
  ResponseContent,
} from '@core/graphql/generated/graphql';
import {
  MutationCompleteBookingPaymentDocs,
  MutationConfirmBookingPaymentDocs,
  MutationConfirmBookingProposalDocs,
  MutationDeclineProposalBookingDocs,
  MutationGenerateTransactionDocs,
  MutationRequestBookingDocs,
  MutationUpdateBookingInformationDocs,
} from '@core/graphql/generated/mutation';
import {
  QueryBookingStatusDocs,
  QueryBookingSummaryDocs,
  QueryCppBookingSummaryDocs,
  QueryHotelTemplateEmailListDocs,
} from '@core/graphql/generated/queries';
import { ExecuteService } from '@core/services/execute.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  constructor(private executeService: ExecuteService) {}

  completeBookingPayment(variables: MutationCompleteBookingPaymentArgs): Observable<ResponseContent> {
    return this.executeService
      .runQuery({
        query: MutationCompleteBookingPaymentDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  bookingSummary(variables: QueryBookingSummaryArgs): Observable<BookingInformation> {
    return this.executeService
      .runQuery({
        query: QueryBookingSummaryDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  hotelTemplateEmailList(variables: QueryHotelTemplateEmailListArgs): Observable<ResponseContent> {
    return this.executeService
      .runQuery({
        query: QueryHotelTemplateEmailListDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  updateBookingInformation(variables: MutationUpdateBookingInformationArgs): Observable<ResponseContent> {
    return this.executeService
      .runQuery({
        query: MutationUpdateBookingInformationDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  confirmBookingProposal(variables: MutationConfirmBookingProposalArgs): Observable<ResponseContent> {
    return this.executeService
      .runQuery({
        query: MutationConfirmBookingProposalDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  declineProposalBooking(variables: MutationDeclineProposalBookingArgs): Observable<ResponseContent> {
    return this.executeService
      .runQuery({
        query: MutationDeclineProposalBookingDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  generateTransaction(variables: MutationGenerateTransactionArgs): Observable<ResponseContent> {
    return this.executeService
      .runQuery({
        query: MutationGenerateTransactionDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  cppBookingSummary(variables: QueryCppBookingSummaryArgs): Observable<BookingInformation> {
    return this.executeService
      .runQuery({
        query: QueryCppBookingSummaryDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  confirmBookingPayment(variables: MutationConfirmBookingPaymentArgs): Observable<ResponseContent> {
    return this.executeService
      .runQuery({
        query: MutationConfirmBookingPaymentDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  bookingStatus(variables: QueryBookingStatusArgs): Observable<ResponseContent> {
    return this.executeService
      .runQuery({
        query: QueryBookingStatusDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }

  requestBooking(variables: MutationRequestBookingArgs): Observable<ResponseContent> {
    return this.executeService
      .runQuery({
        query: MutationRequestBookingDocs,
        variables,
      })
      .pipe(map(({ response }) => response));
  }
}
