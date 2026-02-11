import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {HotelService} from "@app/apis/hotel.service";
import {catchError, exhaustMap, map, switchMap} from "rxjs/operators";
import {of} from "rxjs";
import {HotelTag} from "@core/graphql/generated/graphql";
import {loadedHotelTagListSuccess, loadHotelTagList} from "@store/hotel-tag/hotel-tag.actions";


@Injectable()
export class HotelTagEffects {
  constructor(
    private actions$: Actions,
    private hotelService: HotelService,
  ) {
  }

  loadHotelTagList$ = createEffect(() => this.actions$.pipe(
    ofType(loadHotelTagList),
    exhaustMap(({variables}) => this.hotelService.hotelTagList(variables)
      .pipe(
        catchError(() => of({data: []})),
        map(result => loadedHotelTagListSuccess({hotelTag: result.data as HotelTag[]})),
      ))
  ));


}
