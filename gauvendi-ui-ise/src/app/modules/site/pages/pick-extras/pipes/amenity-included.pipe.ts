import {Pipe, PipeTransform} from '@angular/core';
import {HotelAmenity} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'amenityIncluded',
  standalone: true
})
export class AmenityIncludedPipe implements PipeTransform {

  transform(amenityCode: string, includedHotelExtrasList: HotelAmenity[]): boolean {
    return includedHotelExtrasList?.some(x => x?.code === amenityCode);
  }

}
