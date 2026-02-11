import { Pipe, PipeTransform } from '@angular/core';
import { SpaceTypeEnum } from '@app/constants/space-type.const';

@Pipe({
  name: 'getSpaceTypeUrl',
  standalone: true
})
export class GetSpaceTypeUrlPipe implements PipeTransform {
  transform(code: string): string {
    const fallbackIcon = 'assets/measurement-units/bedroom.svg';
    if (!code) return fallbackIcon;

    const measurementUnitIconName = SpaceTypeEnum[code];
    if (!measurementUnitIconName) return fallbackIcon;

    return `assets/measurement-units/${measurementUnitIconName}.svg`;
  }
}
