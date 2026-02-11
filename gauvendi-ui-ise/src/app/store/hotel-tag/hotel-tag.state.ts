import {HotelTag} from "@app/core/graphql/generated/graphql";
import {LoadingStatus} from "@models/loading-status.model";

export const HOTEL_TAG_FEATURE_KEY = 'HOTEL-TAG-STATE';

export interface HotelTagState {
  hotelTag: {
    status: LoadingStatus;
    data: HotelTag[];
    error?: string;
  },
}
