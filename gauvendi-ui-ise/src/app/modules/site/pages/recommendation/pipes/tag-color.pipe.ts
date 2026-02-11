import {inject, Pipe, PipeTransform} from '@angular/core';
import { BookingFlow } from '@app/core/graphql/generated/graphql';
import {HotelConfigService} from "@app/services/hotel-config.service";

@Pipe({
  name: 'tagColor',
  standalone: true,
})
export class TagColorPipe implements PipeTransform {
  hotelConfigService = inject(HotelConfigService);
  transform(tag: BookingFlow): string {
    switch (tag) {
      case BookingFlow.LowestPrice:
        return this.hotelConfigService?.lowestBgColor$?.value || '#00A991';
      case BookingFlow.MostPopular:
        return this.hotelConfigService?.mostPopularBgColor$?.value || '#E11919';
      case BookingFlow.Recommended:
        return this.hotelConfigService?.ourTipBgColor$?.value || '#F9B619';
      default:
        break;
    }
    return null;
  }
}
