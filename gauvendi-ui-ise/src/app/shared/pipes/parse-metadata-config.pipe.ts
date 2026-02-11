import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'parseMetadataConfig',
  standalone: true
})
export class ParseMetadataConfigPipe implements PipeTransform {

  transform(value: { [key: string]: string } | string, locale: string): unknown {
    if (typeof value === 'object') {
      let result = null;
      for (const key in value) {
        if (key?.toUpperCase() === locale?.toUpperCase()) {
          result = value[key];
          break;
        }
      }
      return result;
    } else {
      return value;
    }
  }

}
