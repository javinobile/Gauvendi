import AdyenCheckout from '@adyen/adyen-web';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { DataLayerEvents, DataLayerKeys } from '@app/constants/datalayer.enum';
import { ILocation } from '@app/models/location';
import { AbstractPaymentMethodComponent } from '@app/modules/site/components/abstracts/abstract-payment-method.component';
import { GetPaymentMethodIconPipe } from '@app/modules/site/pages/summary-payment/pipes/get-payment-method-icon.pipe';
import { GetPaymentModeStatusPipe } from '@app/modules/site/pages/summary-payment/pipes/get-payment-mode-status.pipe';
import { ParsePaymentMethodNamePipe } from '@app/modules/site/pages/summary-payment/pipes/parse-payment-method-name.pipe';
import { CheckboxCComponent } from '@app/shared/form-controls/checkbox-c/checkbox-c.component';
import { FormErrorComponent } from '@app/shared/form-controls/form-error/form-error.component';
import { InputComponent } from '@app/shared/form-controls/input/input.component';
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
import { BehaviorSubject, lastValueFrom, take } from 'rxjs';

declare var paypal: any;

@Component({
  selector: 'app-adyen-payment',
  standalone: true,
  imports: [
    CommonModule,
    CheckboxCComponent,
    GetPaymentMethodIconPipe,
    GetPaymentModeStatusPipe,
    InputComponent,
    MatExpansionModule,
    MatIconModule,
    ParsePaymentMethodNamePipe,
    ReactiveFormsModule,
    TranslatePipe,
    ParseMetadataConfigPipe,
    FormErrorComponent
  ],
  templateUrl: './adyen-payment.component.html',
  styleUrls: ['./adyen-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdyenPaymentComponent extends AbstractPaymentMethodComponent {
  @ViewChild('frmPayment', { static: false }) frmPayment: ElementRef;
  @ViewChild('cardNumber', { static: false }) cardNumber: ElementRef;
  @ViewChild('expiryDate', { static: false }) expiryDate: ElementRef;
  @ViewChild('cvv', { static: false }) cvv: ElementRef;

  @Input() summaryBooking: BookingPricing;
  @Input() availablePaymentMethodList: AvailablePaymentMethod[];
  @Input() environment: string;
  @Input() originKey: string;
  @Input() clientKey: string;
  @Input() guestInformationValid: boolean;
  @Input() additionalGuestValid: boolean;
  @Input() bookingInformation: BookingInformationInput;
  @Input() additionalGuestList: GuestInformationInput[];
  @Input() guestInformation: GuestInformationInput;
  @Input() specialRequest: string;
  @Input() requestBookingInfo: RequestBookingPaymentInput;
  @Input() locale: string;
  @Input() bookingSrc: string;
  @Input() currencyCode: string;
  @Input() hotelTerm: string;
  @Input() hotelPrivacy: string;
  @Input() tripPurpose: string;
  @Input() companyInfo: Guest;
  @Input() bookerInformation: GuestInformationInput;
  @Input() bookerInformationValid: boolean;
  @Input() isBookForAnother: boolean;
  @Input() location: ILocation;

  @Output() guaranteeMethod = new EventEmitter();
  @Output() needValidation = new EventEmitter();

  hotelPaymentModeCode = HotelPaymentModeCodeEnum;
  selectedPaymentMethodCode: HotelPaymentModeCodeEnum;
  adyenCheckout: any;
  cardInformation: { isValid: boolean; data: any };
  rfPayment = this.fb.group({
    accountHolder: [
      null,
      Validators.compose([
        Validators.required,
        Validators.pattern(/^((?![\d])[\w\s'-])*$/)
      ])
    ]
  });

  termCtrl: FormControl = this.fb.control(false);
  paypalBtnRef;
  bookingId: string;

  cardValid$ = new BehaviorSubject(false);

  isCVVValid$ = new BehaviorSubject(false);
  isCardNumberValid$ = new BehaviorSubject(false);
  isExpiryDateValid$ = new BehaviorSubject(false);
  isCardNumberFocus$ = new BehaviorSubject(false);
  isExpiryDateFocus$ = new BehaviorSubject(false);
  isCVVFocus$ = new BehaviorSubject(false);

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
    if (changes['originKey']) {
      // @ts-ignore
      this.adyenCheckout = new AdyenCheckout({
        environment: this.environment,
        // @ts-ignore
        originKey: this.originKey
      });
    }
    if (changes['clientKey']) {
      // @ts-ignore
      this.adyenCheckout = new AdyenCheckout({
        environment: this.environment,
        // @ts-ignore
        clientKey: this.clientKey
      });
    }

    if (
      (changes.hasOwnProperty('summaryBooking') ||
        changes.hasOwnProperty('availablePaymentMethodList')) &&
      this.availablePaymentMethodList?.length > 0
    ) {
      const selectedPaymentMethodCode =
        this.availablePaymentMethodList?.find(
          (x) => x?.paymentMethodCode === HotelPaymentModeCodeEnum.Guawcc
        )?.paymentMethodCode ||
        this.availablePaymentMethodList[0]?.paymentMethodCode;
      if (selectedPaymentMethodCode === HotelPaymentModeCodeEnum.Guawcc) {
        const initFormInterval = setInterval(() => {
          const cardNumberEl = document.getElementById(
            'card-number-placeholder'
          );
          if (!cardNumberEl) return;

          clearInterval(initFormInterval);
          this.mountForm();
        }, 100);
      }
      this.selectedPaymentMethodCode = selectedPaymentMethodCode;

      if (this.selectedPaymentMethodCode === HotelPaymentModeCodeEnum.Paypal) {
        if (
          document
            ?.getElementById('paypal-button-container')
            ?.innerHTML?.trim() === ''
        ) {
          this.paypalHandler();
        }
      }

      this.guaranteeMethod.emit(this.selectedPaymentMethodCode);
    }
  }

  submitConfirmPayment(): void {
    if (this.selectedPaymentMethodCode !== HotelPaymentModeCodeEnum.Guawcc) {
      if (
        (this.isBookForAnother ? this.bookerInformationValid : true) &&
        this.guestInformationValid &&
        this.additionalGuestValid
      ) {
        this.makePayment();
      } else {
        this.needValidation.emit();
        this.validationErrorMessage$.next('MISSING_DATA');
        window.innerWidth <= 1024
          ? this.scrollToGuestInformation()
          : window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
      }
    } else {
      if (this.rfPayment?.valid) {
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
      } else {
        this.rfPayment.markAsTouched();
      }
    }
  }

  makePayment(): void {
    this.paymentErrorMessage$.next(null);
    const queryParams = this.route.snapshot.queryParams;
    this.trackingService.track(MixpanelKeys.ClickConfirmBooking, {
      name: 'Payment',
      request_id: queryParams[RouteKeyQueryParams.requestId],
      recommendation_id: queryParams[RouteKeyQueryParams.recommendationId],
      booking_flow: queryParams[RouteKeyQueryParams.bookingFlow]
    });
    this.isLockSubmitPayment$.next(true);
    const promoCode = queryParams[RouteKeyQueryParams.promoCode] || null;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];

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
    switch (this.selectedPaymentMethodCode) {
      case HotelPaymentModeCodeEnum.Guawcc:
        if (this.cardInformation.isValid) {
          const {
            encryptedCardNumber,
            encryptedExpiryMonth,
            encryptedExpiryYear,
            encryptedSecurityCode,
            type
          } = this.cardInformation.data.paymentMethod;
          this.paymentService
            .requestBooking({
              request: {
                bookingInformation,
                creditCardInformation: {
                  cardHolder: this.rfPayment?.value?.accountHolder,
                  cardNumber: encryptedCardNumber,
                  cvv: encryptedSecurityCode,
                  expiryMonth: encryptedExpiryMonth,
                  expiryYear: encryptedExpiryYear,
                  type
                },
                // hotelPaymentAccountType: HotelPaymentAccountTypeEnum.Adyen,
                paymentProviderCode: !!this.clientKey
                  ? PaymentProviderCodeEnum.Adyen
                  : PaymentProviderCodeEnum.ApaleoPay,
                translateTo:
                  this.locale === MultiLangEnum.EN
                    ? null
                    : (this.locale?.toLocaleUpperCase() as LanguageCode),
                promoCodeList: promoCode ? [promoCode] : null,
                lowestPriceOptionList,
                hotelCode,
                browserAgentIp: this.location?.ip || '::1',
                browserInfo: {
                  acceptHeader: navigator.userAgent,
                  colorDepth: window.screen.colorDepth,
                  language: navigator.language,
                  javaEnabled: false,
                  screenHeight: window.screen.height,
                  screenWidth: window.screen.width,
                  userAgent: navigator.userAgent,
                  timeZoneOffset: new Date().getTimezoneOffset()
                },
                origin: window.origin,
                ...this.requestBookingInfo
              }
            })
            .pipe(take(1))
            .subscribe({
              next: ({ status, message, data }) => {
                if (status === 'SUCCESS') {
                  const bookingPaymentResponse: BookingPaymentResponse =
                    data as BookingPaymentResponse;
                  this.router
                    .navigate([RouterPageKey.bookingProcessing], {
                      queryParams: {
                        [RouteKeyQueryParams.paymentId]:
                          bookingPaymentResponse?.booking?.id,
                        [RouteKeyQueryParams.currency]:
                          this.route.snapshot.queryParams[
                            RouteKeyQueryParams.currency
                          ],
                        [RouteKeyQueryParams.hotelCode]:
                          this.route.snapshot.queryParams[
                            RouteKeyQueryParams.hotelCode
                          ],
                        [RouteKeyQueryParams.lang]:
                          this.route.snapshot.queryParams[
                            RouteKeyQueryParams.lang
                          ],
                        [RouteKeyQueryParams.bookingSrc]:
                          this.route.snapshot.queryParams[
                            RouteKeyQueryParams.bookingSrc
                          ],
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
                  this.handleBookingError(data, message, queryParams);
                }
              },
              error: () => {
                this.isLockSubmitPayment$.next(false);
                this.paymentErrorMessage$.next(
                  'REQUEST_BOOKING_PAYMENT_FAILED'
                );
              }
            });
        }
        break;
      default:
        this.paymentService
          .requestBooking({
            request: {
              bookingInformation,
              paymentProviderCode: !!this.clientKey
                ? PaymentProviderCodeEnum.Adyen
                : PaymentProviderCodeEnum.ApaleoPay,
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
          })
          .subscribe({
            next: (res) => {
              const { status, data, message } = res;
              if (status === 'SUCCESS') {
                const bookingPaymentResponse: BookingPaymentResponse =
                  data as BookingPaymentResponse;
                this.router
                  .navigate([RouterPageKey.bookingProcessing], {
                    queryParams: {
                      [RouteKeyQueryParams.paymentId]:
                        bookingPaymentResponse?.booking?.id,
                      [RouteKeyQueryParams.currency]:
                        this.route.snapshot.queryParams[
                          RouteKeyQueryParams.currency
                        ],
                      [RouteKeyQueryParams.hotelCode]:
                        this.route.snapshot.queryParams[
                          RouteKeyQueryParams.hotelCode
                        ],
                      [RouteKeyQueryParams.lang]:
                        this.route.snapshot.queryParams[
                          RouteKeyQueryParams.lang
                        ],
                      [RouteKeyQueryParams.bookingSrc]:
                        this.route.snapshot.queryParams[
                          RouteKeyQueryParams.bookingSrc
                        ],
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
                this.handleBookingError(data, message, queryParams);
              }
            },
            error: () => {
              this.isLockSubmitPayment$.next(false);
              this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
            }
          });
        break;
    }
  }

  handleBookingError(data, message, queryParams) {
    this.isLockSubmitPayment$.next(false);

    switch (message) {
      case 'REQUIRE_ACTION':
        // 3DS authentication
        const bookingPaymentResponse: BookingPaymentResponse =
          data as BookingPaymentResponse;
        // store hotelCode, language and currency,...
        localStorage.setItem(
          'hotelCode',
          queryParams[RouteKeyQueryParams.hotelCode]
        );
        localStorage.setItem('language', queryParams[RouteKeyQueryParams.lang]);
        localStorage.setItem(
          'currency',
          queryParams[RouteKeyQueryParams.currency]
        );
        localStorage.setItem(
          'payAtHotelAmount',
          this.summaryBooking?.payAtHotelAmount
        );
        localStorage.setItem(
          'payOnConfirmationAmount',
          this.summaryBooking?.payOnConfirmationAmount
        );
        localStorage.setItem(
          'totalGrossAmount',
          this.summaryBooking?.totalGrossAmount
        );
        localStorage.setItem(
          'totalBaseAmount',
          this.summaryBooking?.totalBaseAmount
        );
        localStorage.setItem(
          'arrival',
          this.summaryBooking?.reservationPricingList?.[0]?.arrival
        );
        localStorage.setItem(
          'departure',
          this.summaryBooking?.reservationPricingList?.[0]?.departure
        );
        localStorage.setItem(
          'timezone',
          this.hotelConfigService?.hotelTimezone?.value
        );
        localStorage.setItem(
          'requestId',
          queryParams[RouteKeyQueryParams.requestId]
        );
        localStorage.setItem(
          'recommendationId',
          queryParams[RouteKeyQueryParams.recommendationId]
        );
        localStorage.setItem(
          'baseObject',
          JSON.stringify({
            ...this.trackingService.getTrackingObj()
          })
        );
        this.adyenCheckout
          .createFromAction({
            ...bookingPaymentResponse.action,
            data: {
              MD: bookingPaymentResponse?.action?.data?.MD,
              PaReq: bookingPaymentResponse?.action?.data?.paReq,
              TermUrl: bookingPaymentResponse?.action?.data?.termUrl
            }
          })
          .mount(this.frmPayment.nativeElement);
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
      case 'ADYEN_ERROR_CODE_902':
        this.paymentErrorMessage$.next('INVALID_OR_EMPTY_REQUEST_DATA');
        break;
      case 'ADYEN_ERROR_CODE_903':
        this.paymentErrorMessage$.next('INTERNAL_ERROR');
        break;
      case 'ADYEN_ERROR_CODE_904':
        this.paymentErrorMessage$.next('UNABLE_TO_PROCESS');
        break;
      case 'ADYEN_ERROR_CODE_905':
      case 'ADYEN_ERROR_CODE_905_1':
      case 'ADYEN_ERROR_CODE_905_2':
      case 'ADYEN_ERROR_CODE_905_3':
      case 'ADYEN_ERROR_CODE_905_4':
      case 'ADYEN_ERROR_CODE_905_5':
      case 'ADYEN_ERROR_CODE_905_6':
        this.paymentErrorMessage$.next('PAYMENT_DETAILS_ARE_NOT_SUPPORTED');
        break;
      case 'ADYEN_ERROR_CODE_906':
      case 'ADYEN_ERROR_CODE_908':
        this.paymentErrorMessage$.next('INVALID_REQUEST');
        break;
      case 'ADYEN_ERROR_CODE_907':
        this.paymentErrorMessage$.next(
          'PAYMENT_DETAILS_ARE_NOT_SUPPORTED_FOR_THIS_COUNTRY'
        );
        break;
      case 'ADYEN_ERROR_CODE_916':
        this.paymentErrorMessage$.next('TRANSACTION_AMOUNT_EXCEEDS');
        break;
      default:
        this.paymentErrorMessage$.next(null);
        this.paymentErrorMessageDraw$.next(message);
        break;
    }
  }

  mountForm(): void {
    if (!this.frmPayment?.nativeElement) return;

    this.adyenCheckout
      .create('securedfields', {
        type: 'card',
        placeholders: {
          encryptedCardNumber: '',
          encryptedExpiryDate: '',
          encryptedSecurityCode: ''
        },
        styles: this.elementOptionsAdyen(),
        autoFocus: false,
        onError: (res) => this.handlerFrmPaymentValidation(res),
        onChange: (res) => this.handleChangeCard(res),
        onFocus: (res) => this.handleFocusCard(res),
        onFieldValid: (res) => this.handleFieldValid(res)
      })
      .mount(this.frmPayment.nativeElement);
  }

  handleFocusCard(data): void {
    this.isCardNumberFocus$.next(data?.fieldType === 'encryptedCardNumber');
    this.isExpiryDateFocus$.next(data?.fieldType === 'encryptedExpiryDate');
    this.isCVVFocus$.next(data?.fieldType === 'encryptedSecurityCode');
  }

  handleFieldValid(data): void {
    this.isCardNumberValid$.next(
      data?.fieldType === 'encryptedCardNumber' && data?.valid
    );
    this.isExpiryDateValid$.next(
      data?.fieldType === 'encryptedExpiryDate' && data?.valid
    );
    this.isCVVValid$.next(
      data?.fieldType === 'encryptedSecurityCode' && data?.valid
    );
  }

  handleChangeCard(data): void {
    this.cardInformation = data;
    this.cardValid$.next(this.cardInformation?.isValid);
  }

  elementOptionsAdyen(): any {
    return {
      base: {
        fontSize: '16px',
        color: this.hotelConfigService.colorText$?.getValue()
      },
      error: {
        color: 'red',
        borderColor: 'red'
      }
    };
  }

  handlerFrmPaymentValidation(res: {
    fieldType:
      | 'encryptedCardNumber'
      | 'encryptedExpiryDate'
      | 'encryptedSecurityCode';
    error: string;
  }) {
    switch (res.fieldType) {
      case 'encryptedCardNumber': {
        res.error.length
          ? this.renderer.addClass(this.cardNumber.nativeElement, 'error')
          : this.renderer.removeClass(this.cardNumber.nativeElement, 'error');
        break;
      }
      case 'encryptedExpiryDate': {
        res.error.length
          ? this.renderer.addClass(this.expiryDate.nativeElement, 'error')
          : this.renderer.removeClass(this.expiryDate.nativeElement, 'error');
        break;
      }
      case 'encryptedSecurityCode': {
        res.error.length
          ? this.renderer.addClass(this.cvv.nativeElement, 'error')
          : this.renderer.removeClass(this.cvv.nativeElement, 'error');
        break;
      }
    }
  }

  onPaymentMethodChange(paymentMethodCode: HotelPaymentModeCodeEnum): void {
    if (this.selectedPaymentMethodCode === paymentMethodCode) return;

    if (paymentMethodCode) {
      this.guaranteeMethod.next(paymentMethodCode);
      this.selectedPaymentMethodCode = paymentMethodCode;
      switch (paymentMethodCode) {
        case HotelPaymentModeCodeEnum.Noguar:
          break;
        case HotelPaymentModeCodeEnum.Guawcc:
          this.mountForm();
          break;
        case HotelPaymentModeCodeEnum.Guawde:
          break;
        case HotelPaymentModeCodeEnum.Paypal:
          if (
            document
              ?.getElementById('paypal-button-container')
              ?.innerHTML?.trim() === ''
          ) {
            this.paypalHandler();
          }
          break;
      }
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
            this.handleBookingError(
              createOrderResponse?.data,
              createOrderResponse?.message,
              this.route.snapshot.queryParams
            );
          }

          this.handleBookingError(
            createOrderResponse?.data,
            createOrderResponse?.message,
            this.route.snapshot.queryParams
          );
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
                  [RouteKeyQueryParams.currency]:
                    this.route.snapshot.queryParams[
                      RouteKeyQueryParams.currency
                    ],
                  [RouteKeyQueryParams.hotelCode]:
                    this.route.snapshot.queryParams[
                      RouteKeyQueryParams.hotelCode
                    ],
                  [RouteKeyQueryParams.lang]:
                    this.route.snapshot.queryParams[RouteKeyQueryParams.lang],
                  [RouteKeyQueryParams.bookingSrc]:
                    this.route.snapshot.queryParams[
                      RouteKeyQueryParams.bookingSrc
                    ],
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
