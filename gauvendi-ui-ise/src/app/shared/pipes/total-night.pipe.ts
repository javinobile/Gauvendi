import {Pipe, PipeTransform} from '@angular/core';
import * as moment from "moment";

@Pipe({
  name: 'totalNight',
  standalone: true
})
export class TotalNightPipe implements PipeTransform {

  transform(arrival: number, departure: number): number {
    return arrival && departure ? Math.abs(moment(arrival).startOf('dates').diff(moment(departure).startOf("dates"), 'days')) : null;
  }

}
