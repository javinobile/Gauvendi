import {
  Hotel,
  HotelRetailCategory,
  HotelRetailFeature,
  IbeNearestAvailableDate,
  PropertyBranding, PropertyMainFont, WidgetEventFeatureRecommendation,
} from '@app/core/graphql/generated/graphql';
import {ILocation} from "@app/models/location";
import {LoadingStatus} from "@models/loading-status.model";

export const HOTEL_FEATURE_KEY = 'HOTEL-STATE';

export interface HotelState {
  hotelSelected: {
    status: LoadingStatus;
    data: Hotel;
    error?: string;
  };

  nearestAvailable: {
    status: LoadingStatus;
    data: IbeNearestAvailableDate[];
    error?: string;
  };

  location: {
    status: LoadingStatus;
    data: ILocation;
    error?: string;
  }

  hotelRetailCategory: {
    status: LoadingStatus;
    data: HotelRetailCategory[];
    error?: string;
  };

  hotelRetailFeature: {
    status: LoadingStatus;
    data: HotelRetailFeature[];
    error?: string;
  },
  hotelSuggestedFeature: {
    status: LoadingStatus;
    data: HotelRetailFeature[];
    error?: string;
  },
  propertyBranding: {
    status: LoadingStatus;
    data: PropertyBranding[];
    error?: string;
  },
  eventFeatureRecommendationList: {
    status: LoadingStatus;
    data: WidgetEventFeatureRecommendation;
    error?: string;
  },
  propertyMainFont: {
    status: LoadingStatus;
    data: PropertyMainFont[];
    error?: string;
  }
}
