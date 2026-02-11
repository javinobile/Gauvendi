import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'parseAdditionalValue',
  standalone: true
})
export class ParseAdditionalGuestPipe implements PipeTransform {
  transform(
    additionalGuests: any[]
  ): { firstName: string; lastName: string; isAdult: boolean; reservationIdx: number }[] {
    const result = additionalGuests?.flatMap((res, index) =>
      res?.guestList
        ?.filter((_guest, guestIdx) => !(index === 0 && guestIdx === 0))
        ?.map(({ firstName, lastName, isAdult }) => ({
          firstName,
          lastName,
          isAdult,
          reservationIdx: index
        }))
    );
    return result;
  }
}
