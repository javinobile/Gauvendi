import {Pipe, PipeTransform} from '@angular/core';
import {HotelConfigService} from "@app/services/hotel-config.service";
import * as moment from "moment-timezone";

@Pipe({
  name: 'calculateBookingNight',
  standalone: true
})
export class CalculateBookingNightPipe implements PipeTransform {

  constructor(
    private hotelConfigService: HotelConfigService
  ) {
  }

  transform(arrival: string, departure: string): number {
    const timezone = this.hotelConfigService.hotelTimezone.getValue();
    return Math.abs(moment(arrival).tz(timezone).startOf('dates').diff(moment(departure).tz(timezone).startOf("dates"), 'days'));
  }

}
