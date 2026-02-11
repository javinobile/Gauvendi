import {Pipe, PipeTransform} from '@angular/core';
import {Country} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getCountry',
  standalone: true
})
export class GetCountryPipe implements PipeTransform {

  transform(countryList: Country[], countryId: string): string {
    return countryList?.find(x => x?.id === countryId)?.name;
  }

}
