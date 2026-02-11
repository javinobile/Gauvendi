import { Injectable } from '@angular/core';
import { HotelService } from '@app/apis/hotel.service';
import { LocationService } from '@app/apis/location.service';
import { MEASURE_METRIC_KEY } from '@app/constants/localStorage.const';
import { HotelConfigService } from '@app/services/hotel-config.service';
import {
  Hotel,
  HotelRetailCategory,
  HotelRetailFeature,
  IbeNearestAvailableDate,
  PropertyBranding,
  PropertyMainFont,
  WidgetEventFeatureRecommendation
} from '@core/graphql/generated/graphql';
import { ILocation } from '@models/location';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  loadedHotelRetailCategoryListSuccess,
  loadedHotelRetailFeatureListSuccess,
  loadedHotelSuccessfully,
  loadedHotelSuggestedFeatureListSuccess,
  loadedLocation,
  loadedNearestAvailableSuccess,
  loadedPropertyBrandingListSuccessfully,
  loadedPropertyMainFontSuccessfully,
  loadedWidgetEventFeatureRecommendationListSuccessfully,
  loadHotel,
  loadHotelRetailCategoryList,
  loadHotelRetailFeatureList,
  loadHotelSuggestedFeatureList,
  loadLocation,
  loadNearestAvailable,
  loadPropertyBrandingList,
  loadPropertyMainFont,
  loadWidgetEventFeatureRecommendationList
} from '@store/hotel/hotel.actions';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';

@Injectable()
export class HotelEffects {
  constructor(
    private actions$: Actions,
    private hotelService: HotelService,
    private hotelConfigService: HotelConfigService,
    private locationService: LocationService
  ) {}

  loadHotel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadHotel),
      exhaustMap(({ variables }) =>
        this.hotelService.hotelList(variables).pipe(
          catchError(() => of({ data: [] })),
          map((result) => {
            const hotel = result?.data?.[0] as Hotel;
            this.hotelConfigService.hotel$.next(hotel);
            // Set metric to local storage & use global
            if (hotel?.measureMetric) {
              localStorage.setItem(MEASURE_METRIC_KEY, hotel?.measureMetric);
            }

            return loadedHotelSuccessfully({ hotel });
          })
        )
      )
    )
  );

  loadNearestAvailable$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadNearestAvailable),
      exhaustMap(({ variables }) =>
        this.hotelService.ibeNearestAvailableDate({ filter: variables }).pipe(
          catchError(() => of({ data: [] })),
          map((result) =>
            loadedNearestAvailableSuccess({
              result: result.data as IbeNearestAvailableDate[]
            })
          )
        )
      )
    )
  );

  loadLocation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadLocation),
      exhaustMap(() =>
        this.locationService
          .userLocation()
          .pipe(map((res) => loadedLocation(res as ILocation)))
      )
    )
  );

  loadHotelRetailCategoryList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadHotelRetailCategoryList),
      exhaustMap(({ variables }) =>
        this.hotelService.hotelRetailCategoryList(variables).pipe(
          map((result) =>
            loadedHotelRetailCategoryListSuccess({
              hotelRetailCategory: result.data as HotelRetailCategory[]
            })
          )
        )
      )
    )
  );

  loadHotelRetailFeatureList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadHotelRetailFeatureList),
      exhaustMap(({ variables }) =>
        this.hotelService.hotelRetailFeatureList(variables).pipe(
          map((result) =>
            loadedHotelRetailFeatureListSuccess({
              hotelRetailFeature: result.data as HotelRetailFeature[]
            })
          )
        )
      )
    )
  );

  loadHotelSuggestedFeatureList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadHotelSuggestedFeatureList),
      exhaustMap(({ variables }) =>
        this.hotelService.hotelSuggestedFeatureList(variables).pipe(
          map((result) =>
            loadedHotelSuggestedFeatureListSuccess({
              hotelSuggestedFeature: result.data as HotelRetailFeature[]
            })
          )
        )
      )
    )
  );

  loadPropertyBrandingList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPropertyBrandingList),
      exhaustMap(({ variables }) =>
        this.hotelService.propertyBrandingList(variables).pipe(
          map((result) => {
            const branding = result?.data as PropertyBranding[];
            this.hotelConfigService.hotelBranding$.next(branding);
            return loadedPropertyBrandingListSuccessfully({ branding });
          })
        )
      )
    )
  );

  loadWidgetEventFeatureRecommendationList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadWidgetEventFeatureRecommendationList),
      switchMap(({ variables }) =>
        this.hotelService.widgetEventFeatureRecommendationList(variables).pipe(
          map((result) =>
            loadedWidgetEventFeatureRecommendationListSuccessfully({
              eventFeatureRecommendationList:
                result?.data as WidgetEventFeatureRecommendation
            })
          )
        )
      )
    )
  );

  loadPropertyMainFont$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPropertyMainFont),
      exhaustMap(({ variables }) =>
        this.hotelService.propertyMainFontInformation(variables).pipe(
          map((result) =>
            loadedPropertyMainFontSuccessfully({
              mainFontInfo: result?.data as PropertyMainFont[]
            })
          )
        )
      )
    )
  );
}
