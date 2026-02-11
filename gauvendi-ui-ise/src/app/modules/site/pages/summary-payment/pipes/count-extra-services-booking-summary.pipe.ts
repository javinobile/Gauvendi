import {Pipe, PipeTransform} from '@angular/core';
import {HotelAmenity, ReservationAmenityPricing} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'countExtraServicesBookingSummary',
  standalone: true
})
export class CountExtraServicesBookingSummaryPipe implements PipeTransform {
  transform(value: ReservationAmenityPricing[]): number {
    return value?.filter(item => !item.isSalesPlanIncluded)?.length || 0;
  }
}
