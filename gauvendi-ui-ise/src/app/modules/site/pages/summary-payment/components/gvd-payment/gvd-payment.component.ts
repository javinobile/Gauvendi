import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { DataLayerEvents, DataLayerKeys } from '@app/constants/datalayer.enum';
import { AbstractPaymentMethodComponent } from '@app/modules/site/components/abstracts/abstract-payment-method.component';
import { GetPaymentMethodIconPipe } from '@app/modules/site/pages/summary-payment/pipes/get-payment-method-icon.pipe';
import { GetPaymentModeStatusPipe } from '@app/modules/site/pages/summary-payment/pipes/get-payment-mode-status.pipe';
import { ParsePaymentMethodNamePipe } from '@app/modules/site/pages/summary-payment/pipes/parse-payment-method-name.pipe';
import { CheckboxCComponent } from '@app/shared/form-controls/checkbox-c/checkbox-c.component';
import { ParseMetadataConfigPipe } from '@app/shared/pipes/parse-metadata-config.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  AvailablePaymentMethod,
  BookingInformationInput,
  BookingPaymentResponse,
  BookingPricing,
  Guest,
  GuestInformationInput,
  HotelPaymentModeCodeEnum,
  LanguageCode,
  LowestPriceOptionInput,
  PaymentProviderCodeEnum,
  RequestBookingPaymentInput
} from '@core/graphql/generated/graphql';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { BehaviorSubject, lastValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

declare var paypal: any;

@Component({
  selector: 'app-gvd-payment',
  standalone: true,
  imports: [
    CommonModule,
    GetPaymentModeStatusPipe,
    ParsePaymentMethodNamePipe,
    TranslatePipe,
    GetPaymentMethodIconPipe,
    MatExpansionModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    CheckboxCComponent,
    ParseMetadataConfigPipe
  ],
  templateUrl: './gvd-payment.component.html',
  styleUrls: ['./gvd-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GvdPaymentComponent
  extends AbstractPaymentMethodComponent
  implements OnDestroy
{
  @Input() availablePaymentMethodList: AvailablePaymentMethod[];
  @Input() summaryBooking: BookingPricing;
  @Input() guestInformationValid: boolean;
  @Input() locale: string;
  @Input() bookingSrc: string;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() additionalGuestList: GuestInformationInput[];
  @Input() guestInformation: GuestInformationInput;
  @Input() specialRequest: string;
  @Input() bookingInformation: BookingInformationInput;
  @Input() requestBookingInfo: RequestBookingPaymentInput;
  @Input() additionalGuestValid: boolean;
  @Input() hotelTerm: string;
  @Input() hotelPrivacy: string;
  @Input() tripPurpose: string;
  @Input() companyInfo: Guest;
  @Input() bookerInformation: GuestInformationInput;
  @Input() bookerInformationValid: boolean;
  @Input() isBookForAnother: boolean;

  @Output() guaranteeMethod = new EventEmitter();
  @Output() needValidation = new EventEmitter();

  selectedPaymentMethodCode: HotelPaymentModeCodeEnum;
  hotelPaymentModeCode = HotelPaymentModeCodeEnum;

  termCtrl: FormControl = this.fb.control(false);
  paypalBtnRef;
  bookingId: string;

  selectedPaymentMethod$: BehaviorSubject<HotelPaymentModeCodeEnum> =
    new BehaviorSubject(null);

  destroyed$ = new Subject();

  ngOnDestroy(): void {
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }

  override ngOnInit(): void {
    this.termCtrl.valueChanges.pipe().subscribe((isAccepted) => {
      if (isAccepted) {
        if (this.validateFormValid()) {
          this.paypalBtnRef?.enable();
        } else {
          this.paypalBtnRef?.disable();
        }
      } else {
        this.paypalBtnRef?.disable();
      }
    });
  }

  override ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes.hasOwnProperty('summaryBooking') ||
        changes.hasOwnProperty('availablePaymentMethodList')) &&
      this.summaryBooking &&
      this.availablePaymentMethodList?.length > 0
    ) {
      this.selectedPaymentMethodCode =
        this.availablePaymentMethodList?.find(
          (x) => x?.paymentMethodCode === HotelPaymentModeCodeEnum.Guawcc
        )?.paymentMethodCode ||
        this.availablePaymentMethodList[0]?.paymentMethodCode;
      this.selectedPaymentMethod$.next(this.selectedPaymentMethodCode);

      this.guaranteeMethod.emit(this.selectedPaymentMethodCode);

      if (this.selectedPaymentMethodCode === HotelPaymentModeCodeEnum.Paypal) {
        if (
          document
            ?.getElementById('paypal-button-container')
            ?.innerHTML?.trim() === ''
        ) {
          this.paypalHandler();
        }
      }
    }
  }

  onPaymentMethodChange(paymentMethodCode: HotelPaymentModeCodeEnum): void {
    if (paymentMethodCode) {
      this.guaranteeMethod.next(paymentMethodCode);
      this.selectedPaymentMethodCode = paymentMethodCode;
      this.selectedPaymentMethod$.next(this.selectedPaymentMethodCode);

      if (this.selectedPaymentMethodCode === HotelPaymentModeCodeEnum.Paypal) {
        if (
          document
            ?.getElementById('paypal-button-container')
            ?.innerHTML?.trim() === ''
        ) {
          this.paypalHandler();
        }
      }
    }
  }

  submitConfirmPayment(): void {
    if (
      (this.isBookForAnother ? this.bookerInformationValid : true) &&
      this.guestInformationValid &&
      this.additionalGuestValid
    ) {
      this.makePayment();
    } else {
      this.validationErrorMessage$.next('MISSING_DATA');
      this.needValidation.emit();
      window.innerWidth <= 1024
        ? this.scrollToGuestInformation()
        : window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
    }
  }

  makePayment(): void {
    const queryParams = this.route.snapshot.queryParams;
    this.trackingService.track(MixpanelKeys.ClickConfirmBooking, {
      name: 'Payment',
      request_id: queryParams[RouteKeyQueryParams.requestId],
      recommendation_id: queryParams[RouteKeyQueryParams.recommendationId],
      booking_flow: queryParams[RouteKeyQueryParams.bookingFlow]
    });
    const promoCode = queryParams[RouteKeyQueryParams.promoCode] || null;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];

    // Add SoC to local storage to check when show payment confirmed
    localStorage.setItem(
      'soc',
      queryParams[RouteKeyQueryParams.roomStayOptionsCode]
    );

    this.isLockSubmitPayment$.next(true);
    this.paymentErrorMessage$.next(null);

    const guestInfo: GuestInformationInput = {
      ...this.guestInformation,
      isBooker: !this.isBookForAnother,
      companyEmail: this.companyInfo?.companyEmail,
      companyAddress: this.companyInfo?.companyAddress,
      companyCity: this.companyInfo?.companyCity,
      companyCountry: this.companyInfo?.companyCountry,
      companyName: this.companyInfo?.companyName,
      companyPostalCode: this.companyInfo?.companyPostalCode,
      companyTaxId: this.companyInfo?.companyTaxId
    };

    const bookingInformation: BookingInformationInput = {
      ...this.bookingInformation,
      hotelPaymentModeCode: this.selectedPaymentMethodCode,
      guestInformation: guestInfo,
      additionalGuestList: this.additionalGuestList,
      specialRequest: this.specialRequest || null,
      source: this.bookingSrc ? this.bookingSrc : 'Website',
      booker: this.bookerInformation,
      reservationList: this.bookingInformation?.reservationList?.map((x) => ({
        ...x,
        tripPurpose: this.tripPurpose
      }))
    };

    const lowestPriceOptionList: LowestPriceOptionInput[] = queryParams[
      RouteKeyQueryParams.lowestCode
    ]
      ?.split('~')
      ?.map((code) => {
        return {
          roomProductCode: code,
          salesPlanCode: queryParams[RouteKeyQueryParams.lowestSalesPlan]
        };
      });

    switch (this.selectedPaymentMethodCode) {
      case HotelPaymentModeCodeEnum.Guawcc:
        this.googleTrackingService.pushEvent(DataLayerEvents.makePayment, {
          [DataLayerKeys.paymentType]: 'INTEGRATED PAYMENT'
        });
        break;
      case HotelPaymentModeCodeEnum.Guawde:
        this.googleTrackingService.pushEvent(DataLayerEvents.makePayment, {
          [DataLayerKeys.paymentType]: 'BANK TRANSFERRING'
        });
        break;
    }

    this.paymentService
      .requestBooking({
        request: {
          bookingInformation,
          creditCardInformation: null,
          translateTo:
            this.locale === MultiLangEnum.EN
              ? null
              : (this.locale?.toLocaleUpperCase() as LanguageCode),
          promoCodeList: promoCode ? [promoCode] : null,
          lowestPriceOptionList,
          transactionId: null,
          hotelCode,
          ...this.requestBookingInfo
        }
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (res) => {
          const { status, data, message, code } = res;
          if (status === 'SUCCESS') {
            this.router
              .navigate([RouterPageKey.bookingProcessing], {
                queryParams: {
                  [RouteKeyQueryParams.paymentId]: (
                    data as BookingPaymentResponse
                  )?.booking?.id,
                  [RouteKeyQueryParams.hotelCode]:
                    queryParams?.[RouteKeyQueryParams.hotelCode],
                  [RouteKeyQueryParams.currency]:
                    queryParams[RouteKeyQueryParams.currency],
                  [RouteKeyQueryParams.hotelCode]:
                    queryParams[RouteKeyQueryParams.hotelCode],
                  [RouteKeyQueryParams.lang]:
                    queryParams[RouteKeyQueryParams.lang],
                  [RouteKeyQueryParams.requestId]:
                    queryParams[RouteKeyQueryParams.requestId],
                  [RouteKeyQueryParams.recommendationId]:
                    queryParams[RouteKeyQueryParams.recommendationId]
                },
                queryParamsHandling: 'merge'
              })
              .then(null);
          } else {
            this.handleErrorMessage(message);
          }
        },
        error: () => {
          this.isLockSubmitPayment$.next(false);

          this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
        }
      });
  }

  handleErrorMessage(message: string) {
    this.isLockSubmitPayment$.next(false);
    switch (message) {
      case 'CHARGE_CREDIT_CARD_FAILED':
        this.paymentErrorMessage$.next('CHARGE_CREDIT_CARD_FAILED');
        break;
      case 'TOKENIZE_CARD_FAILED':
        this.paymentErrorMessage$.next('TOKENIZE_CARD_FAILED');
        break;
      case 'CREATE_MEWS_CUSTOMER_FAILED':
        this.paymentErrorMessage$.next('CREATE_MEWS_CUSTOMER_FAILED');
        break;
      case 'REQUIRE_CARD_INFORMATION':
        this.paymentErrorMessage$.next('REQUIRE_CARD_INFORMATION');
        break;
      case 'BOOKING_RFC_NOT_AVAILABLE':
      case 'ROOM_PRODUCT_NOT_AVAILABLE_RFC_RATE_PLAN_LIST':
      case 'ROOM_PRODUCT_NOT_AVAILABLE_RFC_LIST':
      case 'ROOM_PRODUCT_NOT_AVAILABLE_AVAILABLE_RFC_LIST':
      case 'ROOM_PRODUCT_NOT_AVAILABLE_HAS_UNAVAILABLE_RFC':
      case 'ROOM_PRODUCT_NOT_AVAILABLE_AVAILABILITY_LIST':
      case 'NOT_SELLABLE_ROOM_PRODUCT_SALES_PLAN':
      case 'INVALID_RATE_PLAN':
      case 'NOT_FOUND_RATE_PLAN':
      case 'UNAVAILABLE_RFC':
      case 'ROOM_NOT_AVAILABLE':
        this.paymentErrorMessage$.next('BOOKING_RFC_NOT_AVAILABLE');
        break;
      case 'REQUIRE_HOTEL_PAYMENT_MODE_CODE':
        this.paymentErrorMessage$.next('REQUIRE_HOTEL_PAYMENT_MODE_CODE');
        break;
      case 'REQUEST_AFTER_OPERATION_CLOSING_TIME':
        this.paymentErrorMessage$.next('REQUEST_AFTER_OPERATION_CLOSING_TIME');
        break;
      case 'INVALID_CAPACITY':
        this.paymentErrorMessage$.next('INVALID_CAPACITY');
        break;
      default:
        this.paymentErrorMessage$.next(null);
        this.paymentErrorMessageDraw$.next(message);
        break;
    }
  }

  scrollToGuestInformation(): void {
    const ele = document.querySelector(
      'app-booking-information'
    ) as HTMLElement;
    window.scrollTo({
      top: ele?.offsetTop,
      behavior: 'smooth'
    });
  }

  paypalHandler(): void {
    // @ts-ignore
    paypal
      .Buttons({
        style: {
          size: 'large',
          shape: 'pill',
          layout: 'horizontal',
          color: 'gold',
          label: 'paypal',
          borderRadius: 12,
          disableMaxWidth: true,
          tagline: false
        },
        onInit: (data, actions) => {
          this.paypalBtnRef = actions;
          // Disable the buttons
          actions.disable();
        },
        onClick: () => {
          this.needValidation.emit();
          if (!this.validateFormValid()) {
            this.validationErrorMessage$.next('MISSING_DATA');
            window.innerWidth <= 1024
              ? this.scrollToGuestInformation()
              : window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
          } else {
            if (this.termCtrl?.value) {
              this.paypalBtnRef.enable();
            } else {
              this.paypalBtnRef.disable();
            }
          }
        },
        createOrder: async (data, actions) => {
          const createOrderResponse = await lastValueFrom(
            this.makePaymentWithPaypal()
          );
          if (createOrderResponse?.status === 'SUCCESS') {
            this.bookingId = (
              createOrderResponse?.data as BookingPaymentResponse
            )?.booking?.id;
            return (createOrderResponse?.data as BookingPaymentResponse)?.action
              ?.paymentData;
          } else {
            this.handleErrorMessage(createOrderResponse?.message);
          }

          this.handleErrorMessage(createOrderResponse?.message);
          throw new Error(createOrderResponse?.message);
        },
        onApprove: async (data, actions) => {
          const confirmResponse = await lastValueFrom(
            this.confirmPaypal(data?.orderID)
          );
          if (confirmResponse?.status === 'SUCCESS') {
            this.router
              .navigate([RouterPageKey.bookingProcessing], {
                queryParams: {
                  [RouteKeyQueryParams.paymentId]: this.bookingId,
                  [RouteKeyQueryParams.hotelCode]:
                    this.route.snapshot.queryParams?.[
                      RouteKeyQueryParams.hotelCode
                    ],
                  [RouteKeyQueryParams.currency]:
                    this.route.snapshot.queryParams[
                      RouteKeyQueryParams.currency
                    ],
                  [RouteKeyQueryParams.lang]:
                    this.route.snapshot.queryParams[RouteKeyQueryParams.lang],
                  [RouteKeyQueryParams.requestId]:
                    this.route.snapshot.queryParams[
                      RouteKeyQueryParams.requestId
                    ],
                  [RouteKeyQueryParams.recommendationId]:
                    this.route.snapshot.queryParams[
                      RouteKeyQueryParams.recommendationId
                    ]
                },
                queryParamsHandling: 'merge'
              })
              .then(null);
          } else {
            this.router
              .navigate([RouterPageKey.bookingProcessing, 'error'], {
                queryParams: {
                  [RouteKeyQueryParams.hotelCode]:
                    this.route.snapshot.queryParams[
                      RouteKeyQueryParams.hotelCode
                    ]
                },
                queryParamsHandling: 'merge'
              })
              .then(() => {});
          }
        },
        onCancel: () => {
          this.router
            .navigate([RouterPageKey.bookingProcessing, 'error'], {
              queryParams: {
                [RouteKeyQueryParams.hotelCode]:
                  this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode]
              },
              queryParamsHandling: 'merge'
            })
            .then(() => {});
        }
      })
      .render('#paypal-button-container');
  }

  validateFormValid(): boolean {
    return (
      (this.isBookForAnother ? this.bookerInformationValid : true) &&
      this.guestInformationValid &&
      this.additionalGuestValid
    );
  }

  makePaymentWithPaypal() {
    const queryParams = this.route.snapshot.queryParams;
    this.trackingService.track(MixpanelKeys.ClickConfirmBooking, {
      name: 'Payment',
      request_id: queryParams[RouteKeyQueryParams.requestId],
      recommendation_id: queryParams[RouteKeyQueryParams.recommendationId],
      booking_flow: queryParams[RouteKeyQueryParams.bookingFlow]
    });
    const promoCode = queryParams[RouteKeyQueryParams.promoCode] || null;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];

    this.paymentErrorMessage$.next(null);
    const guestInfo: GuestInformationInput = {
      ...this.guestInformation,
      isBooker: !this.isBookForAnother,
      companyEmail: this.companyInfo?.companyEmail,
      companyAddress: this.companyInfo?.companyAddress,
      companyCity: this.companyInfo?.companyCity,
      companyCountry: this.companyInfo?.companyCountry,
      companyName: this.companyInfo?.companyName,
      companyPostalCode: this.companyInfo?.companyPostalCode,
      companyTaxId: this.companyInfo?.companyTaxId
    };

    const bookingInformation: BookingInformationInput = {
      ...this.bookingInformation,
      hotelPaymentModeCode: this.selectedPaymentMethodCode,
      guestInformation: guestInfo,
      additionalGuestList: this.additionalGuestList,
      specialRequest: this.specialRequest || null,
      source: this.bookingSrc ? this.bookingSrc : 'Website',
      booker: this.bookerInformation,
      currencyCode: this.hotelConfigService.baseCurrency?.getValue(),
      reservationList: this.bookingInformation?.reservationList?.map((x) => ({
        ...x,
        tripPurpose: this.tripPurpose
      }))
    };

    const lowestPriceOptionList: LowestPriceOptionInput[] = queryParams[
      RouteKeyQueryParams.lowestCode
    ]
      ?.split('~')
      ?.map((code) => {
        return {
          roomProductCode: code,
          salesPlanCode: queryParams[RouteKeyQueryParams.lowestSalesPlan]
        };
      });

    return this.paymentService.requestBooking({
      request: {
        bookingInformation,
        paymentProviderCode: PaymentProviderCodeEnum.Paypal,
        creditCardInformation: {
          refPaymentMethodId: null
        },
        translateTo:
          this.locale === MultiLangEnum.EN
            ? null
            : (this.locale?.toLocaleUpperCase() as LanguageCode),
        promoCodeList: promoCode ? [promoCode] : null,
        lowestPriceOptionList,
        hotelCode,
        ...this.requestBookingInfo
      }
    });
  }

  confirmPaypal(orderId: string) {
    const queryParams = this.route.snapshot.queryParams;
    const propertyCode = queryParams[RouteKeyQueryParams.hotelCode];
    return this.paymentService.confirmBookingPayment({
      input: {
        propertyCode,
        refPaymentId: orderId,
        bookingId: this.bookingId
      }
    });
  }
}
