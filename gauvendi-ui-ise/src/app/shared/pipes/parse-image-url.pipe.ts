import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'parseImageUrl',
  standalone: true
})
export class ParseImageUrlPipe implements PipeTransform {

  transform(url: string): string {
    return url?.length > 0 ? `url('${url}')` : null;
  }

}
