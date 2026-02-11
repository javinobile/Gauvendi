import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'calRenderedItems',
  standalone: true
})
export class CalculateRenderedItemsPipe implements PipeTransform {
  transform(
    itemsLength: number,
    bundleLength: number,
    limitNumber: number,
    isLoadedMore: boolean = false,
    isMatchedFlow: boolean
  ): number {
    const bundleCount = isMatchedFlow ? 0 : bundleLength;

    const max = isLoadedMore ? 30 : limitNumber;

    if (itemsLength < max) {
      const total = itemsLength + bundleCount;
      return total > max ? max - bundleCount : total;
    }

    return max - bundleCount;
  }
}
