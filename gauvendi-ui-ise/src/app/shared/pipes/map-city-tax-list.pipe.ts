import {Pipe, PipeTransform} from '@angular/core';
import {HotelCityTax} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'mapCityTaxList',
  standalone: true
})
export class MapCityTaxListPipe implements PipeTransform {

  transform(bookingCityTaxList: HotelCityTax[], cityTaxList: HotelCityTax[]): HotelCityTax[] {
    return bookingCityTaxList?.map(x => {
      const found = cityTaxList?.find(y => y?.id === x?.id);
      return {
        ...x,
        name: found?.name,
        description: found?.description
      };
    });
  }

}
