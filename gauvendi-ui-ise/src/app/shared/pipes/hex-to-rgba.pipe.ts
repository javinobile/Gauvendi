import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'hexToRgba',
  standalone: true
})
export class HexToRgbaPipe implements PipeTransform {

  transform(hex: string, opacity: number): string {
    const result = this.hexToRgb(hex);
    return `rgba(${result?.join(',')}, ${opacity})`;
  }

  private hexToRgb(hex: string): number[] {
    return hex?.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
      , (m, r, g, b) => '#' + r + r + g + g + b + b)
      .substring(1).match(/.{2}/g)
      .map(x => parseInt(x, 16));
  }

}
