import {Pipe, PipeTransform} from '@angular/core';
import {DateUtils} from "@utils/DateUtils";

@Pipe({
  name: 'violateMinLos',
  standalone: true
})
export class ViolateMinLosPipe implements PipeTransform {
  transform(date: Date, violatedDates: Date[]): boolean {
    return violatedDates
      ?.filter(item => DateUtils.isSameDateOnCalendar(item, date))
      ?.length > 0;
  }
}
