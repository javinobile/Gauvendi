import {Pipe, PipeTransform} from '@angular/core';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {map, tap} from 'rxjs/operators';
import {selectorHotelRetailFeatureList} from "@store/hotel/hotel.selectors";
import {HotelRetailFeature} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'featureCountConfigurator',
  standalone: true
})
export class FeatureCountConfiguratorPipe implements PipeTransform
{
  constructor(
    private store: Store
  )
  {}

  transform(categoryCode: string, selectedCodes: string[], hotelRetailFeature: HotelRetailFeature[]): number {
    return hotelRetailFeature
      ?.filter(x => selectedCodes.includes(x?.code))
      ?.filter(x => x?.hotelRetailCategory?.code === categoryCode)?.length || null

  }

}
