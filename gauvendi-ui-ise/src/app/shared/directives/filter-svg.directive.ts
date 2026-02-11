import {Directive, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import {HotelConfigService} from "@app/services/hotel-config.service";
import {FilterGenerator} from "@utils/filter-generator.util";

@Directive({
  selector: '[appFilterSvg]',
  standalone: true
})
export class FilterSvgDirective implements OnChanges {

  @Input() color: string;

  constructor(
    private el: ElementRef,
    private readonly hotelConfig: HotelConfigService
  ) {
  }

  ngOnChanges({color}: SimpleChanges): void {
    if (color && this.color) {
      if (this.hotelConfig.filterMap?.has(this.color)) {
        // this.el.nativeElement.style.filter = this.hotelConfig.filterMap?.get(this.color);
        this.el.nativeElement.setAttribute(
          'style',
          `filter: ${this.hotelConfig.filterMap?.get(this.color)}; -webkit-filter: ${this.hotelConfig.filterMap?.get(this.color)}`
        );
      } else {
        const colorFiltered = FilterGenerator.generateFilter(this.color);
        // this.el.nativeElement.style.filter = colorFiltered;
        this.el.nativeElement.setAttribute(
          'style',
          `filter: ${colorFiltered}; -webkit-filter: ${colorFiltered}`
        );
        this.hotelConfig.filterMap.set(this.color, colorFiltered);
      }
    }
  }
}
