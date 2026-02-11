import {Pipe, PipeTransform} from '@angular/core';
import {RfcRatePlan} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'checkOptionPromoted',
  standalone: true
})
export class CheckOptionPromotedPipe implements PipeTransform {

  transform(value: RfcRatePlan[], ...args: unknown[]): boolean {
    return value?.length > 0 ? value?.some(x => x?.ratePlan?.IsPromoted) : false;
  }

}
