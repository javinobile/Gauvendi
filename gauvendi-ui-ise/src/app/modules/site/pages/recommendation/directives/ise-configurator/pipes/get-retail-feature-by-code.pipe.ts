import {Pipe, PipeTransform} from '@angular/core';
import {HotelRetailFeature} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'featureByCategoryCode',
  standalone: true
})
export class FeatureByCategoryCodePipe implements PipeTransform {

  transform(retailFeatureList: HotelRetailFeature[], categoryCode: string): HotelRetailFeature[] {
    return retailFeatureList?.filter(x => x?.hotelRetailCategory?.code === categoryCode);
  }
}
