import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Inject
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { OptionSwiperComponent } from '@app/modules/site/pages/recommendation/components/option-swiper/option-swiper.component';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { shareReplay } from 'rxjs';

@Component({
  selector: 'app-image-zoomable',
  standalone: true,
  templateUrl: './image-zoomable.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FilterSvgDirective,
    MatDialogModule,
    MatIconModule,
    OptionSwiperComponent
  ]
})
export class ImageZoomableComponent {
  private commonService = inject(CommonService);

  buttonTextColor$ = this.configService.buttonTextColor$.pipe(shareReplay());
  buttonBgColor$ = this.configService.buttonBgColor$.pipe(shareReplay());
  isMobile$ = this.commonService.isMobile$.asObservable();

  constructor(
    public dialogRef: MatDialogRef<ImageZoomableComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      imgUrls: string[];
    },
    private readonly configService: HotelConfigService
  ) {}
}
