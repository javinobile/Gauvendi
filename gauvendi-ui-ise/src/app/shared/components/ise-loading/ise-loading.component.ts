import { ChangeDetectionStrategy, Component, inject, Input } from "@angular/core";
import Swiper, { Autoplay, SwiperOptions } from "swiper";
import { ImageCustomComponent } from "@app/shared/components/image-custom/image-custom.component";
import { AsyncPipe, CommonModule, NgForOf } from "@angular/common";
import { SwiperModule } from "swiper/angular";
import { FilterSvgDirective } from "@app/shared/directives/filter-svg.directive";
import { HotelConfigService } from "@app/services/hotel-config.service";
Swiper.use([Autoplay]);

@Component({
  selector: 'app-ise-loading',
  standalone: true,
  imports: [
    ImageCustomComponent,
    NgForOf,
    SwiperModule,
    FilterSvgDirective,
    AsyncPipe,
    CommonModule
  ],
  templateUrl: './ise-loading.component.html',
  styleUrl: './ise-loading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IseLoadingComponent {
  @Input() title: string;
  @Input() subTitle: string;
  @Input() customStyle: string = "min-h-[calc(100vh-90px-88px)] pt-[100px] flex justify-center items-center flex-col gap-4";
  hotelConfigService = inject(HotelConfigService)
  categoryDefaultText$ = this.hotelConfigService.categoryDefaultText$;
  config: SwiperOptions = {
    navigation: false,
    pagination: false,
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    autoplay: {
      delay: 750,
      disableOnInteraction: false,
    },

  };
  imgUrls = [
    'assets/icons/loading/loading-1.svg',
    'assets/icons/loading/loading-2.svg',
    'assets/icons/loading/loading-3.svg',
    'assets/icons/loading/loading-4.svg',
  ]
}
