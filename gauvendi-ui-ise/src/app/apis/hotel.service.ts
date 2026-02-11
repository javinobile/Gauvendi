import {Injectable} from '@angular/core';
import {ExecuteService} from "@core/services/execute.service";
import {
  Country,
  Currency,
  QueryHotelListArgs,
  QueryHotelRetailCategoryListArgs,
  QueryHotelRetailFeatureListArgs,
  QueryHotelTagListArgs,
  QueryIbeNearestAvailableDateArgs,
  QueryPropertyBrandingListArgs, QueryPropertyMainFontInformationArgs,
  QuerySuggestedFeatureSetArgs,
  QueryWidgetEventFeatureRecommendationListArgs,
  ResponseData
} from "@core/graphql/generated/graphql";
import {Observable} from "rxjs";
import {
  QueryCountryListDocs,
  QueryCurrencyListDocs,
  QueryHotelListDocs,
  QueryHotelRetailCategoryListDocs,
  QueryHotelRetailFeatureListDocs,
  QueryHotelTagListDocs,
  QueryIbeNearestAvailableDateDocs,
  QueryPropertyBrandingListDocs, QueryPropertyMainFontInformationDocs,
  QuerySuggestedFeatureSetDocs,
  QueryWidgetEventFeatureRecommendationListDocs
} from "@core/graphql/generated/queries";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class HotelService {

  constructor(private executeService: ExecuteService) {
  }

  ibeNearestAvailableDate(variables: QueryIbeNearestAvailableDateArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QueryIbeNearestAvailableDateDocs,
      variables
    }).pipe(map(({response}) => response));
  }

  hotelList(variables: QueryHotelListArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QueryHotelListDocs,
      variables
    }).pipe(map(({response}) => response));
  }

  countryList(): Observable<Country[]> {
    return this.executeService.runQuery({
      query: QueryCountryListDocs,
    }).pipe(map(({response}) => response));
  }

  currencyList(): Observable<Currency[]> {
    return this.executeService.runQuery({
      query: QueryCurrencyListDocs,
    }).pipe(map(({response}) => response));
  }

  hotelRetailCategoryList(variables: QueryHotelRetailCategoryListArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QueryHotelRetailCategoryListDocs,
      variables
    }).pipe(map(({response}) => response));
  }

  hotelRetailFeatureList(variables: QueryHotelRetailFeatureListArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QueryHotelRetailFeatureListDocs,
      variables
    }).pipe(map(({response}) => response));
  }

  hotelSuggestedFeatureList(variables: QuerySuggestedFeatureSetArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QuerySuggestedFeatureSetDocs,
      variables
    }).pipe(map(({response}) => response));
  }

  hotelTagList(variables: QueryHotelTagListArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QueryHotelTagListDocs,
      variables
    }).pipe(map(({response}) => response));
  }

  propertyBrandingList(variables: QueryPropertyBrandingListArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QueryPropertyBrandingListDocs,
      variables
    }).pipe(map(({response}) => response));
  }

  widgetEventFeatureRecommendationList(variables: QueryWidgetEventFeatureRecommendationListArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QueryWidgetEventFeatureRecommendationListDocs,
      variables,
    }).pipe(map(({ response }) => response));
  }

  propertyMainFontInformation(variables: QueryPropertyMainFontInformationArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QueryPropertyMainFontInformationDocs,
      variables
    }).pipe(map(({response}) => response));
  }
}
