import { Pipe, PipeTransform } from '@angular/core';
import {HotelRetailFeature} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'filterRetailFeatureSelected',
  standalone: true
})
export class FilterRetailFeatureSelectedPipe implements PipeTransform {

  transform(retailFeatureList: HotelRetailFeature[], selected: string[]): HotelRetailFeature[] {
    return retailFeatureList?.filter(item => selected?.includes(item.code));
  }

}
