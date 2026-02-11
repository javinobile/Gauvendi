import {createFeatureSelector, createSelector} from "@ngrx/store";
import {HOTEL_TAG_FEATURE_KEY, HotelTagState} from "@store/hotel-tag/hotel-tag.state";

export const selectHotelTagState = createFeatureSelector<HotelTagState>(HOTEL_TAG_FEATURE_KEY);

export const selectorHotelTagList = createSelector(
  selectHotelTagState,
  ({hotelTag}: HotelTagState) => hotelTag.data
);
