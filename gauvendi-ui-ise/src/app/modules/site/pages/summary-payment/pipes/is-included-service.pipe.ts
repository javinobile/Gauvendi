import { AsyncPipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { selectorSurchargeAmenityList } from '@app/store/pick-extras/pick-extras.selectors';
import { AmenityCodeEnum } from '@app/constants/extras.const';
import {
  HotelAmenityIsePricingDisplayMode,
  ReservationPricing
} from '@core/graphql/generated/graphql';
import { Store } from '@ngrx/store';

@Pipe({
  name: 'isIncludedService',
  standalone: true
})
export class IsIncludedServicePipe implements PipeTransform {
  private store = inject(Store);
  private asyncPipe = inject(AsyncPipe);

  transform(
    value: ReservationPricing,
    serviceCode: string,
    isSalesPlanIncluded = false
  ): boolean {
    if (serviceCode !== AmenityCodeEnum.PET_SURCHARGE) {
      return (
        value?.roomProductSalesPlan?.ratePlan?.includedHotelExtrasList?.some(
          (x) => x?.code === serviceCode
        ) || isSalesPlanIncluded
      );
    }

    const petSurchargeAmenity = this.asyncPipe
      .transform(this.store.select(selectorSurchargeAmenityList))
      ?.find((x) => x?.code === AmenityCodeEnum.PET_SURCHARGE);

    if (
      petSurchargeAmenity?.isePricingDisplayMode ===
      HotelAmenityIsePricingDisplayMode.Excluded
    ) {
      return false;
    }

    return true;
  }
}
