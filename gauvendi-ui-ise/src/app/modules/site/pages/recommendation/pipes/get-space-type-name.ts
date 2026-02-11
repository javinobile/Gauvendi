import { Pipe, PipeTransform } from '@angular/core';
import { HotelRetailFeature } from '@app/core/graphql/generated/graphql';

@Pipe({
  name: 'getSpaceTypeName',
  standalone: true
})
export class GetSpaceTypeNamePipe implements PipeTransform {
  transform(code: string, items: HotelRetailFeature[]): string {
    if (!code) return '';

    let spaceTypeName = items
      ?.find((item) => item?.code === code)
      ?.name?.trim();

    return spaceTypeName ? `'${spaceTypeName}'` : '';
  }
}
