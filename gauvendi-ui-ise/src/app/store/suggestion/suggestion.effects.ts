import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StayOptionSuggestionService } from '@app/apis/stay-option-suggestion.service';
import { DataLayerEvents, DataLayerKeys } from '@app/constants/datalayer.enum';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { DuettoService } from '@app/services/duetto.service';
import { SojernService } from '@app/services/sojern.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { TrackingService } from '@app/services/tracking.service';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  AvailablePaymentMethod,
  HotelAmenity,
  HotelPaymentMode,
  HotelTag,
  RatePlan,
  StayOptionSuggestion
} from '@core/graphql/generated/graphql';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  loadAvailableAmenity,
  loadAvailablePaymentMethodList,
  loadCombinedAccommodationList,
  loadDirectStayOption,
  loadedAvailableAmenitySuccess,
  loadedAvailablePaymentMethodListSuccess,
  loadedCombinedAccommodationList,
  loadedDirectStayOptionSuccessfully,
  loadedPaymentOptionsBySalesPlanSuccessfully,
  loadedRatePlanListSuccess,
  loadedStayOptionRecommendationListV2Success,
  loadPaymentOptionsBySalesPlan,
  loadRatePlanList,
  loadStayOptionRecommendationListV2
} from '@store/suggestion/suggestion.actions';
import { differenceInDays } from 'date-fns';
import * as moment from 'moment';
import { of } from 'rxjs';
import { debounceTime, filter, map, switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SuggestionEffects {
  constructor(
    private actions$: Actions,
    private googleTrackingService: GoogleTrackingService,
    private route: ActivatedRoute,
    private stayOptionSuggestionService: StayOptionSuggestionService,
    private bookingTransactionService: BookingTransactionService,
    private trackingService: TrackingService,
    private sojernService: SojernService,
    private suggestionHandlerService: SuggestionHandlerService,
    private duettoService: DuettoService
  ) {}

  loadStayOptionRecommendationListV2$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadStayOptionRecommendationListV2),
      switchMap(({ variables, isMatchFlow }) =>
        this.stayOptionSuggestionService
          .stayOptionRecommendationListV2(variables)
          .pipe(
            debounceTime(300),
            tap(() => {
              this.pushEvent();
              this.pushSojern();
            }),
            switchMap((result) => {
              if (!result?.data?.length) {
                const newVariables = {
                  ...variables,
                  filter: {
                    ...variables?.filter,
                    splitToDoubleRooms: true
                  }
                };
                return this.stayOptionSuggestionService.stayOptionRecommendationListV2(
                  newVariables
                );
              }
              return of(result);
            }),
            map((result) => {
              if (result?.data?.length > 0) {
                this.pushDuetto(result?.data as StayOptionSuggestion[]);
                // exclude option that all sales plan have restrictions
                return (result?.data as StayOptionSuggestion[])?.filter(
                  (item) => {
                    const ratePlanLength =
                      item?.availableRfcList[0]?.rfcRatePlanList?.filter(
                        (x) => x?.restrictionValidationList?.length > 0
                      )?.length;
                    return (
                      (item?.availableRfcRatePlanList?.length > 0 &&
                        item?.availableRfcRatePlanList?.length !==
                          ratePlanLength) ||
                      (item?.unavailableRfcRatePlanList?.length > 0 &&
                        item?.unavailableRfcRatePlanList?.length !==
                          ratePlanLength)
                    );
                    // return item?.availableRfcRatePlanList?.length > 0
                    //   ? item?.availableRfcRatePlanList?.length !== item?.availableRfcList[0]?.rfcRatePlanList?.filter(x => x?.restrictionValidationList?.length > 0)?.length
                    //   : true;
                  }
                );
              }

              return [];
            }),
            map((result) =>
              result?.map((item) => ({
                ...item,
                stayOptionUuid: uuidv4()
              }))
            ),
            tap((result) => this.onTrack(result)),
            map((result) =>
              loadedStayOptionRecommendationListV2Success({
                stayOptionSuggestionList: result as StayOptionSuggestion[],
                isMatchFlow
              })
            )
          )
      )
    )
  );

  loadCombinedAccommodationList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCombinedAccommodationList),
      switchMap(({ variables }) =>
        this.stayOptionSuggestionService
          .stayOptionRecommendationListV2(variables)
          .pipe(
            debounceTime(300),
            map((result) => {
              if (result?.data?.length > 0) {
                // exclude option that all sales plan have restrictions
                return (result?.data as StayOptionSuggestion[])?.filter(
                  (item) => {
                    const ratePlanLength =
                      item?.availableRfcList[0]?.rfcRatePlanList?.filter(
                        (x) => x?.restrictionValidationList?.length > 0
                      )?.length;
                    return (
                      (item?.availableRfcRatePlanList?.length > 0 &&
                        item?.availableRfcRatePlanList?.length !==
                          ratePlanLength) ||
                      (item?.unavailableRfcRatePlanList?.length > 0 &&
                        item?.unavailableRfcRatePlanList?.length !==
                          ratePlanLength)
                    );
                  }
                );
              }

              return [];
            }),
            map((result) =>
              result?.map((item) => ({
                ...item,
                stayOptionUuid: uuidv4()
              }))
            ),
            tap((result) => this.onTrack(result)),
            map((result) =>
              loadedCombinedAccommodationList({
                combinedAccommodationList: result as StayOptionSuggestion[]
              })
            )
          )
      )
    )
  );

  loadDirectStayOption$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadDirectStayOption),
      switchMap(({ variables }) =>
        this.stayOptionSuggestionService
          .dedicatedStayOptionList(variables)
          .pipe(
            map((result) =>
              result?.data?.map((item) => ({
                ...item,
                stayOptionUuid: uuidv4()
              }))
            ),
            map((result) =>
              loadedDirectStayOptionSuccessfully({
                data: result as StayOptionSuggestion[]
              })
            )
          )
      )
    )
  );

  loadRatePlanList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadRatePlanList),
      switchMap(({ variables }) =>
        this.stayOptionSuggestionService
          .ratePlanList(variables)
          .pipe(
            map((result) =>
              loadedRatePlanListSuccess({ result: result?.data as RatePlan[] })
            )
          )
      )
    )
  );

  loadPaymentOptionsBySalesPlan$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPaymentOptionsBySalesPlan),
      switchMap(({ variables }) =>
        this.stayOptionSuggestionService
          .paymentOptionsBySalesPlan(variables)
          .pipe(
            map((result) =>
              loadedPaymentOptionsBySalesPlanSuccessfully({
                paymentOptions: result?.data as HotelPaymentMode[]
              })
            )
          )
      )
    )
  );

  loadAvailableAmenities$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAvailableAmenity),
      switchMap(({ variables }) =>
        this.stayOptionSuggestionService.availableAmenity(variables).pipe(
          map((result) =>
            loadedAvailableAmenitySuccess({
              result: result?.data as HotelAmenity[]
            })
          )
        )
      )
    )
  );

  pushEvent(): void {
    const queryParams = this.route.snapshot.queryParams;
    const travelTags = this.bookingTransactionService.travelTagSelected$
      ?.value as HotelTag[];
    const occasions = this.bookingTransactionService.occasionSelected$
      ?.value as HotelTag;
    const { checkIn, checkOut, dateRange } =
      this.bookingTransactionService.getCheckInOutDate({
        from: queryParams[RouteKeyQueryParams.checkInDate],
        to: queryParams[RouteKeyQueryParams.checkOutDate]
      });
    const numberOfNights =
      this.bookingTransactionService.getNumberOfNight(dateRange);
    const {
      totalRoom,
      adults: adult,
      children
    } = this.bookingTransactionService.getTraveler(
      queryParams[RouteKeyQueryParams.numberOfRoom]
    );

    const hotelCode = this.bookingTransactionService.getHotelCode(queryParams);

    this.googleTrackingService.pushEvent(DataLayerEvents.selectDateRoomAndPax, {
      [DataLayerKeys.checkIn]: checkIn
        ? moment(new Date(checkIn)).format('DD.MM.yyyy')
        : null,
      [DataLayerKeys.checkOut]: checkOut
        ? moment(new Date(checkOut)).format('DD.MM.yyyy')
        : null,
      [DataLayerKeys.numberOfRooms]: totalRoom,
      [DataLayerKeys.numberOfNights]: numberOfNights,
      [DataLayerKeys.totalAdults]: adult,
      [DataLayerKeys.totalChildren]: children,
      [DataLayerKeys.travelTags]: travelTags
        ? travelTags?.map((x) => x?.name)
        : null,
      [DataLayerKeys.occasions]: occasions ? occasions?.name : null,
      [DataLayerKeys.hotelCode]: hotelCode?.toLocaleUpperCase()
    });
  }

  onTrack(result: StayOptionSuggestion[]): void {
    const queryParams = this.route.snapshot.queryParams;
    const checkIn = queryParams[RouteKeyQueryParams.checkInDate];
    const checkOut = queryParams[RouteKeyQueryParams.checkOutDate];
    const currency = queryParams[RouteKeyQueryParams.currency];
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    const lang = queryParams[RouteKeyQueryParams.lang];
    const occasions = queryParams[RouteKeyQueryParams.occasions];
    const promoCode = queryParams[RouteKeyQueryParams.promoCode];
    const rooms = queryParams[RouteKeyQueryParams.numberOfRoom];
    const travelTags = queryParams[RouteKeyQueryParams.travelTags];
    const requestId = queryParams[RouteKeyQueryParams.requestId];
    const resultList = result?.map((x) => ({
      recommendation_id: x['stayOptionUuid'],
      booking_flow: x?.label,
      available_rfc_list: x?.availableRfcList?.map((y) => ({
        code: y?.code,
        name: y?.name,
        capacity_default: y?.capacityDefault,
        capacity_extra: y?.capacityExtra,
        matching_percentage: y?.matchingPercentage,
        number_of_bedrooms: y?.numberOfBedrooms,
        space: y?.space,
        retail_feature_list: y?.retailFeatureList
          ?.map((z) => z?.code)
          ?.join(','),
        most_popular_feature_list: y?.mostPopularFeatureList
          ?.map((z) => z?.code)
          ?.join(','),
        rfc_rate_plan_list: y?.rfcRatePlanList?.map((z) => z?.code)?.join(','),
        rfc_image: y?.rfcImageList ? y?.rfcImageList[0]?.imageUrl : null
      })),
      available_rfc_rate_plan_list: x?.availableRfcRatePlanList?.map((y) => ({
        code: y?.code,
        name: y?.name,
        average_daily_rate: y?.averageDailyRate,
        total_selling_rate: y.totalSellingRate,
        total_gross_amount: y?.totalGrossAmount,
        rate_plan: y?.ratePlan?.code
      })),
      unavailable_rfc_rate_plan_list: x?.unavailableRfcRatePlanList?.map(
        (y) => ({
          code: y?.code,
          name: y?.name,
          average_daily_rate: y?.averageDailyRate,
          total_selling_rate: y.totalSellingRate,
          total_gross_amount: y?.totalGrossAmount,
          rate_plan: y?.ratePlan?.code
        })
      ),
      restriction_list: x?.restrictionValidationList?.map((y) => ({
        code: y?.code,
        value: y?.value
      }))
    }));
    const trackObject = {
      query_search: {
        hotel_code: hotelCode,
        lang: lang?.toLocaleUpperCase(),
        currency: currency?.toLocaleUpperCase(),
        checkin: checkIn
          ? formatDate(
              checkIn?.split('-')?.reverse()?.join('-'),
              'MMM dd, yyyy',
              'en-US'
            )
          : null,
        checkout: checkOut
          ? formatDate(
              checkOut?.split('-')?.reverse()?.join('-'),
              'MMM dd, yyyy',
              'en-US'
            )
          : null,
        number_of_rooms: rooms?.split(',')?.length || null,
        adults: this.getRoomList(rooms)?.reduce(
          (acc, curr) => acc + curr?.adult,
          0
        ),
        children_age_list: this.getRoomList(rooms)
          ?.reduce((acc, curr) => [...acc, ...curr?.childrenAgeList], [])
          ?.join(','),
        promo_code: promoCode || null,
        travel_tags: travelTags || null,
        occasions: occasions || null
      },
      result_list: resultList,
      request_id: requestId
    };
    this.trackingService.track(MixpanelKeys.SearchResultList, trackObject);
  }

  pushSojern(): void {
    this.sojernService.trackingSearch({});
  }

  getRoomList(
    traveler: string
  ): { adult: number; childrenAgeList: number[] }[] {
    return traveler
      ?.toString()
      ?.split(',')
      ?.map((item) => {
        const person: string[] = item?.split('-');
        return {
          adult: +person?.shift(),
          childrenAgeList: person?.map((x) => +x)
        };
      });
  }

  pushDuetto(data: StayOptionSuggestion[]): void {
    if (data?.length > 0) {
      const numberOfNights = Math.abs(
        differenceInDays(
          new Date(
            this.bookingTransactionService.getArrival(
              this.route.snapshot.queryParams
            )
          ),
          new Date(
            this.bookingTransactionService.getDeparture(
              this.route.snapshot.queryParams
            )
          )
        )
      );
      const quoutes = data?.reduce((acc, cur) => {
        const lowestPriceOption = cur?.availableRfcRatePlanList?.sort(
          (x, y) => x?.totalBaseAmount - y?.totalBaseAmount
        )?.[0];
        if (!lowestPriceOption) {
          return acc;
        }
        return acc?.concat({
          rt: cur?.availableRfcList?.map((item) => item?.code)?.join('+'),
          r: lowestPriceOption?.totalBaseAmount,
          rc: lowestPriceOption?.ratePlan?.code
        });
      }, []);

      this.duettoService.trackSelectRoom({}, quoutes);
    } else {
      this.duettoService.trackNoAvailable({});
    }
  }

  loadAvailablePaymentMethodList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAvailablePaymentMethodList),
      switchMap(({ variables }) =>
        this.stayOptionSuggestionService
          .availablePaymentMethodList(variables)
          .pipe(
            map((result) =>
              loadedAvailablePaymentMethodListSuccess({
                availablePaymentMethodList:
                  result.data as AvailablePaymentMethod[]
              })
            )
          )
      )
    )
  );
}
