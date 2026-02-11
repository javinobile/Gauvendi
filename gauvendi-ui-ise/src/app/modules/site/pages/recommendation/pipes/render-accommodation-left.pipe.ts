import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'renderAccommodationLeft',
  standalone: true
})
export class RenderAccommodationLeftPipe implements PipeTransform {

  transform(value: number, textDisplay: string): string {
    return textDisplay?.replace('{{recommendation_count}}', value?.toString());
  }

}
