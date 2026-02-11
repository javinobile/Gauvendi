import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriceRangeFilterDirective } from './price-range-filter.directive';



@NgModule({
  declarations: [
    PriceRangeFilterDirective
  ],
  exports: [
    PriceRangeFilterDirective
  ],
  imports: [
    CommonModule
  ]
})
export class PriceRangeFilterModule { }
