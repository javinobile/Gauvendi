import { Pipe, PipeTransform } from '@angular/core';
import { HotelAmenity, HotelAmenityIsePricingDisplayMode } from '@core/graphql/generated/graphql';
import { AmenityCodeEnum } from '@app/constants/extras.const';

@Pipe({
  name: 'sortByMandatory',
  standalone: true,
  pure: true
})
export class SortByMandatoryPipe implements PipeTransform {
  transform(amenities: HotelAmenity[], mandatoryServiceIdList: string[], surchargeAmenityList?: HotelAmenity[], includedHotelExtrasList?: HotelAmenity[]): HotelAmenity[] {
    if (!amenities) {
      return amenities;
    }

    const petSurchargeAmenity = surchargeAmenityList?.find(
      (item) => item.code === AmenityCodeEnum.PET_SURCHARGE
    );

    const isPetSurchargeExcluded = petSurchargeAmenity?.isePricingDisplayMode === HotelAmenityIsePricingDisplayMode.Excluded;

    return [...amenities].sort((a, b) => {
      const isAMandatory = mandatoryServiceIdList?.includes(a.id) || (a.code === AmenityCodeEnum.PET_SURCHARGE && isPetSurchargeExcluded);
      const isBMandatory = mandatoryServiceIdList?.includes(b.id) || (b.code === AmenityCodeEnum.PET_SURCHARGE && isPetSurchargeExcluded);
      const isAIncluded = includedHotelExtrasList?.some(x => x?.code === a.code);
      const isBIncluded = includedHotelExtrasList?.some(x => x?.code === b.code);

      // If one is both mandatory and included, and the other isn't, prioritize the one that is both
      if ((isAMandatory && isAIncluded) && !(isBMandatory && isBIncluded)) {
        return -1;
      }
      if (!(isAMandatory && isAIncluded) && (isBMandatory && isBIncluded)) {
        return 1;
      }

      // If one is mandatory and the other isn't, prioritize the mandatory one
      if (isAMandatory && !isBMandatory) {
        return -1;
      }
      if (!isAMandatory && isBMandatory) {
        return 1;
      }

      // If one is included and the other isn't, prioritize the included one
      if (isAIncluded && !isBIncluded) {
        return -1;
      }
      if (!isAIncluded && isBIncluded) {
        return 1;
      }

      return 0;
    });
  }
} 