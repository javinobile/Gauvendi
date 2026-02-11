import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'parseRankFeatureName',
  standalone: true
})
export class ParseRankFeatureNamePipe implements PipeTransform {

  transform(value: any): string {
    return value?.map(x => x?.name)?.join(', ');
  }

}
