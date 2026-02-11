import { Pipe, PipeTransform } from '@angular/core';
import { HotelRetailFeature } from '@core/graphql/generated/graphql';

@Pipe({
  name: 'parseRankFeatureSelected',
  standalone: true,
  pure: true
})
export class ParseRankFeatureSelectedPipe implements PipeTransform {

  transform(value: HotelRetailFeature[], selected: string[]): HotelRetailFeature[] {
    return selected?.map(x => value?.find(y => y?.code === x));
  }

}
