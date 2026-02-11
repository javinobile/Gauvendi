import { Pipe, PipeTransform } from '@angular/core';
import { HotelCityTax } from '@app/core/graphql/generated/graphql';

@Pipe({
  name: 'getTaxName',
  standalone: true
})
export class GetTaxNamePipe implements PipeTransform {
  transform(
    tax: HotelCityTax,
    locale: string,
    hasTranslationList: boolean = true
  ): string {
    if (!locale || locale?.toLocaleLowerCase() === 'en') {
      return tax?.name;
    }
    if (hasTranslationList) {
      return tax?.translationList?.find((item) => item?.languageCode === locale)
        ?.name;
    }
    return tax?.name;
  }
}
