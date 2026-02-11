import {Pipe, PipeTransform} from '@angular/core';
import {isSameDay} from "date-fns";

@Pipe({
  name: 'isSameDay',
  standalone: true
})
export class IsSameDayPipe implements PipeTransform {

  transform(date: Date, compareDate: Date): boolean {
    return isSameDay(date, compareDate);
  }

}
