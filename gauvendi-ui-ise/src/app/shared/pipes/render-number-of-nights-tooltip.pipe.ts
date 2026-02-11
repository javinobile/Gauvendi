import {Pipe, PipeTransform} from '@angular/core';
import {differenceInDays, isAfter} from "date-fns";
import {combineLatest, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";

@Pipe({
  name: 'renderNumberOfNightsTooltip',
  standalone: true
})
export class RenderNumberOfNightsTooltipPipe implements PipeTransform {

  constructor(
    private translatePipe: TranslatePipe
  ) {
  }

  transform(fromDate: Date | string, toDate: Date | string, format: string, locale: string): Observable<string> {
    if (!fromDate || !toDate) {
      return null;
    }

    if (!isAfter(new Date(toDate), new Date(fromDate))) {
      return null;
    }

    const count = Math.abs(differenceInDays(new Date(fromDate), new Date(toDate)));
    return combineLatest([
      this.translatePipe.transform('NIGHT'),
      this.translatePipe.transform('NIGHTS'),
    ]).pipe(
      map(([night, nights]) => {
        return count > 0 ? `${count} ${count > 1 ? nights : night}` : '';
      })
    );
  }
}
