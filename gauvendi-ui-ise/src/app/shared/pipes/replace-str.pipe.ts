import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'replaceStr',
  standalone: true
})
export class ReplaceStrPipe implements PipeTransform {
  transform(originalVal: string, sourceVal: string, targetVal: string): string {
    return originalVal?.length > 0 && sourceVal?.length > 0 && targetVal?.length > 0
      ? originalVal?.replace(sourceVal, targetVal)
      : originalVal;
  }
}
