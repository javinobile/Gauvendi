import {inject, Pipe, PipeTransform} from '@angular/core';
import {HotelRetailCategory, HotelRetailFeature} from '@app/core/graphql/generated/graphql';
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {map, Observable, of} from "rxjs";

@Pipe({
  name: 'categoryHoveringMsg',
  standalone: true,
})
export class CategoryHoveringMsgPipe implements PipeTransform {
  translatePipe = inject(TranslatePipe);

  transform(category: HotelRetailCategory, featureList: HotelRetailFeature[]): Observable<string> {

    if (category && featureList?.length > 0) {
      const featureByCategory = featureList?.filter((feat) => feat?.hotelRetailCategory?.code === category?.code);
      if (featureByCategory?.length > 2) {
        return this.translatePipe.transform('CATEGORY_HOVERING_MESSAGE').pipe(
          map((translate) => {
            return translate?.replace('{{feature_name}}', featureByCategory?.slice(0, 2)?.map(x => x?.name)?.join(', '))
          })
        )
      } else if (featureByCategory?.length >= 1) {
        return this.translatePipe.transform('CATEGORY_HOVERING_MESSAGE').pipe(
          map((translate) => {
            return translate?.split('{{feature_name}}')[0] + featureByCategory?.slice(0, 2)?.map(x => x?.name)?.join(', ')
          })
        )
      }
    }

    return of(null);
  }
}
