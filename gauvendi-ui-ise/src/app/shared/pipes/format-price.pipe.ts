import {Pipe, PipeTransform} from '@angular/core';
import {DecimalPipe} from "@angular/common";

@Pipe({
  name: 'formatPrice',
  standalone: true,
})
export class FormatPricePipe implements PipeTransform {

  constructor(private decimalPipe: DecimalPipe) {
  }

  transform(value: number): string {
    if (!value) {
      return null;
    }

    if (value >= 1000000) {
      return this.decimalPipe.transform((value / 1000000), '1.0') + 'M';
    }

    return this.decimalPipe.transform(value, '1.0');
  }

}
