import {Pipe, PipeTransform} from '@angular/core';
import {HotelAmenity} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'countExtraServices',
  standalone: true
})
export class CountExtraServicesPipe implements PipeTransform {
  transform(value: HotelAmenity[], isIncluded: boolean = null, serviceIncluded: string[] = []): number {
    if (value === undefined || value === null || value?.length === 0) {
      return 0;
    }
    if (isIncluded === null) {
      return value?.length;
    }
    return value
      ?.filter(item => isIncluded
        ? serviceIncluded?.includes(item?.code)
        : !serviceIncluded?.includes(item?.code))
      ?.length;
  }
}
