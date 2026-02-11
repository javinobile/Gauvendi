import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'currencyRate',
  standalone: true
})
export class CurrencyRatePipe implements PipeTransform {

  transform(value: any, rate: number): number {
    return !isNaN(value)
      ? +value * rate
      : null;
  }

}
