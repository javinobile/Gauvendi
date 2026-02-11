import { AsyncPipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { AmenityCodeEnum } from '@app/constants/extras.const';
import { selectorSurchargeAmenityList } from '@app/store/pick-extras/pick-extras.selectors';
import {
  HotelAmenityIsePricingDisplayMode,
  ReservationAmenityPricing
} from '@core/graphql/generated/graphql';
import { Store } from '@ngrx/store';

@Pipe({
  name: 'totalAmenity',
  standalone: true
})
export class TotalAmenityPipe implements PipeTransform {
  private store = inject(Store);
  private asyncPipe = inject(AsyncPipe);

  transform(value: ReservationAmenityPricing[]): number {
    const petSurchargeAmenity = this.asyncPipe
      .transform(this.store.select(selectorSurchargeAmenityList))
      ?.find((x) => x?.code === AmenityCodeEnum.PET_SURCHARGE);

    if (!petSurchargeAmenity) {
      return value
        ?.filter((x) => !x?.isSalesPlanIncluded)
        ?.reduce((acc, cur) => {
          return acc + cur?.totalSellingRate;
        }, 0);
    }

    const newValue = value?.filter(
      (x) =>
        !x?.isSalesPlanIncluded ||
        (x?.hotelAmenity?.code === AmenityCodeEnum.PET_SURCHARGE &&
          petSurchargeAmenity.isePricingDisplayMode ===
            HotelAmenityIsePricingDisplayMode.Excluded)
    );

    return newValue?.reduce((acc, cur) => {
      return acc + cur?.totalSellingRate;
    }, 0);
  }
}
