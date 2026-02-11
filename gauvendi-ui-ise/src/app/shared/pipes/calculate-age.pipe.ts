import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'calculateAge',
  standalone: true
})
export class CalculateAgePipe implements PipeTransform
{
  transform(value: number, valDiff: number): string {
    if (value && valDiff) {
      const res = +value + valDiff;
      return res?.toString();
    }
    return value?.toString();
  }
}
