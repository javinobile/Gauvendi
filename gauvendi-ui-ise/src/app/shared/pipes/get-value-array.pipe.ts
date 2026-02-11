import { Pipe, PipeTransform } from '@angular/core';
import { get } from 'lodash';
@Pipe({
  name: 'getValueArray',
  standalone: true
})
export class GetValueArrayPipe implements PipeTransform {
  transform(value: any[], filterKey: string, filterValue: string, valueKey: string): string {
    const item = value?.find(item => get(item, filterKey) === filterValue);
    if (!item) return '';

    return get(item, valueKey) || '';
  }
}
