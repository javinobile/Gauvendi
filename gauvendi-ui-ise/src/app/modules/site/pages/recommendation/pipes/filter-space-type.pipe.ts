import { Pipe, PipeTransform } from '@angular/core';
import { ICombinationOptionItem } from '@app/models/option-item.model';

@Pipe({
  name: 'filterSpaceTypeItems',
  standalone: true
})
export class FilterSpaceTypeItemsPipe implements PipeTransform {
  transform(
    combinationItems: ICombinationOptionItem[],
    isFiltering: boolean,
    isMatched: boolean
  ): ICombinationOptionItem[] {
    if (!isFiltering) return isMatched ? combinationItems : [];

    return combinationItems?.filter((combinationItem) =>
      isMatched
        ? combinationItem?.isSpaceTypeSearchMatched
        : !combinationItem?.isSpaceTypeSearchMatched
    );
  }
}
