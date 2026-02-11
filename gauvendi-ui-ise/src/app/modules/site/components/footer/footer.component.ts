import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ParseMetadataConfigPipe } from '@app/shared/pipes/parse-metadata-config.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { Country } from '@core/graphql/generated/graphql';
import { DropdownItem } from '@models/dropdown-item.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ParseMetadataConfigPipe],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  @Input() address: string;
  @Input() addressDisplay: string;
  @Input() city: string;
  @Input() country: Country;
  @Input() hotelImpressum: string;
  @Input() hotelName: string;
  @Input() iconSymbolUrl: string;
  @Input() isWhitelabel: boolean = false;
  @Input() lang: DropdownItem;
  @Input() phoneNumber: string;
  @Input() postalCode: string;
  @Input() privacy: string;
  @Input() state: string;
  @Input() termOfUse: string;
}
