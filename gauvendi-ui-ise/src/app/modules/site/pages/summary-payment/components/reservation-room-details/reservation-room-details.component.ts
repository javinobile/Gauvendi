import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { DataLayerEvents, DataLayerKeys } from '@app/constants/datalayer.enum';
import { MyCurrencyPipe } from '@app/modules/site/pages/recommendation/utils/my-currency.pipe';
import { CountExtraServicesPipe } from '@app/modules/site/pages/summary-payment/pipes/count-extra-services.pipe';
import { TotalAmenityPipe } from '@app/modules/site/pages/summary-payment/pipes/total-amenity.pipe';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { DialogImageGalleryComponent } from '@app/shared/components/dialog-image-gallery/dialog-image-gallery.component';
import { OptionUnitsInfoComponent } from '@app/shared/components/option-units-info/option-units-info.component';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { DirSettingDirective } from '@app/shared/directives/dir-setting.directive';
import { FeatureDescriptionTooltipDirective } from '@app/shared/directives/feature-description-tooltip/feature-description-tooltip.directive';
import { CurrencyRatePipe } from '@app/shared/pipes/currency-rate.pipe';
import { GetAmenityCountByAgePipe } from '@app/shared/pipes/get-amenity-count-by-age.pipe';
import { GetAmenityIconUrlPipe } from '@app/shared/pipes/get-amenity-icon-url.pipe';
import { GetChildrenAgeIncludedPipe } from '@app/shared/pipes/get-children-age-included.pipe';
import { GetChildrenAgePipe } from '@app/shared/pipes/get-children-age.pipe';
import { ParseImageUrlPipe } from '@app/shared/pipes/parse-image-url.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  HotelAmenity,
  HotelRetailFeature,
  PricingUnitEnum,
  Reservation,
  RfcImage
} from '@core/graphql/generated/graphql';

@Component({
  selector: 'app-reservation-room-details',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    CurrencyRatePipe,
    MyCurrencyPipe,
    OptionUnitsInfoComponent,
    ParseImageUrlPipe,
    GetAmenityIconUrlPipe,
    MatDialogModule,
    MatIconModule,
    MatExpansionModule,
    TotalAmenityPipe,
    GetChildrenAgePipe,
    GetAmenityCountByAgePipe,
    GetChildrenAgeIncludedPipe,
    CustomTooltipModule,
    CountExtraServicesPipe,
    FeatureDescriptionTooltipDirective
  ],
  templateUrl: './reservation-room-details.component.html',
  styleUrls: ['./reservation-room-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationRoomDetailsComponent
  extends DirSettingDirective
  implements OnChanges
{
  @Input() rfcImageList: RfcImage[];
  @Input() reservation: Reservation;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() roomIdx: number;
  @Input() isLowerPrice: boolean;
  @Input() isLowestPriceOpaque: boolean;
  @Input() availableAmenity: HotelAmenity[];
  @Input() isCustomize: boolean;
  @Input() totalNights: number;
  @Input() includedHotelExtrasList: HotelAmenity[];
  @Input() lowestPriceImageUrl: string;
  @Input() shouldStrikeThrough: boolean;
  @Input() grossBefore: string;
  @Input() baseBefore: string;
  @Input() adjustmentPercentage: string;
  @Input() isInclusive: boolean;

  toggleFeature = false;
  guaranteeFeatures: HotelRetailFeature[] = [];
  pricingUnit = PricingUnitEnum;
  serviceIncluded: string[] = [];
  countImage = 3;
  maximumAmenity = 4;
  isMobile = false;

  constructor(
    private dialog: MatDialog,
    private googleTrackingService: GoogleTrackingService,
    private bookingTransactionService: BookingTransactionService
  ) {
    super();
    this.isMobile = /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    this.countImage = this.isMobile ? 2 : 3;
    this.maximumAmenity = this.isMobile ? 3 : 4;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('reservation') && this.reservation) {
      this.pushEvent();

      if (this.isCustomize) {
        const roomConfig = this.bookingTransactionService
          .getCurrentRoomConfiguration(
            this.route.snapshot.queryParams,
            this.roomIdx
          )
          ?.split(',');
        const featureList = roomConfig?.reduce((prev, curr) => {
          const features = curr.split('-');
          features.shift();
          return [...prev, ...features];
        }, []);
        if (featureList) {
          this.guaranteeFeatures =
            this.reservation.rfc?.retailFeatureList.filter(
              (item) => featureList.includes(item?.code) && item?.matched
            );
        }
      }
    }

    if (
      changes.hasOwnProperty('includedHotelExtrasList') &&
      this.includedHotelExtrasList
    ) {
      this.serviceIncluded = this.includedHotelExtrasList?.map(
        (item) => item?.code
      );
    }
  }

  pushEvent(): void {
    const amenityList = this.reservation?.amenityList;
    const hotelCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode];

    this.googleTrackingService.pushEvent(DataLayerEvents.selectHotelExtras, {
      [DataLayerKeys.selectedRoom]: this.reservation?.rfc?.code,
      [DataLayerKeys.hotelExtras]: amenityList?.map((item) => ({
        service: item?.name,
        quantity: +item?.count * +item?.calculatedRateList?.length
      })),
      [DataLayerKeys.hotelCode]: hotelCode?.toLocaleUpperCase()
    });
  }

  openGalleryLowestPrice(lowestPriceImage: string): void {
    this.dialog.open(DialogImageGalleryComponent, {
      maxWidth: '95vw',
      maxHeight: '80vh',
      direction: this.direction(),
      data: {
        imageList: [
          {
            imageUrl: lowestPriceImage
          }
        ],
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
        type: 'ROOM',
        isLowestPrice: this.isLowerPrice && this.isLowestPriceOpaque
      }
    });
  }

  openAmenityGallery(amenityImageList: HotelAmenity[]): void {
    this.dialog.open(DialogImageGalleryComponent, {
      maxWidth: '95vw',
      maxHeight: '80vh',
      direction: this.direction(),
      data: {
        imageList: amenityImageList?.map((x) => ({
          imageUrl: x?.iconImageUrl
        })),
        amenityName: amenityImageList?.map((x) => x?.name),
        roomIndex: this.roomIdx,
        roomName: this.reservation?.rfc?.name,
        imageIdx: 0,
        type: 'EXTRA_SERVICE',
        isLowestPrice: this.isLowerPrice && this.isLowestPriceOpaque
      }
    });
  }
}
