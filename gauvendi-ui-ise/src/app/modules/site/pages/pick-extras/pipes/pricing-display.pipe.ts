import { Pipe, PipeTransform } from '@angular/core';
import { ReservationPricing } from '@app/core/graphql/generated/graphql';

@Pipe({
  name: 'pricingDisplay',
  standalone: true
})
export class PricingDisplayPipe implements PipeTransform {
  transform(
    resPrice: ReservationPricing,
    isHotelTaxInclusive: boolean,
    isTaxDisplayInclusive: boolean,
    type: 'ACCOMMODATION' | 'AMENITY'
  ): number {
    switch (type) {
      case 'ACCOMMODATION':
        if (isHotelTaxInclusive === isTaxDisplayInclusive) {
          return resPrice?.totalAccommodationAmountBySetting;
        }
        if (isTaxDisplayInclusive) {
          // Tax Exclusive, Display Inclusive
          return (
            resPrice?.totalAccommodationAmountBySetting +
            resPrice?.accommodationTaxAmount +
            resPrice?.cityTaxAmount
          );
        } else {
          // Tax Inclusive, Display Exclusive
          return (
            resPrice?.totalAccommodationAmountBySetting -
            resPrice?.accommodationTaxAmount -
            resPrice?.cityTaxAmount
          );
        }
      case 'AMENITY':
        if (isTaxDisplayInclusive) {
          return resPrice?.amenityPricingList
            ?.filter((x) => !x?.isSalesPlanIncluded)
            ?.reduce((a, b) => {
              return a + b?.totalGrossAmount;
            }, 0);
        } else {
          return resPrice?.amenityPricingList
            ?.filter((x) => !x?.isSalesPlanIncluded)
            ?.reduce((a, b) => {
              return a + b?.totalBaseAmount;
            }, 0);
        }
    }
  }
}
