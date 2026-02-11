import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GetCountryPipe } from '@app/shared/pipes/get-country.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { Country, Guest } from '@core/graphql/generated/graphql';

@Component({
  selector: 'app-booker-review',
  standalone: true,
  imports: [CommonModule, TranslatePipe, GetCountryPipe],
  templateUrl: './booker-review.component.html',
  styleUrls: ['./booker-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookerReviewComponent {
  @Input() booker: Guest;
  @Input() countries: Country[];
}
