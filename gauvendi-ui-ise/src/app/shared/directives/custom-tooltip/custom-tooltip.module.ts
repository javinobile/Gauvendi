import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { CustomTooltipComponent } from './custom-tooltip.component';
import { CustomTooltipDirective } from './custom-tooltip.directive';
import { ConcatFeaturePipe } from './pipes/concat-feature.pipe';
import { ConcatTooltipPipe } from './pipes/concat-tooltip.pipe';
import { TooltipSearchChangedComponent } from './tooltip-search-changed.component';

@NgModule({
  declarations: [
    ConcatFeaturePipe,
    ConcatTooltipPipe,
    CustomTooltipComponent,
    CustomTooltipDirective,
    TooltipSearchChangedComponent
  ],
  imports: [CommonModule, MatIconModule, TranslatePipe],
  exports: [ConcatTooltipPipe, CustomTooltipDirective, ConcatFeaturePipe]
})
export class CustomTooltipModule {}
