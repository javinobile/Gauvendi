import {Pipe, PipeTransform} from '@angular/core';
import {RatePlan} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'getCurrentRatePlan',
  standalone: true
})
export class GetCurrentRatePlanPipe implements PipeTransform {

  transform(value: RatePlan[], code: string): RatePlan {
    return value?.find(x => x?.code === code);
  }

}
