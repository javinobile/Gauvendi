import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getTaxInformationConfigByLocale',
  standalone: true
})
export class GetTaxInformationConfigByLocalePipe implements PipeTransform {
  transform(value: { [key: string]: string }, locale: string): string {
    let result = null;
    for (const key in value) {
      if (key?.toUpperCase() === locale?.toUpperCase()) {
        result = value[key];
        break;
      }
    }
    return result;
  }
}
