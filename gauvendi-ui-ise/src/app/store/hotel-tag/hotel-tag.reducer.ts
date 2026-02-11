import {ELoadingStatus} from "@models/loading-status.model";
import {Action, createReducer, on} from "@ngrx/store";
import {HotelTagState} from "@store/hotel-tag/hotel-tag.state";
import {loadedHotelTagListSuccess, loadHotelTagList} from "@store/hotel-tag/hotel-tag.actions";


export const initialState: HotelTagState = {
  hotelTag: {status: ELoadingStatus.idle, data: null},
};

const hotelTagReducer = createReducer(
  initialState,
  on(loadHotelTagList, (state) => ({
    ...state,
    hotelTag: {
      data: null,
      error: null,
      status: ELoadingStatus.loading,
    },
  })),
  on(loadedHotelTagListSuccess, (state, {hotelTag}) => ({
    ...state,
    hotelTag: {
      error: null,
      status: ELoadingStatus.loaded,
      data: hotelTag
    }
  })),
);

export function HotelTagReducer(state: HotelTagState, action: Action) {
  return hotelTagReducer(state, action);
}
