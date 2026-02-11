import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'renderCombinationTitle',
  standalone: true
})
export class RenderCombinationTitlePipe implements PipeTransform {

  transform(value: string, textDisplay: string): string {
    return textDisplay?.replace('{{number_of_rooms}}', value);
  }

}
