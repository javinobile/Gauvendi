import { Pipe, PipeTransform } from '@angular/core';
import { ICombinationOptionItem } from '@app/models/option-item.model';

@Pipe({
  name: 'filterPromotionItems',
  standalone: true,
})
export class FilterPromotionItemsPipe implements PipeTransform {
  transform(combinationItems: ICombinationOptionItem[], isPromo: boolean): ICombinationOptionItem[] {
    if(isPromo) {
     return combinationItems?.filter(combinationItem => (combinationItem?.items?.[0]?.baseOption?.availableRfcRatePlanList?.length > 0 ? combinationItem?.items?.[0]?.baseOption?.availableRfcRatePlanList: combinationItem?.items?.[0]?.baseOption?.unavailableRfcRatePlanList)?.some(x => x?.ratePlan?.IsPromoted))
    }
    return combinationItems?.filter(combinationItem => !(combinationItem?.items?.[0]?.baseOption?.availableRfcRatePlanList?.length > 0 ? combinationItem?.items?.[0]?.baseOption?.availableRfcRatePlanList: combinationItem?.items?.[0]?.baseOption?.unavailableRfcRatePlanList)?.some(x => x?.ratePlan?.IsPromoted))
  }
}
