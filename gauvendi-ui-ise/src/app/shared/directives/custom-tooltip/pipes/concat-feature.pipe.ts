import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'concatFeatures'
})
export class ConcatFeaturePipe implements PipeTransform
{
  transform(featureName: string, description: string): string {
    const featureNameContent = `<div class='text-[14px] font-medium leading-[120%] text-tooltip-color'>${featureName}</div>`;
    return description ? featureNameContent + `<div class='text-[14px] font-normal leading-[120%] text-tooltip-color mt-[4px]'>${description}</div>`
      : featureNameContent
  }
}
