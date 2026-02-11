import { Pipe, PipeTransform } from '@angular/core';
import { AmenityCodeEnum } from '@app/constants/extras.const';
import { PricingUnitEnum } from '@core/graphql/generated/graphql';

@Pipe({
  name: 'parsePricingModel',
  standalone: true
})
export class ParsePricingModelPipe implements PipeTransform {
  transform(value: string, code: string): string {
    switch (value) {
      case PricingUnitEnum.Night:
        return 'PER_NIGHT';
      case PricingUnitEnum.Room:
        return 'PER_ROOM';
      case PricingUnitEnum.Person:
        if (code === AmenityCodeEnum.PET_SURCHARGE) {
          return 'PER_PET_PER_NIGHT';
        }
        return 'PER_PERSON_PER_NIGHT';
      case PricingUnitEnum.Item:
        return 'PER_ITEM';
      case PricingUnitEnum.PerPersonPerRoom:
        if (code === AmenityCodeEnum.PET_SURCHARGE) {
          return 'PER_PET_PER_STAY';
        }
        return 'PER_PERSON';
      default:
        return '';
    }
  }
}
