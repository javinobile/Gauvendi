import {Pipe, PipeTransform} from '@angular/core';
import {HotelRetailFeature} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'maxFeaturesDisplay',
  standalone: true
})
export class MaxFeaturesDisplayPipe implements PipeTransform {

  transform(hotelRetailFeatures: HotelRetailFeature[]): number {
    if (hotelRetailFeatures?.length > 0) {
      const maxWidth = 60;
      let maxValue = 0;
      const result = [];
      hotelRetailFeatures?.forEach((item, index) => {
        result.push(item);
        if (result?.map(x => x?.name)?.join('&nbsp;|&nbsp;')?.length < maxWidth) {
          maxValue += 1;
        }
      });

      return maxValue;
    }

    return 0;
  }

}
