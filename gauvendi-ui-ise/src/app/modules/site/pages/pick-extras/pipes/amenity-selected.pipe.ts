import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'amenitySelected',
  standalone: true
})
export class AmenitySelectedPipe implements PipeTransform {

  transform(amenityCode: string, serviceChain: string): number {
    const serviceList: string[] = serviceChain?.split(',');
    const item = serviceList?.find((x, idx) => {
      const serviceCode = x.split('-');
      return serviceCode.shift() === amenityCode;
    });

    return item ? +item?.split('-')?.[1] : null;
  }

}
