import {Injectable} from '@angular/core';
import {ExecuteService} from "@core/services/execute.service";
import {QueryCalendarDailyRateListArgs, ResponseData} from "@core/graphql/generated/graphql";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {QueryCalendarDailyRateListDocs} from "@core/graphql/generated/queries";

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  constructor(private executeService: ExecuteService) {
  }

  calendarDailyRateList(variables: QueryCalendarDailyRateListArgs): Observable<ResponseData> {
    return this.executeService.runQuery({
      query: QueryCalendarDailyRateListDocs,
      variables
    }).pipe(map(({response}) => response));
  }
}
