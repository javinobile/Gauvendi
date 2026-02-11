import {LoadingStatus} from "@models/loading-status.model";
import {
  AvailablePaymentMethod,
  HotelAmenity,
  HotelPaymentMode,
  RatePlan,
  StayOptionSuggestion,
} from "@core/graphql/generated/graphql";

export const SUGGESTION_FEATURE_KEY = 'SUGGESTION-STATE';

export interface SuggestionState {
  stayOptionSuggestionList: {
    status: LoadingStatus;
    data: StayOptionSuggestion[];
    error?: string;
  };

  // moreStayOptionSuggestionList: {
  //   status: LoadingStatus;
  //   data: StayOptionSuggestion[];
  //   error?: string;
  // };

  directStayOption: {
    status: LoadingStatus;
    data: StayOptionSuggestion;
    error?: string;
  };

  ratePlanList: {
    status: LoadingStatus;
    data: RatePlan[];
    error?: string;
  };

  paymentOptions: {
    status: LoadingStatus;
    data: HotelPaymentMode[];
    error?: string;
  };

  availableAmenity: {
    status: LoadingStatus;
    data: HotelAmenity[];
    error?: string;
  };

  lowestStayOption: {
    status: LoadingStatus;
    data: StayOptionSuggestion;
    error?: string;
  };

  lowestDirectStayOption: {
    status: LoadingStatus;
    data: StayOptionSuggestion;
    error?: string;
  };

  availablePaymentMethodList: {
    status: LoadingStatus;
    data: AvailablePaymentMethod[];
    error?: string;
  };
  combinedStayOptionList: {
    status: LoadingStatus;
    data: StayOptionSuggestion[];
    error?: string;
  };
}
