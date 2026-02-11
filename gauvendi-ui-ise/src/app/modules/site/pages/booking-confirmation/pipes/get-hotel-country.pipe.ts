import {Pipe, PipeTransform} from '@angular/core';
import {CountryTranslation} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getHotelCountry',
  standalone: true
})
export class GetHotelCountryPipe implements PipeTransform {

  transform(value: CountryTranslation[], locale: string): string {
    return value?.find(x => x?.languageCode?.toUpperCase() === locale?.toUpperCase())?.name;
  }

}
