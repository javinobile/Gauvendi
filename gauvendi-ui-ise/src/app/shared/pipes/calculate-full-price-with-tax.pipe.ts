import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'calculateFullPriceWithTax',
  standalone: true,
})
export class CalculateFullPriceWithTaxPipe implements PipeTransform {
  transform(totalGrossAmount: number, totalBaseAmount: number, includedTax: boolean = null): number {
    return includedTax ? totalGrossAmount : totalBaseAmount;
  }
}
