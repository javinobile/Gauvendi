import {Pipe, PipeTransform} from '@angular/core';
import {HotelAgeCategory, ReservationAmenityAgeCategoryPricing} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getChildrenAge',
  standalone: true
})
export class GetChildrenAgePipe implements PipeTransform {

  transform(childrenAgeList: number[], ageGroup: ReservationAmenityAgeCategoryPricing, child: string, years: string): string {
    if (childrenAgeList) {
      const age = childrenAgeList.filter(x => x >= ageGroup?.fromAge && x < ageGroup?.toAge)?.map(y => `${y} ${years}`);
      return `${child} - ${age?.join(', ')}`;
    }
    return null;
  }

}
