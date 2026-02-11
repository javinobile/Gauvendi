import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'getChildrenAgeIncluded',
  standalone: true
})
export class GetChildrenAgeIncludedPipe implements PipeTransform {

  transform(childrenAgeList: number[], years: string, child: string): string {
    if (childrenAgeList?.length > 0) {
      const age = childrenAgeList?.map(x => `${x} ${years}`);
      return `${child} - ${age?.join(', ')}`;
    }
    return null;
  }

}
