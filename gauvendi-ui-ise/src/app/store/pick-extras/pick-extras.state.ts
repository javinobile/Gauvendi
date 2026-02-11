import {
  BookingInformation,
  BookingPricing,
  HotelAmenity,
  Rfc
} from '@app/core/graphql/generated/graphql';
import { LoadingStatus } from '@models/loading-status.model';

export const PICK_EXTRAS_FEATURE_KEY = 'PICK-EXTRAS-STATE';

export interface PickExtrasState {
  calculatePaymentReservation: {
    status: LoadingStatus;
    data: BookingInformation;
    error?: string;
  };

  hotelAmenityIncluded: {
    status: LoadingStatus;
    data: HotelAmenity[];
    error?: string;
  };

  searchMatchingRfc: {
    status: LoadingStatus;
    data: Rfc[];
    error?: string;
  };

  availableAmenityByDistributionChannel: {
    status: LoadingStatus;
    data: HotelAmenity[];
    error?: string;
  };

  bookingPricing: {
    status: LoadingStatus;
    data: BookingPricing;
    error?: string;
  };

  surchargeAmenityList: {
    status: LoadingStatus;
    data: HotelAmenity[];
    error?: string;
  };
}
