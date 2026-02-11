import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'parseAdditionalGuestProposal',
  standalone: true
})
export class ParseAdditionalGuestProposalPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): {
    reservationId: string;
    guestList: { firstName: string; lastName: string; id: string }[]
  }[] {
    return value as { reservationId: string; guestList: { firstName: string; lastName: string; id: string }[] }[];
  }

}
