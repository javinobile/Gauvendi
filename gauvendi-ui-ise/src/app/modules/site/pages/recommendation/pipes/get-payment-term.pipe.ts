import {Pipe, PipeTransform} from '@angular/core';
import { RatePlan } from '@app/core/graphql/generated/graphql';

@Pipe({
  name: 'getPaymentTerm',
  standalone: true
})
export class GetPaymentTermPipe implements PipeTransform
{

  transform(value: RatePlan[], code: string, field = 'description'): string {
    if (value?.length > 0)
    {
      return value.find(x => x?.code === code)?.strongestPaymentTerms?.[field];
    }
    return '';
  }

}
