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
import { AbstractPaymentMethodComponent } from '@app/modules/site/components/abstracts/abstract-payment-method.component';
import { DialogDeclinedConfirmationComponent } from '@app/modules/site/pages/booking-proposal/dialogs/dialog-declined-confirmation/dialog-declined-confirmation.component';
import { GetPaymentMethodIconPipe } from '@app/modules/site/pages/summary-payment/pipes/get-payment-method-icon.pipe';
import { GetPaymentModeStatusPipe } from '@app/modules/site/pages/summary-payment/pipes/get-payment-mode-status.pipe';
import { ParsePaymentMethodNamePipe } from '@app/modules/site/pages/summary-payment/pipes/parse-payment-method-name.pipe';
import { CheckboxCComponent } from '@app/shared/form-controls/checkbox-c/checkbox-c.component';
import { FormErrorComponent } from '@app/shared/form-controls/form-error/form-error.component';
import { InputComponent } from '@app/shared/form-controls/input/input.component';
import { ParseMetadataConfigPipe } from '@app/shared/pipes/parse-metadata-config.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  AvailablePaymentMethod,
  Booking,
  BookingPaymentResponse,
  ConfirmBookingResponse,
  Guest,
  GuestInformationInput,
  HotelPaymentModeCodeEnum,
  PaymentProviderCodeEnum,
  PersonInput,
  ReservationInput
} from '@core/graphql/generated/graphql';
import { BookerForSomeoneModel } from '@models/booker-for-someone.model';
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
  noop,
  Observable,
  of
} from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-proposal-stripe',
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
  templateUrl: './proposal-stripe.component.html',
  styleUrls: ['./proposal-stripe.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProposalStripeComponent extends AbstractPaymentMethodComponent {
  @ViewChild('cardNumber', { static: false }) cardNumber: ElementRef;
  @ViewChild('expiryDate', { static: false }) expiryDate: ElementRef;
  @ViewChild('cvv', { static: false }) cvv: ElementRef;
  @Input() availablePaymentMethodList: AvailablePaymentMethod[];
  @Input() summaryBooking: Booking;
  @Input() stripeConnect: Stripe;
  @Input() guestInformationValid: boolean;
  @Input() locale: string;
  @Input() currencyCode: string;
  @Input() currencyRate: number;
  @Input() additionalGuestList: {
    reservationId: string;
    guestList: { firstName: string; lastName: string; id: string }[];
  }[];
  @Input() guestInformation: GuestInformationInput;
  @Input() bookerInformation: BookerForSomeoneModel;
  @Input() companyInformation: Guest;
  @Input() specialRequest: {
    reservationNumber: string;
    specialRequest: string;
  }[];
  @Input() additionalGuestValid: boolean;
  @Input() bookerInformationValid: boolean;
  @Input() hotelTerm: string;
  @Input() hotelPrivacy: string;
  @Input() bookingNotes: string;
  @Input() bookingNotesValid: boolean;

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
        setTimeout(() => {
          this.elementCardNumber.mount(this.cardNumber.nativeElement);
          this.elementExpiryDate.mount(this.expiryDate.nativeElement);
          this.elementCVV.mount(this.cvv.nativeElement);
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
          setTimeout(() => {
            this.elementCardNumber.mount(this.cardNumber.nativeElement);
            this.elementExpiryDate.mount(this.expiryDate.nativeElement);
            this.elementCVV.mount(this.cvv.nativeElement);
          }, 100);
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
    if (this.bookerInformationValid) {
      if (this.selectedPaymentMethodCode !== HotelPaymentModeCodeEnum.Guawcc) {
        if (
          this.bookerInformation?.bookForAnother
            ? this.guestInformationValid &&
              this.additionalGuestValid &&
              this.bookingNotesValid
            : this.additionalGuestValid && this.bookingNotesValid
        ) {
          this.makePayment();
        } else {
          this.validationErrorMessage$.next('MISSING_DATA');
          this.needValidation.emit();
          window.innerWidth <= 1024
            ? noop()
            : window.scrollTo({
                top:
                  (
                    document.querySelector(
                      'app-guest-information'
                    ) as HTMLElement
                  )?.offsetTop || 0,
                behavior: 'smooth'
              });
        }
      } else {
        if (this.rfPayment.valid) {
          if (
            this.bookerInformation?.bookForAnother
              ? this.guestInformationValid &&
                this.additionalGuestValid &&
                this.bookingNotesValid
              : this.additionalGuestValid && this.bookingNotesValid
          ) {
            this.makePayment();
          } else {
            this.validationErrorMessage$.next('MISSING_DATA');
            this.needValidation.emit();
            window.innerWidth <= 1024
              ? noop()
              : window.scrollTo({
                  top:
                    (this.elementRef.nativeElement as HTMLElement)?.offsetTop ||
                    0,
                  behavior: 'smooth'
                });
          }
        } else {
          this.paymentErrorMessage$.next('CARD_INFO_REQUIRED');
        }
      }
    } else {
      this.validationErrorMessage$.next('MISSING_DATA');
      this.needValidation.emit();
      window.innerWidth <= 1024
        ? noop()
        : window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
    }
  }

  makePayment(): void {
    this.paymentErrorMessage$.next(null);
    this.isLockSubmitPayment$.next(true);
    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    const reservationInput = this.prepareReservationInput();

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
              .confirmBookingProposal({
                input: {
                  hotelCode,
                  creditCardInformation: {
                    refPaymentMethodId: paymentMethod['id']
                  },
                  paymentProviderCode: PaymentProviderCodeEnum.GauvendiPay,
                  booking: {
                    reservationList: reservationInput,
                    id: this.summaryBooking?.id,
                    hotelPaymentModeCode: this.selectedPaymentMethodCode,
                    booker: {
                      phoneInfo: {
                        phoneCode: this.bookerInformation?.phoneInfo?.phoneCode,
                        phoneNumber:
                          this.bookerInformation?.phoneInfo?.phoneNumber
                      },
                      firstName: this.bookerInformation?.firstName,
                      lastName: this.bookerInformation?.lastName,
                      address: this.bookerInformation?.address,
                      city: this.bookerInformation?.city,
                      countryId: this.bookerInformation?.countryId,
                      postalCode: this.bookerInformation?.postalCode,
                      ...this.companyInformation
                    },
                    specialRequest: this.bookingNotes
                  }
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

        paymentId$
          .pipe(
            switchMap(requestBookingPayment$),
            finalize(() => this.isLockSubmitPayment$.next(false))
          )
          .subscribe(
            (res) => {
              const { refId } = res;
              if (refId) {
                const { status, message, data, code } = res;
                if (status === 'SUCCESS') {
                  const confirmProposalResponse: ConfirmBookingResponse =
                    data as ConfirmBookingResponse;
                  this.router
                    .navigate([RouterPageKey.bookingProcessing], {
                      queryParams: {
                        [RouteKeyQueryParams.currency]:
                          queryParams[RouteKeyQueryParams.currency],
                        [RouteKeyQueryParams.hotelCode]:
                          queryParams[RouteKeyQueryParams.hotelCode],
                        [RouteKeyQueryParams.lang]:
                          queryParams[RouteKeyQueryParams.lang],
                        [RouteKeyQueryParams.paymentId]:
                          confirmProposalResponse?.booking?.id
                      },
                      queryParamsHandling: 'preserve'
                    })
                    .then(() => {});
                } else {
                  this.handleErrorMessage(message, code);
                }
              } else {
                const { status, data, message, code } = res;
                if (status === 'SUCCESS') {
                  const confirmProposalResponse: ConfirmBookingResponse =
                    data as ConfirmBookingResponse;
                  this.router
                    .navigate([RouterPageKey.paymentResult], {
                      queryParams: {
                        [RouteKeyQueryParams.currency]:
                          queryParams[RouteKeyQueryParams.currency],
                        [RouteKeyQueryParams.hotelCode]:
                          queryParams[RouteKeyQueryParams.hotelCode],
                        [RouteKeyQueryParams.lang]:
                          queryParams[RouteKeyQueryParams.lang],
                        [RouteKeyQueryParams.paymentId]:
                          confirmProposalResponse?.booking?.id
                      },
                      queryParamsHandling: 'preserve'
                    })
                    .then(() => {});
                } else {
                  if (message?.includes('_')) {
                    this.handleErrorMessage(message, code);
                  } else {
                    this.renderErrorMessage(code, message);
                  }
                }
              }
            },
            () => {
              this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
            }
          );
        break;
      default:
        this.paymentService
          .confirmBookingProposal({
            input: {
              hotelCode,
              creditCardInformation: {
                refPaymentMethodId: null
              },
              paymentProviderCode: PaymentProviderCodeEnum.GauvendiPay,
              booking: {
                reservationList: reservationInput,
                id: this.summaryBooking?.id,
                hotelPaymentModeCode: this.selectedPaymentMethodCode,
                booker: {
                  phoneInfo: {
                    phoneCode: this.bookerInformation?.phoneInfo?.phoneCode,
                    phoneNumber: this.bookerInformation?.phoneInfo?.phoneNumber
                  },
                  firstName: this.bookerInformation?.firstName,
                  lastName: this.bookerInformation?.lastName,
                  address: this.bookerInformation?.address,
                  city: this.bookerInformation?.city,
                  countryId: this.bookerInformation?.countryId,
                  postalCode: this.bookerInformation?.postalCode,
                  ...this.companyInformation
                },
                specialRequest: this.bookingNotes
              }
            }
          })
          .pipe(finalize(() => this.isLockSubmitPayment$.next(false)))
          .subscribe((res) => {
            const { status, data, message, code } = res;
            if (status === 'SUCCESS') {
              const confirmProposalResponse: ConfirmBookingResponse =
                data as ConfirmBookingResponse;
              this.router
                .navigate([RouterPageKey.paymentResult], {
                  queryParams: {
                    [RouteKeyQueryParams.currency]:
                      queryParams[RouteKeyQueryParams.currency],
                    [RouteKeyQueryParams.hotelCode]:
                      queryParams[RouteKeyQueryParams.hotelCode],
                    [RouteKeyQueryParams.lang]:
                      queryParams[RouteKeyQueryParams.lang],
                    [RouteKeyQueryParams.paymentId]:
                      confirmProposalResponse?.booking?.id
                  },
                  queryParamsHandling: 'preserve'
                })
                .then(() => {});
            } else {
              this.handleErrorMessage(message, code);
            }
          });
        break;
    }
  }

  handleErrorMessage(message: string, code: string): void {
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
      default:
        this.renderErrorMessage(code, message);
        break;
    }
  }

  declineBooking(): void {
    this.dialog
      .open(DialogDeclinedConfirmationComponent, {
        autoFocus: false,
        minWidth: '400px',
        direction: this.direction(),
        data: {
          bookingId: this.summaryBooking?.id,
          bookerEmail: this.summaryBooking?.booker?.emailAddress
        }
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          if (data === 'SUCCESS') {
            const queryParam = this.route.snapshot.queryParams;
            this.router
              .navigate([RouterPageKey.bookingProposal, 'declined'], {
                queryParams: {
                  [RouteKeyQueryParams.hotelCode]:
                    queryParam[RouteKeyQueryParams.hotelCode],
                  [RouteKeyQueryParams.lang]:
                    queryParam[RouteKeyQueryParams.lang]
                },
                queryParamsHandling: 'preserve'
              })
              .then();
          } else {
            this.paymentErrorMessage$.next('MESSAGE_DECLINED_BOOKING_FAILED');
          }
        }
      });
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

  prepareReservationInput(): ReservationInput[] {
    return this.summaryBooking?.reservationList?.map((item, index) => {
      let primaryGuest: PersonInput = {
        id: item?.primaryGuest?.id,
        phoneInfo: {
          phoneCode: item?.primaryGuest?.countryNumber,
          phoneNumber: item?.primaryGuest?.phoneNumber
        },
        firstName: item?.primaryGuest?.firstName,
        lastName: item?.primaryGuest?.lastName,
        emailAddress: item?.primaryGuest?.emailAddress,
        address: item?.primaryGuest?.address,
        countryId: item?.primaryGuest?.countryId,
        city: item?.primaryGuest?.city,
        postalCode: item?.primaryGuest?.postalCode,
        isBooker: true
      };

      // same booker but user wants to book for someone, replace primary guest in reservation to main guest
      if (this.summaryBooking?.guestList?.[0]?.isBooker) {
        if (
          this.bookerInformation?.bookForAnother &&
          item?.primaryGuest?.isBooker
        ) {
          primaryGuest = {
            phoneInfo: {
              phoneCode: this.guestInformation?.phoneInfo?.phoneCode,
              phoneNumber: this.guestInformation?.phoneInfo?.phoneNumber
            },
            firstName: this.guestInformation?.firstName,
            lastName: this.guestInformation?.lastName,
            emailAddress: this.guestInformation?.emailAddress,
            address: this.guestInformation?.address,
            countryId: this.guestInformation?.countryId,
            city: this.guestInformation?.city,
            postalCode: this.guestInformation?.postalCode,
            isBooker: false
          };
        }
      } else if (!this.summaryBooking?.guestList?.[0]?.isBooker) {
        // booker different main guest, toggle off book for someone, replace primary guest in reservation to booker
        if (
          !this.bookerInformation?.bookForAnother &&
          item?.primaryGuest?.isMainGuest
        ) {
          primaryGuest = {
            id: this.summaryBooking?.booker?.id,
            phoneInfo: {
              phoneCode: this.bookerInformation?.phoneInfo?.phoneCode,
              phoneNumber: this.bookerInformation?.phoneInfo?.phoneNumber
            },
            firstName: this.bookerInformation?.firstName,
            lastName: this.bookerInformation?.lastName,
            emailAddress: this.summaryBooking?.booker?.emailAddress,
            address: this.bookerInformation?.address,
            countryId: this.bookerInformation?.countryId,
            city: this.bookerInformation?.city,
            postalCode: this.bookerInformation?.postalCode,
            isBooker: true
          };
        }
      }

      return {
        primaryGuest,
        additionalGuestList: this.additionalGuestList
          ?.find((x) => x?.reservationId === item?.id)
          ?.guestList?.filter((g) => g?.id !== item?.primaryGuest?.id),
        reservationNumber: item?.reservationNumber,
        guestNote:
          this.specialRequest?.find(
            (x) => x?.reservationNumber === item?.reservationNumber
          )?.specialRequest || null
      };
    });
  }

  elementOptions(
    textHolder: string = ''
  ):
    | StripeCardElementOptions
    | StripeCardExpiryElementOptions
    | StripeCardCvcElementOptions {
    const textColor = this.hotelConfigService.colorText$?.value;
    return {
      classes: { base: 'input-component', invalid: 'error' },
      style: {
        base: {
          fontSize: '16px',
          color: textColor,
          fontFamily: this.hotelConfigService.hotelFontFamily?.value
        }
      },
      placeholder: textHolder
    };
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
            this.router
              .navigate([RouterPageKey.bookingProcessing, 'error'], {
                queryParams: {
                  [RouteKeyQueryParams.hotelCode]:
                    this.route.snapshot.queryParams[
                      RouteKeyQueryParams.hotelCode
                    ]
                }
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
              }
            })
            .then(() => {});
        }
      })
      .render('#paypal-button-container');
  }

  validateFormValid(): boolean {
    return (
      (this.bookerInformation?.bookForAnother
        ? this.guestInformationValid
        : true) &&
      this.bookerInformationValid &&
      this.additionalGuestValid &&
      this.bookingNotesValid
    );
  }

  makePaymentWithPaypal() {
    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];

    this.paymentErrorMessage$.next(null);
    const reservationInput = this.prepareReservationInput();
    return this.paymentService.confirmBookingProposal({
      input: {
        hotelCode,
        paymentProviderCode: PaymentProviderCodeEnum.Paypal,
        creditCardInformation: null,
        booking: {
          reservationList: reservationInput,
          id: this.summaryBooking?.id,
          hotelPaymentModeCode: this.selectedPaymentMethodCode,
          booker: {
            phoneInfo: {
              phoneCode: this.bookerInformation?.phoneInfo?.phoneCode,
              phoneNumber: this.bookerInformation?.phoneInfo?.phoneNumber
            },
            firstName: this.bookerInformation?.firstName,
            lastName: this.bookerInformation?.lastName,
            address: this.bookerInformation?.address,
            city: this.bookerInformation?.city,
            countryId: this.bookerInformation?.countryId,
            postalCode: this.bookerInformation?.postalCode,
            ...this.companyInformation
          },
          specialRequest: this.bookingNotes
        }
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
