import {Pipe, PipeTransform} from '@angular/core';
import {HotelRetailFeature} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'featureDescription',
  standalone: true
})
export class FeatureDescriptionPipe implements PipeTransform {
  transform(featureList: HotelRetailFeature[], featureCode: string): string {
    if (featureList?.length > 0 && featureCode) {
      return featureList?.find(x => x?.code === featureCode)?.description;
    }
    return null;
  }
}
