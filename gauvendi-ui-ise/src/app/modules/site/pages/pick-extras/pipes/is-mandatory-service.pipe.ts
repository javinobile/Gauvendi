import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isMandatoryService',
  standalone: true
})
export class IsMandatoryServicePipe implements PipeTransform {
  transform(serviceId: string, mandatoryServiceIdList: string[]): boolean {
    return mandatoryServiceIdList?.includes(serviceId);
  }
}
