import {Pipe, PipeTransform} from '@angular/core';
import {HotelCityTax} from "@core/graphql/generated/graphql";


@Pipe({
  name: 'getTaxInformation',
  standalone: true
})
export class GetTaxInformationPipe implements PipeTransform {

  transform(tax: HotelCityTax, locale: string): unknown {
    return tax?.translationList?.find(x => x?.languageCode?.toUpperCase() === locale?.toUpperCase())?.description || tax?.description;
  }

}
