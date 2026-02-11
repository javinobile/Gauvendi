import { Pipe, PipeTransform } from '@angular/core';
import { IBundleItem, ICombinationOptionItem } from '@app/models/option-item.model';

@Pipe({
  name: 'filterMatchItems',
  standalone: true,
})
export class FilterMatchItemsPipe implements PipeTransform {
  transform(items: ICombinationOptionItem[], match: boolean, bundleItems?: IBundleItem[]): ICombinationOptionItem[] {
    if (bundleItems?.length > 0) {
      items = [...items, ...bundleItems?.flatMap(bundle => bundle?.items || [])];
    }
    return items?.filter((i) => (match ? i?.matched : !i?.matched));
  }
}
