import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from "@app/shared/pipes/translate.pipe";
import { Booking, Country } from "@core/graphql/generated/graphql";

@Component({
  selector: 'app-booking-company-info',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './booking-company-info.component.html',
  styleUrls: ['./booking-company-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingCompanyInfoComponent {
  bookingInfo = input<Booking>();
  countries = input<Country[]>();
  formConfigs = computed(() => this.setFormConfigs());

  setFormConfigs() {
    const booker = this.bookingInfo()?.reservationList?.[0]?.company;
    if (!booker) return [];

    const city = booker?.city ? ', ' + booker.city : '';
    const postalCode = booker?.postalCode ? ', ' + booker.postalCode : '';
    const country = booker?.country ? ', ' + this.countries()?.find((c) => c.id === booker.country)?.name : '';
    return [
      {
        label: 'COMPANY_NAME',
        value: booker.name,
        class: 'col-span-1 sm:col-span-2',
      },
      {
        label: 'TAX_ID',
        value: booker.taxId,
        class: 'col-span-1 sm:col-span-2',
      },
      {
        label: 'ADDRESS',
        value: `${booker.address || ''} ${city} ${postalCode} ${country}`.trim(),
        class: 'col-span-2',
      },
    ];
  }
}
