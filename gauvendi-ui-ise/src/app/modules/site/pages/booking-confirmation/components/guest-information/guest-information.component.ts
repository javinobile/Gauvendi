import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges
} from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { Country } from '@core/graphql/generated/graphql';

import { ReservationGuests } from '../../model/guest.model';

@Component({
  selector: 'app-guest-information',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './guest-information.component.html',
  styleUrls: ['./guest-information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuestInformationComponent implements OnInit, OnChanges {
  @Input() reservationGuestsList: ReservationGuests[];
  @Input() countries: Country[];

  formConfigs = signal([]);

  ngOnInit(): void {
    this.setFormConfigs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['booker'] || changes['countries']) {
      this.setFormConfigs();
    }
  }

  setFormConfigs(): void {
    const reservationGuestsList = this.reservationGuestsList;
    if (!reservationGuestsList?.length) {
      this.formConfigs.set([]);
      return;
    }

    const primaryGuest = reservationGuestsList?.[0]?.guestList?.[0];

    const address = primaryGuest?.address;
    const country = this.countries?.find(
      (x) => x.id === primaryGuest?.countryId
    )?.name;
    const city = primaryGuest?.city;
    const postalCode = primaryGuest?.postalCode;

    this.formConfigs.set([
      {
        label: 'FULL_NAME',
        value: `${primaryGuest?.firstName} ${primaryGuest?.lastName}`,
        class: 'col-span-2'
      },
      {
        label: 'EMAIL_ADDRESS',
        value: primaryGuest?.emailAddress,
        class: 'col-span-1 sm:col-span-2'
      },
      {
        label: 'PHONE_NUMBER',
        value: `(+${primaryGuest?.countryNumber}) ${primaryGuest?.phoneNumber}`,
        class: 'col-span-1 sm:col-span-2'
      },
      {
        label: 'ADDRESS',
        value: [address, city, postalCode, country]
          .filter((item) => item?.length > 0)
          .join(', ')
          .trim(),
        class: 'col-span-2'
      }
    ]);
  }
}
