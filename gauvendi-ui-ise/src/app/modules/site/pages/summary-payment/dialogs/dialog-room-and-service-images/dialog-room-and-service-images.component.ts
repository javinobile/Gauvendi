import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import {
  HotelAmenity,
  ReservationPricing
} from '@core/graphql/generated/graphql';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { CommonModule } from '@angular/common';
import { HexToRgbaPipe } from '@app/shared/pipes/hex-to-rgba.pipe';
import { SwiperOptions } from 'swiper';
import { ParseImageUrlPipe } from '@app/shared/pipes/parse-image-url.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MatIcon } from '@angular/material/icon';
import { SwiperModule } from 'swiper/angular';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';

@Component({
  selector: 'app-dialog-room-and-service-images',
  standalone: true,
  imports: [
    MatDialogModule,
    CommonModule,
    HexToRgbaPipe,
    ParseImageUrlPipe,
    TranslatePipe,
    MatIcon,
    SwiperModule,
    FilterSvgDirective
  ],
  templateUrl: './dialog-room-and-service-images.component.html',
  styleUrl: './dialog-room-and-service-images.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogRoomAndServiceImagesComponent implements OnInit {
  dialogRef = inject(MatDialogRef<DialogRoomAndServiceImagesComponent>);
  MAT_DIALOG_DATA: {
    roomIndex: number;
    item: ReservationPricing;
    isLowestPrice: boolean;
    lowestPriceImageUrl: string;
  } = inject(MAT_DIALOG_DATA);
  hotelConfigService = inject(HotelConfigService);

  colorPrimary$ = this.hotelConfigService.hotelPrimaryColor$;
  colorButtonText$ = this.hotelConfigService.buttonTextColor$;
  colorButtonBg$ = this.hotelConfigService.buttonBgColor$;

  config: SwiperOptions = {
    navigation: {
      prevEl: '.navigation__left',
      nextEl: '.navigation__right'
    },
    pagination: false,
    slidesPerView: 'auto',
    spaceBetween: 8
  };

  imageList: {
    name: string;
    imageUrl: string;
    type: 'ROOM' | 'SERVICE';
  }[] = [];
  selectedImageIndex: number = 0;
  selectedImageUrl: string;

  ngOnInit(): void {
    if (this.MAT_DIALOG_DATA.isLowestPrice) {
      this.imageList.push({
        name: this.MAT_DIALOG_DATA.item?.roomProduct?.name,
        imageUrl: this.MAT_DIALOG_DATA.lowestPriceImageUrl,
        type: 'ROOM'
      });
    } else {
      this.MAT_DIALOG_DATA.item.roomProduct?.rfcImageList?.forEach((item) => {
        this.imageList.push({
          name: this.MAT_DIALOG_DATA.item?.roomProduct?.name,
          imageUrl: item?.imageUrl,
          type: 'ROOM'
        });
      });
    }

    const getImage = [
      ...this.MAT_DIALOG_DATA.item?.amenityPricingList?.filter(
        (x) => x?.isSalesPlanIncluded
      ),
      ...this.MAT_DIALOG_DATA.item?.amenityPricingList?.filter(
        (x) => !x?.isSalesPlanIncluded
      )
    ]?.reduce((acc: HotelAmenity[], cur) => {
      return acc.concat(cur?.hotelAmenity);
    }, []);

    getImage?.forEach((item) => {
      this.imageList.push({
        name: item?.name,
        imageUrl: item?.iconImageUrl,
        type: 'SERVICE'
      });
    });

    this.selectedImageUrl =
      this.imageList && this.imageList[this.selectedImageIndex]?.imageUrl;
  }

  selectImage(image: any, index: number): void {
    this.selectedImageUrl = image?.imageUrl;
    this.selectedImageIndex = index;
  }

  changeImage(offset: number): void {
    const newIndex = this.selectedImageIndex + offset;
    if (newIndex < 0) {
      this.selectedImageIndex = this.imageList?.length - 1;
    } else if (newIndex > this.imageList?.length - 1) {
      this.selectedImageIndex = 0;
    } else {
      this.selectedImageIndex = newIndex;
    }

    this.selectedImageUrl = this.imageList[this.selectedImageIndex]?.imageUrl;
  }
}
