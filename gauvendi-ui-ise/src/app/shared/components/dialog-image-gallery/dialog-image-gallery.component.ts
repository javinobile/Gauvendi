import {ChangeDetectionStrategy, Component, Inject, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import SwiperCore, {Navigation, SwiperOptions} from "swiper";
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {RfcImage} from "@core/graphql/generated/graphql";
import {SwiperComponent, SwiperModule} from "swiper/angular";
import {ParseImageUrlPipe} from "@app/shared/pipes/parse-image-url.pipe";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {MatIconModule} from "@angular/material/icon";

SwiperCore.use([Navigation]);

@Component({
  selector: 'app-dialog-image-gallery',
  standalone: true,
  imports: [CommonModule, SwiperModule, ParseImageUrlPipe, TranslatePipe, MatIconModule, MatDialogModule],
  templateUrl: './dialog-image-gallery.component.html',
  styleUrls: ['./dialog-image-gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogImageGalleryComponent {
  @ViewChild('swiper', {static: false}) swiperComponent: SwiperComponent;
  config: SwiperOptions = {
    navigation: {
      prevEl: '.navigation__left',
      nextEl: '.navigation__right'
    },
    pagination: false,
    slidesPerView: 'auto',
    spaceBetween: 10
  };

  selectedImageUrl: string;
  selectedImageIndex: number;

  constructor(
    public dialogRef: MatDialogRef<DialogImageGalleryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      imageList: RfcImage[];
      roomIndex: number;
      roomName: string;
      imageIdx: number;
      type: string;
      amenityName: string[];
      isLowestPrice?: boolean;
    },
  ) {
    this.selectedImageUrl = data?.imageList && data?.imageList[data?.imageIdx]?.imageUrl;
    this.selectedImageIndex = data?.imageIdx;
  }

  selectImage(image: RfcImage, index: number): void {
    this.selectedImageUrl = image?.imageUrl;
    this.selectedImageIndex = index;
  }
}
