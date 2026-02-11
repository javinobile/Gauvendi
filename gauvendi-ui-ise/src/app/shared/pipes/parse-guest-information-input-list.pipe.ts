import {Pipe, PipeTransform} from '@angular/core';
import {GuestInformationInput, GuestInput} from "@core/graphql/generated/graphql";

@Pipe({
  name: 'parseGuestInformationInputList',
  standalone: true
})
export class ParseGuestInformationInputListPipe implements PipeTransform {

  transform(value: { firstName: string, lastName: string }[], ...args: unknown[]): GuestInput[] {
    return value?.filter(x => x.firstName?.length || x.lastName?.length);
  }

}
