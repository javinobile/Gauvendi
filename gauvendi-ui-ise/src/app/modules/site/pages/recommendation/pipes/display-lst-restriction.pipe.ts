import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'displayLstRestriction',
  standalone: true
})
export class DisplayLstRestrictionPipe implements PipeTransform {

  transform(value: string, numberOfNight: number): string {
    return value?.replace('{{number_of_night}}', numberOfNight?.toString());
  }

}
