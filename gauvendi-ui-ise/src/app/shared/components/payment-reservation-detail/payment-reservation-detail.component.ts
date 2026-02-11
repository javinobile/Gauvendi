import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { CalculateReservationAmenityCountPipe } from '@app/modules/payment-result/pipes/calculate-reservation-amenity-count.pipe';
import { GetAmenityIconFromReservationPipe } from '@app/modules/payment-result/pipes/get-amenity-icon-from-reservation.pipe';
import { GetAmenityTotalPricePipe } from '@app/modules/payment-result/pipes/get-amenity-total-price.pipe';
import { TotalAmenityListPipe } from '@app/modules/payment-result/pipes/total-amenity-list.pipe';
import { DialogImageGalleryComponent } from '@app/shared/components/dialog-image-gallery/dialog-image-gallery.component';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { FeatureDescriptionTooltipDirective } from '@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive';
import { CountExtraServicesPipe } from '@app/shared/pipes/count-extra-services.pipe';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { IsServiceIncludedPipe } from '@app/shared/pipes/is-service-included.pipe';
import { ParseImageUrlPipe } from '@app/shared/pipes/parse-image-url.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  BookingFlow,
  HotelAmenity,
  Reservation,
  RfcImage
} from '@core/graphql/generated/graphql';
import { IOptionUnitsInfo } from '../option-units-info/interfaces/option-units-info.interface';
import { OptionUnitsInfoComponent } from '../option-units-info/option-units-info.component';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';

@Component({
  selector: 'app-payment-reservation-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    CalculateReservationAmenityCountPipe,
    CurrencyRatePipe,
    GetAmenityIconFromReservationPipe,
    GetAmenityTotalPricePipe,
    MyCurrencyPipe,
    OptionUnitsInfoComponent,
    ParseImageUrlPipe,
    TotalAmenityListPipe,
    TranslatePipe,
    MatIconModule,
    MatExpansionModule,
    CountExtraServicesPipe,
    IsServiceIncludedPipe,
    FeatureDescriptionTooltipDirective
  ],
  templateUrl: './payment-reservation-detail.component.html',
  styleUrls: ['./payment-reservation-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentReservationDetailComponent
  extends DirSettingDirective
  implements OnChanges
{
  @Input() roomIdx: number;
  @Input() lowestPriceImageUrl: string;
  @Input() isLowestPriceOpaque: boolean;
  @Input() reservation: Reservation;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() rfcImageList: RfcImage[];
  @Input() availableAmenity: HotelAmenity[];
  @Input() totalNights: number;
  @Input() ratePlanName: string;
  @Input() currentBookingFlow: BookingFlow;

  bookingFlow = BookingFlow;
  toggleFeature = false;
  countImage = 3;
  maximumAmenity = 4;
  isMobile: boolean;

  unitsInfoItem = signal<IOptionUnitsInfo>(null);

  constructor(private dialog: MatDialog) {
    super();
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    this.countImage = this.isMobile ? 2 : 3;
    this.maximumAmenity = this.isMobile ? 3 : 4;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.reservation) {
      this.setUnitsInfoItem();
    }
  }

  setUnitsInfoItem() {
    this.unitsInfoItem.set({
      adults: this.reservation?.adult,
      children: this.reservation?.childrenAgeList?.length,
      roomKey: 1,
      pets: this.reservation?.pets,
      bedRooms: this.reservation?.rfc?.numberOfBedrooms,
      roomSpace: this.reservation?.rfc?.space
    });
  }

  openGalleryLowestPrice(lowestPriceImage: string): void {
    this.dialog.open(DialogImageGalleryComponent, {
      maxWidth: '95vw',
      direction: this.direction(),
      maxHeight: '80vh',
      data: {
        imageList: [lowestPriceImage],
        roomIndex: 0,
        roomName: this.reservation?.rfc?.name,
        imageIdx: 0,
        type: 'ROOM',
        isLowestPrice: true
      }
    });
  }

  openGallery(imageIdx: number): void {
    this.dialog.open(DialogImageGalleryComponent, {
      maxWidth: '95vw',
      maxHeight: '80vh',
      direction: this.direction(),
      data: {
        imageList: this.rfcImageList,
        roomIndex: this.roomIdx,
        roomName: this.reservation?.rfc?.name,
        imageIdx,
        type: 'ROOM'
      }
    });
  }

  openAmenityGallery(amenityImageList: HotelAmenity[]): void {
    this.dialog.open(DialogImageGalleryComponent, {
      maxWidth: '95vw',
      direction: this.direction(),
      maxHeight: '80vh',
      data: {
        imageList: amenityImageList?.map((x) => ({
          imageUrl: x?.iconImageUrl
        })),
        amenityName: amenityImageList?.map((x) => x?.name),
        roomIndex: this.roomIdx,
        roomName: this.reservation?.rfc?.name,
        imageIdx: 0,
        type: 'EXTRA_SERVICE'
      }
    });
  }
}
