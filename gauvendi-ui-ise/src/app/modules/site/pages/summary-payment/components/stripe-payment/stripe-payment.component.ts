import { CommonModule, TitleCasePipe } from '@angular/common';
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
import {
  PaymentMethod,
  Stripe,
  StripeCardCvcElement,
  StripeCardCvcElementOptions,
  StripeCardElementOptions,
  StripeCardExpiryElement,
  StripeCardExpiryElementOptions,
  StripeCardNumberElement,
  StripeElements
} from '@stripe/stripe-js';
import {
  BehaviorSubject,
  from,
  lastValueFrom,
  Observable,
  of,
  throwError
} from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

declare var paypal: any;

@Component({
  selector: 'app-stripe-payment',
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
    FormErrorComponent,
    TitleCasePipe
  ],
  templateUrl: './stripe-payment.component.html',
  styleUrls: ['./stripe-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StripePaymentComponent extends AbstractPaymentMethodComponent {
  @ViewChild('cardNumber', { static: false }) cardNumber: ElementRef;
  @ViewChild('expiryDate', { static: false }) expiryDate: ElementRef;
  @ViewChild('cvv', { static: false }) cvv: ElementRef;

  @Input() availablePaymentMethodList: AvailablePaymentMethod[];
  @Input() summaryBooking: BookingPricing;
  @Input() stripeConnect: Stripe;
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

  elements: StripeElements;
  selectedPaymentMethodCode: HotelPaymentModeCodeEnum;
  hotelPaymentModeCode = HotelPaymentModeCodeEnum;
  elementCardNumber: StripeCardNumberElement;
  elementExpiryDate: StripeCardExpiryElement;
  elementCVV: StripeCardCvcElement;
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
    if (changes['stripeConnect'] && this.stripeConnect) {
      this.elements = this.stripeConnect.elements();
      this.elementCardNumber = this.elements.create(
        'cardNumber',
        this.elementOptions('')
      );
      this.elementExpiryDate = this.elements.create(
        'cardExpiry',
        this.elementOptions('mm/yy')
      );
      this.elementCVV = this.elements.create(
        'cardCvc',
        this.elementOptions('CVV')
      );

      // Store status of input
      this.elementCardNumber.on('change', (event) =>
        this.isCardNumberValid$.next(event.complete)
      );
      this.elementExpiryDate.on('change', (event) =>
        this.isExpiryDateValid$.next(event.complete)
      );
      this.elementCVV.on('change', (event) =>
        this.isCVVValid$.next(event.complete)
      );
      this.elementCardNumber.on('focus', () =>
        this.isCardNumberFocus$.next(true)
      );
      this.elementExpiryDate.on('focus', () =>
        this.isExpiryDateFocus$.next(true)
      );
      this.elementCVV.on('focus', () => this.isCVVFocus$.next(true));
    }

    if (
      (changes['summaryBooking'] ||
        changes['currencyCode'] ||
        changes['availablePaymentMethodList']) &&
      this.summaryBooking &&
      this.availablePaymentMethodList?.length > 0
    ) {
      this.selectedPaymentMethodCode =
        this.availablePaymentMethodList?.find(
          (x) => x?.paymentMethodCode === HotelPaymentModeCodeEnum.Guawcc
        )?.paymentMethodCode ||
        this.availablePaymentMethodList[0]?.paymentMethodCode;
      if (this.selectedPaymentMethodCode === HotelPaymentModeCodeEnum.Guawcc) {
        const initFormInterval = setInterval(() => {
          const cardNumberEl = document.getElementById(
            'card-number-placeholder'
          );
          if (!cardNumberEl) return;

          clearInterval(initFormInterval);
          this.mountForm();
        }, 100);
      }

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

  onPaymentMethodChange(paymentMethodCode: HotelPaymentModeCodeEnum): void {
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

  submitConfirmPayment(): void {
    if (this.selectedPaymentMethodCode !== HotelPaymentModeCodeEnum.Guawcc) {
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
      if (this.rfPayment.valid) {
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
        this.paymentErrorMessage$.next('CARD_INFO_REQUIRED');
      }
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

    switch (this.selectedPaymentMethodCode) {
      case HotelPaymentModeCodeEnum.Guawcc:
        const paymentId$: Observable<{
          paymentMethod?: PaymentMethod;
          error?: any;
        }> = from(
          this.stripeConnect.createPaymentMethod({
            type: 'card',
            card: this.elements.getElement('cardNumber'),
            billing_details: {
              name:
                this.rfPayment.value?.accountHolder ||
                `${this.guestInformation?.firstName} ${this.guestInformation?.lastName}`,
              email: this.guestInformation?.emailAddress
            }
          })
        );

        const requestBookingPayment$ = ({ paymentMethod, error }) => {
          if (paymentMethod) {
            return this.paymentService
              .requestBooking({
                request: {
                  bookingInformation,
                  paymentProviderCode: PaymentProviderCodeEnum.GauvendiPay,
                  creditCardInformation: {
                    refPaymentMethodId: paymentMethod['id']
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
              .pipe(
                map((res) => ({
                  refId: paymentMethod['id'],
                  code: res?.code,
                  status: res?.status,
                  message: res?.message,
                  data: res?.data as BookingPaymentResponse
                }))
              );
          }
          return of({
            refId: null,
            code: null,
            status: 'ERROR',
            message: error?.message,
            data: null
          });
        };

        paymentId$.pipe(switchMap(requestBookingPayment$)).subscribe({
          next: (res) => {
            const { refId } = res;
            if (refId) {
              const { status, message, data, code } = res;
              if (status === 'SUCCESS') {
                this.router
                  .navigate([RouterPageKey.bookingProcessing], {
                    queryParams: {
                      [RouteKeyQueryParams.paymentId]: (
                        data as BookingPaymentResponse
                      )?.booking?.id,
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
                    }
                  })
                  .then(null);
              } else {
                this.handleErrorMessage(message, code);
              }
            } else {
              const { status, data, message, code } = res;
              if (status === 'SUCCESS') {
                this.router
                  .navigate([RouterPageKey.bookingProcessing], {
                    queryParams: {
                      [RouteKeyQueryParams.paymentId]: (
                        data as BookingPaymentResponse
                      )?.booking?.id,
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
                    }
                  })
                  .then(null);
              } else {
                this.isLockSubmitPayment$.next(false);
                if (message?.includes('_')) {
                  this.handleErrorMessage(message, code);
                } else {
                  this.renderErrorMessage(code, message);
                }
              }
            }
          },
          error: () => {
            this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
          }
        });
        break;
      default:
        this.paymentService
          .requestBooking({
            request: {
              bookingInformation,
              paymentProviderCode: PaymentProviderCodeEnum.GauvendiPay,
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
          .pipe(
            catchError((err) => {
              this.isLockSubmitPayment$.next(false);
              return throwError(() => err);
            })
          )
          .subscribe((res) => {
            const { status, data, message, code } = res;
            if (status === 'SUCCESS') {
              this.router
                .navigate([RouterPageKey.bookingProcessing], {
                  queryParams: {
                    [RouteKeyQueryParams.paymentId]: (
                      data as BookingPaymentResponse
                    )?.booking?.id,
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
              this.handleErrorMessage(message, code);
            }
          });
        break;
    }
  }

  handleErrorMessage(message: string, code: string): void {
    this.isLockSubmitPayment$.next(false);
    switch (message) {
      case 'BOOKING_NOT_AVAILABLE':
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
        this.paymentErrorMessage$.next('BOOKING_NOT_AVAILABLE');
        break;
      case 'BOOKING_RFC_NOT_AVAILABLE':
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
        this.renderErrorMessage(code, message);
        break;
    }
  }

  renderErrorMessage(code: string, message: string): void {
    if (code === code?.toLocaleUpperCase()) {
      // System message
      this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
    } else {
      // Stripe message
      const messageParts = message?.split(';');
      if (messageParts?.length > 0) {
        this.paymentErrorMessage$.next(messageParts[0]);
      } else {
        this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
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

  elementOptions(
    textHolder: string = ''
  ):
    | StripeCardElementOptions
    | StripeCardExpiryElementOptions
    | StripeCardCvcElementOptions {
    const textColor = this.hotelConfigService.colorText$?.value;
    const hotelFontFamily = this.hotelConfigService.hotelFontFamily?.value;
    const fontStyle = this.parseFontStyle(hotelFontFamily);

    return {
      classes: { base: 'input-component', invalid: 'error' },
      style: {
        base: {
          fontSize: '16px',
          color: textColor,
          ...fontStyle
        }
      },
      placeholder: textHolder
    };
  }

  parseFontStyle(input: string): { fontFamily: string; fontWeight: string } {
    if (!input) return { fontFamily: 'inherit', fontWeight: 'normal' };

    const VALID_WEIGHTS = [
      'bold',
      'normal',
      'light',
      'medium',
      'semibold',
      'thin'
    ];
    const IGNORED_PARTS = ['-', 'rest'];

    const parts = input.split('+');
    const fontNames: string[] = [];
    let fontWeight = 'normal';

    parts.forEach((part) => {
      const normalizedPart = part.toLowerCase().trim();

      if (VALID_WEIGHTS.includes(normalizedPart)) {
        fontWeight = normalizedPart;
      } else if (!IGNORED_PARTS.includes(normalizedPart) && normalizedPart) {
        fontNames.push(new TitleCasePipe().transform(part));
      }
    });

    return {
      fontFamily: `${fontNames.join(', ')}, sans-serif`,
      fontWeight
    };
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
            this.handleErrorMessage(
              createOrderResponse?.message,
              createOrderResponse?.code
            );
          }

          this.handleErrorMessage(
            createOrderResponse?.message,
            createOrderResponse?.code
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

  mountForm(): void {
    this.elementCardNumber.mount(this.cardNumber.nativeElement);
    this.elementExpiryDate.mount(this.expiryDate.nativeElement);
    this.elementCVV.mount(this.cvv.nativeElement);
  }
}
