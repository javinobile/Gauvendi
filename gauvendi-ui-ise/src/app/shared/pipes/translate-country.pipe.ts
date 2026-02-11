import {Pipe, PipeTransform} from '@angular/core';
import {Country} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'translateCountry',
  standalone: true
})
export class TranslateCountryPipe implements PipeTransform {

  transform(country: Country, languageCode: string): string {
    if (!languageCode || languageCode?.toUpperCase() === 'EN') {
      return country?.name;
    } else {
      return country?.translationList?.length > 0
        ? country?.translationList?.find(x => x?.languageCode?.toUpperCase() === languageCode?.toUpperCase())?.name
        : country?.name;
    }
  }

}
