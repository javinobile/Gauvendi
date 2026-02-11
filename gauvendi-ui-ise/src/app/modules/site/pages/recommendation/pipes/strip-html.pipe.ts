import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'stripHtml',
  standalone: true
})
export class StripHtmlPipe implements PipeTransform
{

  transform(value: string): string {
    if (value)
    {
      const tmp = document.createElement('div');
      tmp.innerHTML = value;
      return tmp.textContent || tmp.innerText || '';
    }
    return '';
  }

}
