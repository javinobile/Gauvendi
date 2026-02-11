import {Pipe, PipeTransform} from '@angular/core';
import {HotelRetailFeature} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'featureIcon',
  standalone: true
})
export class FeatureIconPipe implements PipeTransform {
  transform(featureList: HotelRetailFeature[], featureCode: string): string {
    if (featureList?.length > 0 && featureCode) {
      return featureList?.find(x => x?.code === featureCode)?.retailFeatureImageList[0]?.imageUrl;
    }
    return null;
  }
}
