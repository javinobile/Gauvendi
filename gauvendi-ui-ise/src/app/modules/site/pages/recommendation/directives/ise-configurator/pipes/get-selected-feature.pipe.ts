import {Pipe, PipeTransform} from '@angular/core';
import {HotelRetailFeature} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getSelectedFeature',
  standalone: true
})
export class GetSelectedFeaturePipe implements PipeTransform
{
  transform(code: string, selectedCodes: string[]): boolean {
      return selectedCodes?.includes(code);
  }

}
