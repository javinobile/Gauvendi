import {
  Hotel,
  HotelRetailCategory,
  HotelRetailFeature,
  IbeNearestAvailableDate,
  IbeNearestAvailableDateFilter,
  PropertyBranding,
  PropertyMainFont,
  QueryHotelListArgs,
  QueryHotelRetailCategoryListArgs,
  QueryHotelRetailFeatureListArgs,
  QueryPropertyBrandingListArgs,
  QueryPropertyMainFontInformationArgs,
  QuerySuggestedFeatureSetArgs,
  QueryWidgetEventFeatureRecommendationListArgs,
  WidgetEventFeatureRecommendation
} from '@core/graphql/generated/graphql';
import { ILocation } from '@models/location';
import { createAction, props } from '@ngrx/store';

export const loadHotel = createAction(
  '@hotel/load hotel',
  props<{ variables: QueryHotelListArgs }>()
);

export const loadedHotelSuccessfully = createAction(
  '@hotel/loaded hotel successfully',
  props<{ hotel: Hotel }>()
);

export const loadNearestAvailable = createAction(
  '@hotel/ load nearest available',
  props<{ variables: IbeNearestAvailableDateFilter }>()
);

export const loadedNearestAvailableSuccess = createAction(
  '@hotel/ loaded nearest available success',
  props<{ result: IbeNearestAvailableDate[] }>()
);

export const loadLocation = createAction('@hotel/load location');

export const loadedLocation = createAction(
  '@hotel/loaded location',
  (location: ILocation) => location
);

export const loadHotelRetailCategoryList = createAction(
  '@hotel/ load hotel retail category list',
  props<{ variables: QueryHotelRetailCategoryListArgs }>()
);

export const loadedHotelRetailCategoryListSuccess = createAction(
  '@hotel/ loaded hotel retail category list success',
  props<{ hotelRetailCategory: HotelRetailCategory[] }>()
);

export const loadHotelRetailFeatureList = createAction(
  '@hotel/ load hotel retail feature list',
  props<{ variables: QueryHotelRetailFeatureListArgs }>()
);

export const loadedHotelRetailFeatureListSuccess = createAction(
  '@hotel/ loaded hotel retail feature list success',
  props<{ hotelRetailFeature: HotelRetailFeature[] }>()
);

export const loadHotelSuggestedFeatureList = createAction(
  '@hotel/ load hotel suggested feature list',
  props<{ variables: QuerySuggestedFeatureSetArgs }>()
);

export const loadedHotelSuggestedFeatureListSuccess = createAction(
  '@hotel/ loaded hotel suggested feature list success',
  props<{ hotelSuggestedFeature: HotelRetailFeature[] }>()
);

export const loadPropertyBrandingList = createAction(
  '@hotel/ load property branding list',
  props<{ variables: QueryPropertyBrandingListArgs }>()
);

export const loadedPropertyBrandingListSuccessfully = createAction(
  '@hotel/ loaded property branding list successfully',
  props<{ branding: PropertyBranding[] }>()
);

export const loadWidgetEventFeatureRecommendationList = createAction(
  '@hotel/ load WidgetEventFeatureRecommendation list',
  props<{ variables: QueryWidgetEventFeatureRecommendationListArgs }>()
);

export const loadedWidgetEventFeatureRecommendationListSuccessfully =
  createAction(
    '@hotel/ loaded WidgetEventFeatureRecommendation list successfully',
    props<{
      eventFeatureRecommendationList: WidgetEventFeatureRecommendation;
    }>()
  );

export const loadPropertyMainFont = createAction(
  '@hotel/ load property main font',
  props<{ variables: QueryPropertyMainFontInformationArgs }>()
);

export const loadedPropertyMainFontSuccessfully = createAction(
  '@hotel/ loaded property main font successfully',
  props<{ mainFontInfo: PropertyMainFont[] }>()
);
