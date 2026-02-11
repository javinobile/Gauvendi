import { Pipe, PipeTransform } from '@angular/core';
import { BookingFlow } from '@app/core/graphql/generated/graphql';

@Pipe({
  name: 'optionIcon',
  standalone: true,
})
export class OptionIconPipe implements PipeTransform {
  transform(tag: BookingFlow): string {
    switch (tag) {
      case BookingFlow.LowestPrice:
        return 'assets/icons/price-tag.svg';
      case BookingFlow.MostPopular:
        return 'assets/icons/fire.svg';
      case BookingFlow.Recommended:
        return 'assets/icons/star-outline.svg';
      default:
        break;
    }
    return null;
  }
}
