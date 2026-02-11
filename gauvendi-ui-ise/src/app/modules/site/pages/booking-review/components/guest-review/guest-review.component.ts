import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GetCountryPipe } from '@app/shared/pipes/get-country.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { Country, Guest } from '@core/graphql/generated/graphql';

@Component({
  selector: 'app-guest-review',
  standalone: true,
  imports: [CommonModule, GetCountryPipe, TranslatePipe],
  templateUrl: './guest-review.component.html',
  styleUrls: ['./guest-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuestReviewComponent {
  @Input() additionalGuest: Guest[];
  @Input() mainGuestInfo: Guest;
  @Input() countries: Country[];
}
