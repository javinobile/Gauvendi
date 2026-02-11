import { Pipe, PipeTransform } from '@angular/core';
import { HotelCityTax } from '@core/graphql/generated/graphql';

@Pipe({
  name: 'displayTaxInformation',
  standalone: true
})
export class DisplayTaxInformationPipe implements PipeTransform {
  transform(tax: HotelCityTax, locale: string): string {
    return (
      tax?.translationList?.find(
        (x) => x?.languageCode?.toUpperCase() === locale?.toUpperCase()
      )?.description || tax?.description
    );
  }
}
