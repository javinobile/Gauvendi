import { inject, Injectable } from '@angular/core';
import {
  MutationCalculateBookingPricingArgs,
  QueryAvailableAmenityArgs,
  QueryAvailablePaymentMethodListArgs,
  QueryDedicatedStayOptionListArgs,
  QueryPaymentOptionsBySalesPlanArgs,
  QueryRatePlanListArgs,
  QuerySearchMatchingRfcV2Args,
  QueryStayOptionRecommendationListV2Args,
  ResponseData
} from '@core/graphql/generated/graphql';
import { MutationCalculateBookingPricingDocs } from '@core/graphql/generated/mutation';
import {
  QueryAvailableAmenityDocs,
  QueryAvailablePaymentMethodListDocs,
  QueryDedicatedStayOptionListDocs,
  QueryPaymentOptionsBySalesPlanDocs,
  QueryRatePlanListDocs,
  QuerySearchMatchingRfcV2Docs,
  QueryStayOptionRecommendationListV2Docs
} from '@core/graphql/generated/queries';
import { ExecuteService } from '@core/services/execute.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StayOptionSuggestionService {
  private executeService = inject(ExecuteService);

  stayOptionRecommendationListV2(
    variables: QueryStayOptionRecommendationListV2Args
  ): Observable<ResponseData> {
    return this.executeService
      .runQuery({
        query: QueryStayOptionRecommendationListV2Docs,
        variables
      })
      .pipe(map(({ response }) => response));
  }

  ratePlanList(variables: QueryRatePlanListArgs): Observable<ResponseData> {
    return this.executeService
      .runQuery({
        query: QueryRatePlanListDocs,
        variables
      })
      .pipe(map(({ response }) => response));
  }

  paymentOptionsBySalesPlan(
    variables: QueryPaymentOptionsBySalesPlanArgs
  ): Observable<ResponseData> {
    return this.executeService
      .runQuery({
        query: QueryPaymentOptionsBySalesPlanDocs,
        variables
      })
      .pipe(map(({ response }) => response));
  }

  availableAmenity(
    variables: QueryAvailableAmenityArgs
  ): Observable<ResponseData> {
    return this.executeService
      .runQuery({
        query: QueryAvailableAmenityDocs,
        variables
      })
      .pipe(map(({ response }) => response));
  }

  searchMatchingRfcV2(
    variables: QuerySearchMatchingRfcV2Args
  ): Observable<ResponseData> {
    return this.executeService
      .runQuery({
        query: QuerySearchMatchingRfcV2Docs,
        variables
      })
      .pipe(map(({ response }) => response));
  }

  dedicatedStayOptionList(
    variables: QueryDedicatedStayOptionListArgs
  ): Observable<ResponseData> {
    return this.executeService
      .runQuery({
        query: QueryDedicatedStayOptionListDocs,
        variables
      })
      .pipe(map(({ response }) => response));
  }

  calculateBookingPricing(
    variables: MutationCalculateBookingPricingArgs
  ): Observable<ResponseData> {
    return this.executeService
      .runMutation({
        mutation: MutationCalculateBookingPricingDocs,
        variables
      })
      .pipe(map(({ response }) => response));
  }

  availablePaymentMethodList(
    variables: QueryAvailablePaymentMethodListArgs
  ): Observable<ResponseData> {
    return this.executeService
      .runMutation({
        mutation: QueryAvailablePaymentMethodListDocs,
        variables
      })
      .pipe(map(({ response }) => response));
  }
}
