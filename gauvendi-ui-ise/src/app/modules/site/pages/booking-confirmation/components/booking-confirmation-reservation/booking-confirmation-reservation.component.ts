import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {BookingFlow, HotelAmenity, Reservation, RfcImage} from "@core/graphql/generated/graphql";
import {MatDialog} from "@angular/material/dialog";
import {DialogImageGalleryComponent} from "@app/shared/components/dialog-image-gallery/dialog-image-gallery.component";
import {
  CalculateReservationAmenityCountPipe
} from "@app/modules/payment-result/pipes/calculate-reservation-amenity-count.pipe";
import {CountExtraServicesPipe} from "@app/modules/payment-result/pipes/count-extra-services.pipe";
import {CurrencyRatePipe} from "@app/shared/pipes/currency-rate.pipe";
import {
  FeatureDescriptionTooltipDirective
} from "@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive";
import {
  GetAmenityIconFromReservationPipe
} from "@app/modules/payment-result/pipes/get-amenity-icon-from-reservation.pipe";
import {GetAmenityTotalPricePipe} from "@app/modules/payment-result/pipes/get-amenity-total-price.pipe";
import {IsServiceIncludedPipe} from "@app/modules/payment-result/pipes/is-service-included.pipe";
import {MyCurrencyPipe} from "@app/modules/site/pages/recommendation/utils/my-currency.pipe";
import {OptionUnitsInfoComponent} from "@app/shared/components/option-units-info/option-units-info.component";
import {ParseImageUrlPipe} from "@app/shared/pipes/parse-image-url.pipe";
import {TotalAmenityListPipe} from "@app/modules/payment-result/pipes/total-amenity-list.pipe";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {FilterSvgDirective} from "@app/shared/directives/filter-svg.directive";
import {DateWithLocaleAndTimezonePipe} from "@app/modules/payment-result/pipes/date-with-locale-and-timezone.pipe";
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';

@Component({
  selector: 'app-booking-confirmation-reservation',
  standalone: true,
  imports: [CommonModule, CalculateReservationAmenityCountPipe, CountExtraServicesPipe, CurrencyRatePipe, FeatureDescriptionTooltipDirective, GetAmenityIconFromReservationPipe, GetAmenityTotalPricePipe, IsServiceIncludedPipe, MyCurrencyPipe, OptionUnitsInfoComponent, ParseImageUrlPipe, TotalAmenityListPipe, TranslatePipe, FilterSvgDirective, DateWithLocaleAndTimezonePipe],
  templateUrl: './booking-confirmation-reservation.component.html',
  styleUrls: ['./booking-confirmation-reservation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingConfirmationReservationComponent extends DirSettingDirective {
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
  @Input() colorText: string;
  @Input() locale: string;
  @Input() timezone: string;
  @Input() specialRequest: string;
  @Input() cancellationPolicy: string;

  bookingFlow = BookingFlow;
  countImage = 3;
  maximumAmenity = 4;
  isMobile: boolean;
  constructor(
    private dialog: MatDialog
  ) {
    super();
    this.isMobile =
      /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    this.countImage = this.isMobile ? 2 : 3;
    this.maximumAmenity = this.isMobile ? 3 : 4;
  }

  openGalleryLowestPrice(lowestPriceImage: string): void {
    this.dialog.open(DialogImageGalleryComponent, {
      maxWidth: '95vw',
      maxHeight: '80vh',
      direction: this.direction(),
      data: {
        imageList: [{
          imageUrl: lowestPriceImage
        }],
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
      maxHeight: '80vh',
      direction: this.direction(),
      data: {
        imageList: amenityImageList?.map(x => ({
          imageUrl: x?.iconImageUrl
        })),
        amenityName: amenityImageList?.map(x => x?.name),
        roomIndex: this.roomIdx,
        roomName: this.reservation?.rfc?.name,
        imageIdx: 0,
        type: 'EXTRA_SERVICE'
      }
    });
  }
}
