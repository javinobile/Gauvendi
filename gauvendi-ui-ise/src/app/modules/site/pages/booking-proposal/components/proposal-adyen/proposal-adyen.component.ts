import AdyenCheckout from '@adyen/adyen-web';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
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
import { BehaviorSubject, finalize, lastValueFrom, noop, take } from 'rxjs';
import { DialogDeclinedConfirmationComponent } from '../../dialogs/dialog-declined-confirmation/dialog-declined-confirmation.component';

@Component({
  selector: 'app-proposal-adyen',
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
    MatDialogModule,
    ParseMetadataConfigPipe,
    FormErrorComponent
  ],
  templateUrl: './proposal-adyen.component.html',
  styleUrls: ['./proposal-adyen.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProposalAdyenComponent extends AbstractPaymentMethodComponent {
  @ViewChild('frmPayment', { static: false }) frmPayment: ElementRef;
  @ViewChild('cardNumber', { static: false }) cardNumber: ElementRef;
  @ViewChild('expiryDate', { static: false }) expiryDate: ElementRef;
  @ViewChild('cvv', { static: false }) cvv: ElementRef;

  @Input() additionalGuestList: {
    reservationId: string;
    guestList: { firstName: string; lastName: string; id: string }[];
  }[];
  @Input() currencyCode: string;
  @Input() environment: string;
  @Input() guestInformation: GuestInformationInput;
  @Input() bookerInformation: BookerForSomeoneModel;
  @Input() guestInformationValid: boolean;
  @Input() availablePaymentMethodList: AvailablePaymentMethod[];
  @Input() originKey: string;
  @Input() clientKey: string;
  @Input() specialRequest: {
    reservationNumber: string;
    specialRequest: string;
  }[];
  @Input() additionalGuestValid: boolean;
  @Input() locale: string;
  @Input() summaryBooking: Booking;
  @Input() hotelTerm: string;
  @Input() hotelPrivacy: string;
  @Input() companyInformation: Guest;
  @Input() bookerInformationValid: boolean;
  @Input() bookingNotes: string;
  @Input() bookingNotesValid: boolean;
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
      this.adyenCheckout = new AdyenCheckout({
        environment: this.environment,
        originKey: this.originKey
      });
    }

    if (changes['clientKey']) {
      this.adyenCheckout = new AdyenCheckout({
        environment: this.environment,
        clientKey: this.clientKey
      });
    }

    if (
      (changes.hasOwnProperty('availablePaymentMethodList') ||
        changes.hasOwnProperty('summaryBooking')) &&
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
        if (this.rfPayment?.valid) {
          if (
            this.bookerInformation?.bookForAnother
              ? this.guestInformationValid &&
                this.additionalGuestValid &&
                this.bookingNotesValid
              : this.additionalGuestValid && this.bookingNotesValid
          ) {
            this.makePayment();
          } else {
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
          this.rfPayment.markAsTouched();
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
        if (this.cardInformation.isValid) {
          const {
            encryptedCardNumber,
            encryptedExpiryMonth,
            encryptedExpiryYear,
            encryptedSecurityCode,
            type
          } = this.cardInformation.data.paymentMethod;
          this.paymentService
            .confirmBookingProposal({
              input: {
                hotelCode,
                creditCardInformation: {
                  cardHolder: this.rfPayment?.value?.accountHolder,
                  cardNumber: encryptedCardNumber,
                  cvv: encryptedSecurityCode,
                  expiryMonth: encryptedExpiryMonth,
                  expiryYear: encryptedExpiryYear,
                  type
                },
                paymentProviderCode: !!this.clientKey
                  ? PaymentProviderCodeEnum.Adyen
                  : PaymentProviderCodeEnum.ApaleoPay,
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
                },
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
                origin: window.origin
              }
            })
            .pipe(
              take(1),
              finalize(() => this.isLockSubmitPayment$.next(false))
            )
            .subscribe(
              ({ status, message, data }) => {
                if (status === 'SUCCESS') {
                  this.isLockSubmitPayment$.next(false);
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
                  this.handleErrorMessage(message);
                }
              },
              () => {
                this.paymentErrorMessage$.next(
                  'REQUEST_BOOKING_PAYMENT_FAILED'
                );
              }
            );
        }
        break;
      default:
        this.paymentService
          .confirmBookingProposal({
            input: {
              hotelCode,
              creditCardInformation: {
                refPaymentMethodId: null
              },
              paymentProviderCode: !!this.clientKey
                ? PaymentProviderCodeEnum.Adyen
                : PaymentProviderCodeEnum.ApaleoPay,
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
          .subscribe(
            (res) => {
              const { status, data, message } = res;
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
                this.handleErrorMessage(message);
              }
            },
            () => {
              this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
            }
          );
        break;
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

  handleErrorMessage(message: string): void {
    switch (message) {
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
}
