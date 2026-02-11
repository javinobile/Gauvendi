import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'concatTooltip'
})
export class ConcatTooltipPipe implements PipeTransform
{
  transform(firstLine: string, concatBy = '\n', ...otherLines: string[]): string {
    let result = firstLine?.trim() || '';
    result += concatBy;
    otherLines?.forEach((line, index) => {
      result += line?.trim() || '';
      if (index < otherLines?.length - 1)
      {
        result += concatBy;
      }
    });
    return result;
  }
}
