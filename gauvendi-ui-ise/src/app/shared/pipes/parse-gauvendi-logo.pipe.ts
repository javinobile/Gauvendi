import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'parseGauvendiLogo',
  standalone: true
})
export class ParseGauvendiLogoPipe implements PipeTransform {

  transform(value: string): string {
    switch (value?.toUpperCase()) {
      case 'BLACK':
        return 'assets/Black_logo.svg';
      case 'WHITE':
        return 'assets/White_logo.svg';

      default:
        return 'assets/Original_logo.svg';
    }
  }

}
