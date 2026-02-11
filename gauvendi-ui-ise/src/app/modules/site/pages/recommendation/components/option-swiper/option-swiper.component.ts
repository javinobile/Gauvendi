import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  input,
  ViewChild
} from '@angular/core';
import { ImageCustomComponent } from '@app/shared/components/image-custom/image-custom.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { SwiperOptions } from 'swiper';
import { SwiperComponent, SwiperModule } from 'swiper/angular';

@Component({
  selector: 'app-option-swiper',
  standalone: true,
  imports: [
    CommonModule,
    ImageCustomComponent,
    SwiperModule,
    CustomTooltipModule
  ],
  templateUrl: './option-swiper.component.html',
  styleUrls: ['./option-swiper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionSwiperComponent {
  @Input({ required: true }) imgUrls: string[];
  @Input() customClass = '';
  @Input() isStep2 = false;
  optionIconUrls = input<{ url: string; title: string }[]>([]);

  config: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 50,
    pagination: true,
    scrollbar: { draggable: true },
    effect: 'fade',
    loop: true
  };
  @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;
  slideNext() {
    this.swiper.swiperRef.slideNext(300);
  }
  slidePrev() {
    this.swiper.swiperRef.slidePrev(300);
  }
}
