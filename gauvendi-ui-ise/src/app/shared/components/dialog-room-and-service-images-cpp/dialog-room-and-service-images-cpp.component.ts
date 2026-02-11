import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";
import {HotelAmenity, Reservation, ReservationPricing} from "@core/graphql/generated/graphql";
import {HotelConfigService} from "@app/services/hotel-config.service";
import {SwiperOptions} from "swiper";
import {CommonModule} from "@angular/common";
import {HexToRgbaPipe} from "@app/shared/pipes/hex-to-rgba.pipe";
import {ParseImageUrlPipe} from "@app/shared/pipes/parse-image-url.pipe";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {MatIcon} from "@angular/material/icon";
import {SwiperModule} from "swiper/angular";

@Component({
  selector: 'app-dialog-room-and-service-images-cpp',
  standalone: true,
  imports: [MatDialogModule, CommonModule, HexToRgbaPipe, ParseImageUrlPipe, TranslatePipe, MatIcon, SwiperModule],
  templateUrl: './dialog-room-and-service-images-cpp.component.html',
  styleUrl: './dialog-room-and-service-images-cpp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogRoomAndServiceImagesCppComponent implements OnInit {
  dialogRef = inject(MatDialogRef<DialogRoomAndServiceImagesCppComponent>);
  MAT_DIALOG_DATA: {
    roomIndex: number;
    item: Reservation;
    isLowestPrice: boolean;
    lowestPriceImageUrl: string;
  } = inject(MAT_DIALOG_DATA);
  hotelConfigService = inject(HotelConfigService);

  colorPrimary$ = this.hotelConfigService.hotelPrimaryColor$;

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
    type: 'ROOM' | 'SERVICE'
  }[] = [];
  selectedImageIndex: number = 0;
  selectedImageUrl: string;

  ngOnInit(): void {
    if (this.MAT_DIALOG_DATA.isLowestPrice) {
      this.imageList.push({
        name: this.MAT_DIALOG_DATA.item?.rfc?.name,
        imageUrl: this.MAT_DIALOG_DATA.lowestPriceImageUrl,
        type: 'ROOM'
      });
    } else {
      this.MAT_DIALOG_DATA.item.rfc?.rfcImageList?.forEach(item => {
        this.imageList.push({
          name: this.MAT_DIALOG_DATA.item?.rfc?.name,
          imageUrl: item?.imageUrl,
          type: 'ROOM'
        });
      });
    }


    const getImage = [
      ...this.MAT_DIALOG_DATA.item?.reservationAmenityList?.filter(item => {
        let total;
        if (item?.totalGrossAmount) {
          total = item?.reservationAmenityDateList
            ?.filter(item => item?.totalGrossAmount)
            ?.map(item => item?.totalGrossAmount)
            ?.reduce((acc, val) => acc + val, 0)
        } else {
          total = 0
        }

        return total === 0;
      }),
      ...this.MAT_DIALOG_DATA.item?.reservationAmenityList?.filter(item => {
        let total;
        if (item?.totalGrossAmount) {
          total = item?.reservationAmenityDateList
            ?.filter(item => item?.totalGrossAmount)
            ?.map(item => item?.totalGrossAmount)
            ?.reduce((acc, val) => acc + val, 0)
        } else {
          total = 0
        }

        return total !== 0;
      }),
    ]?.reduce((acc: HotelAmenity[], cur) => {
      return acc.concat(cur?.hotelAmenity)
    }, []);

    getImage?.forEach(item => {
      this.imageList.push({
        name: item?.name,
        imageUrl: item?.iconImageUrl,
        type: 'SERVICE'
      })
    });

    this.selectedImageUrl = this.imageList && this.imageList[this.selectedImageIndex]?.imageUrl;
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

    this.selectedImageUrl = this.imageList[this.selectedImageIndex]?.imageUrl
  }
}
