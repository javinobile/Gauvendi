import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import {BookingFlow, HotelAmenity, Reservation, RfcImage} from "@core/graphql/generated/graphql";
import {MatDialog} from "@angular/material/dialog";
import {DialogImageGalleryComponent} from "@app/shared/components/dialog-image-gallery/dialog-image-gallery.component";
import {
  CalculateReservationAmenityCountPipe
} from "@app/modules/payment-result/pipes/calculate-reservation-amenity-count.pipe";
import {CountExtraServicesPipe} from "@app/shared/pipes/count-extra-services.pipe";
import {CurrencyRatePipe} from "@app/shared/pipes/currency-rate.pipe";
import {
  FeatureDescriptionTooltipDirective
} from "@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive";
import {
  GetAmenityIconFromReservationPipe
} from "@app/modules/payment-result/pipes/get-amenity-icon-from-reservation.pipe";
import {GetAmenityTotalPricePipe} from "@app/modules/payment-result/pipes/get-amenity-total-price.pipe";
import {IsServiceIncludedPipe} from "@app/shared/pipes/is-service-included.pipe";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatIconModule} from "@angular/material/icon";
import {MyCurrencyPipe} from "@app/modules/site/pages/recommendation/utils/my-currency.pipe";
import {OptionUnitsInfoComponent} from "@app/shared/components/option-units-info/option-units-info.component";
import {ParseImageUrlPipe} from "@app/shared/pipes/parse-image-url.pipe";
import {TotalAmenityListPipe} from "@app/modules/payment-result/pipes/total-amenity-list.pipe";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {FilterSvgDirective} from "@app/shared/directives/filter-svg.directive";
import {DateWithLocaleAndTimezonePipe} from "@app/modules/payment-result/pipes/date-with-locale-and-timezone.pipe";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {BehaviorSubject} from "rxjs";
import {InputTextareaComponent} from "@app/shared/form-controls/input-textarea/input-textarea.component";
import {FormErrorComponent} from "@app/shared/form-controls/form-error/form-error.component";
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';

@Component({
  selector: 'app-reservation-detail-panel',
  standalone: true,
  imports: [CommonModule, CalculateReservationAmenityCountPipe, CountExtraServicesPipe, CurrencyRatePipe, FeatureDescriptionTooltipDirective, GetAmenityIconFromReservationPipe, GetAmenityTotalPricePipe, IsServiceIncludedPipe, MatExpansionModule, MatIconModule, MyCurrencyPipe, OptionUnitsInfoComponent, ParseImageUrlPipe, TotalAmenityListPipe, TranslatePipe, FilterSvgDirective, DateWithLocaleAndTimezonePipe, ReactiveFormsModule, InputTextareaComponent, FormErrorComponent],
  templateUrl: './reservation-detail-panel.component.html',
  styleUrls: ['./reservation-detail-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationDetailPanelComponent extends DirSettingDirective {
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
  @Input() cancellationPolicy: string;
  @Input() specialRequestForm: FormGroup;
  @Input() bookingReview = false;
  @Output() changeSpecialRequest = new EventEmitter();

  bookingFlow = BookingFlow;
  toggleFeature = false;
  countImage = 3;
  maximumAmenity = 4;
  isMobile: boolean;
  isAddSpecialRequest$ = new BehaviorSubject(false);
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

  saveSpecialRequest(): void {
    this.specialRequestForm.markAllAsTouched();
    if (this.specialRequestForm.valid) {
      this.isAddSpecialRequest$.next(false);
      this.changeSpecialRequest.emit(this.specialRequestForm?.value)
    }
  }
}
