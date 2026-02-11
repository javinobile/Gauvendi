import {Pipe, PipeTransform} from '@angular/core';
import {HotelAmenity} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getAmenityIconUrl',
  standalone: true
})
export class GetAmenityIconUrlPipe implements PipeTransform {

  transform(availableAmenityList: HotelAmenity[], amenityList: HotelAmenity[]): HotelAmenity[] {
    const amenityCode = amenityList?.map(x => x?.code);
    return availableAmenityList?.filter(x => amenityCode?.includes(x?.code));
  }

}
