import { Pipe, PipeTransform } from '@angular/core';
import { BookingFlow } from '@app/core/graphql/generated/graphql';

@Pipe({
  name: 'optionTag',
  standalone: true,
})
export class OptionTagPipe implements PipeTransform {
  transform(tag: BookingFlow): string {
    switch (tag) {
      case BookingFlow.LowestPrice:
        return 'LOWEST_PRICE';
      case BookingFlow.MostPopular:
        return 'MOST_POPULAR';
      case BookingFlow.Recommended:
        return 'RECOMMENDED';
      default:
        break;
    }
    return null;
  }
}
