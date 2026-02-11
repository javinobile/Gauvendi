import {HotelTag, QueryHotelTagListArgs} from "@core/graphql/generated/graphql";
import {createAction, props} from "@ngrx/store";

export const loadHotelTagList = createAction(
  '@hotel-tag/ load hotel tag list',
  props<{ variables: QueryHotelTagListArgs }>(),
);

export const loadedHotelTagListSuccess = createAction(
  '@hotel-tag/ loaded hotel tag list success',
  props<{ hotelTag: HotelTag[] }>()
);
