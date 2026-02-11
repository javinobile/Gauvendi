import { TitleCasePipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { IRoomSummary } from '@app/models/common.model';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'renderIndicatePrice',
  standalone: true
})
export class RenderIndicatePricePipe implements PipeTransform {
  private bookingTransactionService = inject(BookingTransactionService);
  private translatePipe = inject(TranslatePipe);

  transform(locale: string, traveler: string): Observable<string> {
    const travelerList =
      this.bookingTransactionService.getRoomRequestListFromString(traveler) ||
      [];

    const roomSummary = travelerList.reduce(
      (acc: any, curr) => {
        acc.totalRoom = travelerList.length;
        acc.adults += curr.adult || 0;
        acc.children += curr.childrenAgeList?.length || 0;
        acc.pets += curr.pets || 0;
        return acc;
      },
      { totalRoom: 0, adults: 0, children: 0, pets: 0 }
    ) as IRoomSummary;

    return combineLatest([
      this.translatePipe.transform('PRICE_FOR'),
      this.translatePipe.transform('UNITS'),
      this.translatePipe.transform('UNIT'),
      this.translatePipe.transform('ADULTS'),
      this.translatePipe.transform('ADULT'),
      this.translatePipe.transform('CHILDREN'),
      this.translatePipe.transform('CHILD'),
      this.translatePipe.transform('PETS'),
      this.translatePipe.transform('PET'),
      this.translatePipe.transform('PER_NIGHT')
    ]).pipe(
      map(
        ([
          priceForText,
          unitsText,
          unitText,
          adultsText,
          adultText,
          childrenText,
          childText,
          petsText,
          petText,
          perNightText
        ]) => {
          const capitalizeFirstPipe = new TitleCasePipe();
          return [
            priceForText,
            capitalizeFirstPipe.transform(unitsText),
            capitalizeFirstPipe.transform(unitText),
            capitalizeFirstPipe.transform(adultsText),
            capitalizeFirstPipe.transform(adultText),
            capitalizeFirstPipe.transform(childrenText),
            capitalizeFirstPipe.transform(childText),
            capitalizeFirstPipe.transform(petsText),
            capitalizeFirstPipe.transform(petText),
            capitalizeFirstPipe.transform(perNightText)
          ];
        }
      ),
      map(
        ([
          priceForText,
          unitsText,
          unitText,
          adultsText,
          adultText,
          childrenText,
          childText,
          petsText,
          petText,
          perNightText
        ]) => {
          const newUnitText = `${roomSummary?.totalRoom || 1} ${roomSummary?.totalRoom > 1 ? unitsText : unitText}, `;
          const newAdultText = `${roomSummary?.adults} ${roomSummary?.adults > 1 ? adultsText : adultText}, `;
          const newChildrenText = `${roomSummary?.children ? roomSummary?.children + ' ' + (roomSummary?.children > 1 ? childrenText : childText) + ', ' : ''}`;
          const newPetsText = `${roomSummary?.pets ? roomSummary?.pets + ' ' + (roomSummary?.pets > 1 ? petsText : petText) + ', ' : ''}`;

          return `${priceForText} ${newUnitText + newAdultText + newChildrenText + newPetsText}${perNightText}`;
        }
      ),
      map((msg) => msg.charAt(0).toUpperCase() + msg.slice(1))
    );
  }

  renderAgeGroup(childrenAgeList: number[], years: string): string[] {
    return childrenAgeList?.map((x) => `${x} ${years}`);
  }
}
