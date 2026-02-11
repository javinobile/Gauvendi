import { Pipe, PipeTransform } from '@angular/core';
import { HotelRetailCategory } from '@app/core/graphql/generated/graphql';

@Pipe({
  name: 'orderBySelectedFeatures',
  standalone: true
})
export class OrderBySelectedFeaturesPipe implements PipeTransform {
  transform(data: HotelRetailCategory[], selectedFeatures: string[]): any[] {
    if (!data?.length) return [];

    const newData = data
      .map((item) => {
        const totalSelectedfeatures = item?.hotelRetailFeatureList?.filter(
          (feat) => selectedFeatures.includes(feat?.code)
        )?.length;
        return {
          ...item,
          totalSelectedfeatures,
          displaySequence: item.displaySequence || 0
        };
      })
      .sort((a, b) => {
        if (a.totalSelectedfeatures === b.totalSelectedfeatures) {
          return (a.displaySequence || 0) - (b.displaySequence || 0);
        }
        return (b.totalSelectedfeatures || 0) - (a.totalSelectedfeatures || 0);
      });

    return newData;
  }
}
