import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
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
import * as moment from 'moment';
import { BehaviorSubject, lastValueFrom, of } from 'rxjs';
import { map, skipWhile, switchMap } from 'rxjs/operators';

declare var paypal: any;

@Component({
  selector: 'app-no-opi-payment',
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
    InputComponent,
    MatIconModule,
    CheckboxCComponent,
    ParseMetadataConfigPipe,
    FormErrorComponent
  ],
  templateUrl: './no-opi-payment.component.html',
  styleUrls: ['./no-opi-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoOpiPaymentComponent extends AbstractPaymentMethodComponent {
  @Input() availablePaymentMethodList: AvailablePaymentMethod[];
  @Input() summaryBooking: BookingPricing;
  @Input() merchantId: string;
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
  secureFields: any;
  expiryDateValue: any;
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

  isCVVValid$ = new BehaviorSubject(null);
  isCardNumberValid$ = new BehaviorSubject(null);
  isFormError$ = new BehaviorSubject(false);
  transactionId$ = new BehaviorSubject(null);
  maskedCardInfo$ = new BehaviorSubject(null);
  isExpiryDateValid$ = new BehaviorSubject(null);

  secureFieldsError$ = new BehaviorSubject<string>(null);
  isCVVFocus$ = new BehaviorSubject(null);
  isCardNumberFocus$ = new BehaviorSubject(null);

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

  mountForm(): void {
    if (this.secureFields) {
      this.secureFields.destroy();
    }
    // @ts-ignore
    this.secureFields = new SecureFields();
    this.secureFields.initTokenize(this.merchantId, {
      cardNumber: 'card-number-placeholder',
      cvv: 'cvv-placeholder'
    });

    const textColor = this.hotelConfigService.colorText$?.value;
    this.secureFields.on('ready', () => {
      this.secureFields.setStyle(
        'cardNumber',
        'font-size: 16px; color: ' + textColor
      );
      this.secureFields.setStyle('cvv', 'font-size: 16px; color: ' + textColor);
    });

    this.secureFields.on('change', (data) => {
      switch (data?.event?.field) {
        case 'cardNumber':
          this.isCardNumberValid$.next(data.fields.cardNumber?.valid);
          this.isCardNumberFocus$.next(data?.event?.type === 'blur');
          break;
        default:
          this.isCVVValid$.next(data.fields.cvv?.valid);
          this.isCVVFocus$.next(data?.event?.type === 'blur');
          break;
      }

      this.isFormError$.next(data?.hasErrors);
    });

    this.secureFields.on('cardInfo', (data) => {
      this.maskedCardInfo$.next(data?.maskedCard);
    });

    this.secureFields.on('error', (data: { action: string; error: string }) => {
      // handle error data trans
      this.secureFieldsError$.next(data?.error);
      this.isLockSubmitPayment$.next(false);
    });

    this.secureFields.on('success', (data) => {
      if (data.transactionId) {
        this.transactionId$.next(data.transactionId);
      }
    });
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

  formatExpiry(val): string {
    let tmp = val;
    if (val?.length === 3 && val.indexOf('/') === -1) {
      tmp = tmp.slice(0, 2) + '/' + val[2];
    }
    const p1 = parseInt(tmp[0], 10);
    const p2 = parseInt(tmp[1], 10);
    return /^\d$/.test(val) && '0' !== val && '1' !== val
      ? '0' + val + '/'
      : /^\d\d$/.test(val)
        ? p2 > 2 && 0 !== p1
          ? '0' + p1 + '/' + p2
          : '' + val + '/'
        : tmp;
  }

  numberOnly(event): boolean {
    const charCode = event.charCode ? event.charCode : event.keyCode;
    return !(charCode > 31 && (charCode < 48 || charCode > 57));
  }

  onChangeExpiryDate(event): void {
    this.expiryDateValue = this.formatExpiry(event?.target?.value);
  }

  validateExpiryDate(): void {
    if (this.expiryDateValue?.split('/')?.length === 2) {
      const [month, year] = this.expiryDateValue?.split('/');
      const temp = `${month}/01/${year}`;
      if (moment(new Date(temp)).isBefore(moment(new Date()))) {
        this.isExpiryDateValid$.next(false);
      } else {
        this.isExpiryDateValid$.next(true);
      }
    } else {
      this.isExpiryDateValid$.next(false);
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
          // reset transactionId
          this.transactionId$.next(null);
          // submit form to get transaction id
          this.secureFields.submit();
          // call function to get card info
          this.secureFields.getCardInfo();
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
        const requestBookingPayment$ = (transactionId) => {
          if (transactionId) {
            const [month, year] = this.expiryDateValue?.split('/');
            const date = moment(new Date(`${month}/01/${year}`));
            return this.paymentService
              .requestBooking({
                request: {
                  bookingInformation,
                  paymentProviderCode: PaymentProviderCodeEnum.Opi,
                  creditCardInformation: {
                    cardNumber: this.maskedCardInfo$?.value
                      ? this.maskedCardInfo$?.value
                      : '****************',
                    cardHolder:
                      this.rfPayment.value?.accountHolder ||
                      `${this.guestInformation?.firstName} ${this.guestInformation?.lastName}`,
                    expiryMonth: date.format('MM'),
                    expiryYear: date?.format('yyyy')
                  },
                  transactionId,
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
                  code: res?.code,
                  status: res?.status,
                  message: res?.message,
                  data: res?.data as BookingPaymentResponse
                }))
              );
          }
          return of({
            code: null,
            status: 'ERROR',
            message: null,
            data: null
          });
        };

        this.transactionId$
          .pipe(
            skipWhile((data) => !data),
            switchMap(requestBookingPayment$)
          )
          .subscribe({
            next: (res) => {
              const { status, message, data, code } = res;
              if (status === 'SUCCESS') {
                this.isLockSubmitPayment$.next(false);
                this.router
                  .navigate([RouterPageKey.bookingProcessing], {
                    queryParams: {
                      [RouteKeyQueryParams.paymentId]: (
                        data as BookingPaymentResponse
                      )?.booking?.id,
                      [RouteKeyQueryParams.hotelCode]:
                        this.route.snapshot.queryParams?.[
                          RouteKeyQueryParams.hotelCode
                        ],
                      [RouteKeyQueryParams.currency]:
                        this.route.snapshot.queryParams[
                          RouteKeyQueryParams.currency
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
                this.transactionId$.next(null);
                switch (message) {
                  case 'CHARGE_CREDIT_CARD_FAILED':
                    this.paymentErrorMessage$.next('CHARGE_CREDIT_CARD_FAILED');
                    break;
                  case 'TOKENIZE_CARD_FAILED':
                    this.paymentErrorMessage$.next('TOKENIZE_CARD_FAILED');
                    break;
                  case 'CREATE_MEWS_CUSTOMER_FAILED':
                    this.paymentErrorMessage$.next(
                      'CREATE_MEWS_CUSTOMER_FAILED'
                    );
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
                    this.paymentErrorMessage$.next(
                      'REQUIRE_HOTEL_PAYMENT_MODE_CODE'
                    );
                    break;
                  case 'REQUEST_AFTER_OPERATION_CLOSING_TIME':
                    this.paymentErrorMessage$.next(
                      'REQUEST_AFTER_OPERATION_CLOSING_TIME'
                    );
                    break;
                  case 'INVALID_CAPACITY':
                    this.paymentErrorMessage$.next('INVALID_CAPACITY');
                    break;
                  default:
                    this.renderErrorMessage(code, message);
                    break;
                }
                this.isLockSubmitPayment$.next(false);
              }
            },
            error: () => {
              this.transactionId$.next(null);
              this.isLockSubmitPayment$.next(false);

              this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
            }
          });
        break;
      default:
        this.paymentService
          .requestBooking({
            request: {
              bookingInformation,
              paymentProviderCode: PaymentProviderCodeEnum.MewsPayment,
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
                        this.route.snapshot.queryParams?.[
                          RouteKeyQueryParams.hotelCode
                        ],
                      [RouteKeyQueryParams.currency]:
                        this.route.snapshot.queryParams[
                          RouteKeyQueryParams.currency
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
                this.isLockSubmitPayment$.next(false);
                this.transactionId$.next(null);
                this.handleErrorMessage(message, code);
              }
            },
            error: () => {
              this.isLockSubmitPayment$.next(false);
              this.transactionId$.next(null);

              this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
            }
          });
        break;
    }
  }

  handleErrorMessage(message: string, code: string) {
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
