import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  input,
  Input,
  Output
} from '@angular/core';
import { HotelRetailFeature } from '@app/core/graphql/generated/graphql';
import { CommonModule } from '@angular/common';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { SwiperOptions } from 'swiper';
import { SwiperModule } from 'swiper/angular';
import { HotelConfigService } from '@app/services/hotel-config.service';

@Component({
  selector: 'app-space-type-mobile',
  standalone: true,
  imports: [CommonModule, FilterSvgDirective, SwiperModule],
  templateUrl: './space-type-mobile.component.html',
  styles: `
    ::ng-deep .space-type-mobile {
      .swiper-wrapper {
        display: flex;
      }
      .swiper-slide {
        width: auto !important;
        flex-shrink: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpaceTypeMobileComponent {
  private readonly hotelConfigService = inject(HotelConfigService);

  spaceTypeList = input<HotelRetailFeature[]>();
  selectedSpaceType = input<string>();
  @Output() selectSpaceType = new EventEmitter<string>();

  themeColors$ = this.hotelConfigService.themeColors$;

  config: SwiperOptions = {
    slidesPerView: 'auto',
    spaceBetween: 8,
    breakpoints: {
      768: {
        spaceBetween: 12
      }
    }
  };
}
