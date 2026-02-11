import {Pipe, PipeTransform} from '@angular/core';
import {RatePlan} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getRatePlanDescription',
  standalone: true
})
export class GetRatePlanDescriptionPipe implements PipeTransform {
  transform(value: RatePlan[], code: string): string {
    if (value?.length > 0) {
      const description = value.find(x => x?.code === code)?.description;
      // Remove all HTML tags using regex
      return description ? description.replace(/<[^>]*>/g, '') : '';
    }
    return '';
  }
}
