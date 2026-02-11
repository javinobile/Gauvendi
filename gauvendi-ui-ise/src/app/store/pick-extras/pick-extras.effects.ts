import { Injectable } from '@angular/core';
import { HotelAmenityService } from '@app/apis/hotel-amenity.service';
import { StayOptionSuggestionService } from '@app/apis/stay-option-suggestion.service';
import {
  BookingPricing,
  HotelAmenity,
  Rfc
} from '@core/graphql/generated/graphql';
import { Actions, createEffect, ofType } from '@ngrx/effects';
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
import { forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

@Injectable()
export class PickExtrasEffects {
  constructor(
    private actions$: Actions,
    private hotelAmenityService: HotelAmenityService,
    private stayOptionSuggestionService: StayOptionSuggestionService
  ) {}

  loadHotelAmenityIncluded$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadHotelAmenityIncluded),
      switchMap(({ variables }) =>
        this.hotelAmenityService
          .roomProductIncludedHotelExtraList(variables)
          .pipe(
            map((result) =>
              loadedHotelAmenityIncludedSuccessfully({
                amenity: result?.data as HotelAmenity[]
              })
            )
          )
      )
    )
  );

  loadSearchMatchingRfc$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadSearchMatchingRfc),
      switchMap(({ variables }) =>
        forkJoin(
          variables?.map((item) => {
            return this.stayOptionSuggestionService.searchMatchingRfcV2(item);
          })
        )?.pipe(
          map((result) =>
            loadedSearchMatchingRfc({
              rfc: result?.reduce((acc, cur) => {
                return acc.concat(cur?.data);
              }, []) as Rfc[]
            })
          )
        )
      )
    )
  );

  loadAvailableAmenityByDistributionChannel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAvailableAmenityByDistributionChannel),
      switchMap(({ variables }) =>
        this.stayOptionSuggestionService.availableAmenity(variables).pipe(
          map((result) =>
            loadedAvailableAmenityByDistributionChannelSuccess({
              result: result?.data as HotelAmenity[]
            })
          )
        )
      )
    )
  );

  loadCalculateBookingPricing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCalculateBookingPricing),
      switchMap(({ variables }) =>
        this.stayOptionSuggestionService
          .calculateBookingPricing(variables)
          .pipe(
            map((result) =>
              loadedCalculateBookingPricingSuccessfully({
                bookingPricing: result?.data as BookingPricing
              })
            )
          )
      )
    )
  );

  loadSurchargeAmenityList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadSurchargeAmenityList),
      switchMap(({ variables }) =>
        this.hotelAmenityService.surchargeAmenityList(variables).pipe(
          shareReplay(1),
          map((result) =>
            loadedSurchargeAmenityListSuccessfully({
              surchargeAmenityList: result?.data as HotelAmenity[]
            })
          ),
          catchError((error) =>
            of(loadSurchargeAmenityListFailed({ error: error?.message }))
          )
        )
      )
    )
  );
}
