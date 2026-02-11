import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { TranslatePipe } from "@app/shared/pipes/translate.pipe";
import { Country, Guest } from "@core/graphql/generated/graphql";

@Component({
  selector: 'app-booker-information',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './booker-information.component.html',
  styleUrls: ['./booker-information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookerInformationComponent implements OnInit, OnChanges {
  @Input() booker: Guest;
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
    const address = this.booker?.address;
    const city = this.booker?.city;
    const postalCode = this.booker?.postalCode;
    const country = this.countries?.find(x => x.id === this.booker?.countryId)?.name;

    this.formConfigs.set([
      {
        label: 'FULL_NAME',
        value: `${this.booker?.firstName} ${this.booker?.lastName}`,
        class: 'col-span-2',
      },
      {
        label: 'EMAIL_ADDRESS',
        value: this.booker?.emailAddress,
        class: 'col-span-1 sm:col-span-2',
      },
      {
        label: 'PHONE_NUMBER',
        value: `(+${this.booker?.countryNumber}) ${this.booker?.phoneNumber}`,
        class: 'col-span-1 sm:col-span-2',
      },
      {
        label: 'ADDRESS',
        value: [address, city, postalCode, country]
          .filter((item) => item?.length > 0)
          .join(', ')
          .trim(),
        class: 'col-span-2',
      },
    ]);
  }
}
