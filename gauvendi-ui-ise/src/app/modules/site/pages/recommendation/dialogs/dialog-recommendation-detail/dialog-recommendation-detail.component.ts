import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { EPriceView, ICombinationOptionItem } from '@models/option-item.model';
import { EDisplayMode } from '@models/display-mode.model';
import { CombinationOptionItemComponent } from '@app/modules/site/pages/recommendation/components/combination-option-item/combination-option-item.component';
import { OptionItemComponent } from '@app/modules/site/pages/recommendation/components/option-item/option-item.component';

@Component({
  selector: 'app-dialog-recommendation-detail',
  standalone: true,
  imports: [
    CommonModule,
    CombinationOptionItemComponent,
    OptionItemComponent,
    MatDialogModule
  ],
  templateUrl: './dialog-recommendation-detail.component.html',
  styleUrls: ['./dialog-recommendation-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogRecommendationDetailComponent {
  dialogRef = inject(MatDialogRef<DialogRecommendationDetailComponent>);
  data: {
    itemSelected: ICombinationOptionItem;
    childrenFiltered: number;
    priceView: EPriceView;
    adultsFiltered: number;
    isLowestPriceOpaque: boolean;
    lowestPriceImageUrl: string;
    isMatchFlow: boolean;
  } = inject(MAT_DIALOG_DATA);
  protected readonly EDisplayMode = EDisplayMode;

  onSelectRatePlan(data: any): void {
    this.dialogRef.close(data);
  }
}
