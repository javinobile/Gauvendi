import { Injectable } from '@angular/core';
import {
  QueryRoomProductIncludedHotelExtraListArgs,
  QuerySurchargeAmenityListArgs
} from '@core/graphql/generated/graphql';
import {
  QueryRoomProductIncludedHotelExtraListDocs,
  QuerySurchargeAmenityListDocs
} from '@core/graphql/generated/queries';
import { ExecuteService } from '@core/services/execute.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HotelAmenityService {
  constructor(private executeGraphqlService: ExecuteService) {}

  roomProductIncludedHotelExtraList(
    variables: QueryRoomProductIncludedHotelExtraListArgs
  ): Observable<any> {
    return this.executeGraphqlService
      .runQuery({
        query: QueryRoomProductIncludedHotelExtraListDocs,
        variables
      })
      .pipe(map(({ response }) => response));
  }

  surchargeAmenityList(
    variables: QuerySurchargeAmenityListArgs
  ): Observable<any> {
    return this.executeGraphqlService
      .runQuery({
        query: QuerySurchargeAmenityListDocs,
        variables
      })
      .pipe(map(({ response }) => response));
  }
}
