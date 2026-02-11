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
import { MatDialogModule } from '@angular/material/dialog';
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
import { BehaviorSubject, lastValueFrom, noop } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-proposal-gvd',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    CheckboxCComponent,
    GetPaymentMethodIconPipe,
    GetPaymentModeStatusPipe,
    InputComponent,
    MatExpansionModule,
    MatIconModule,
    ParsePaymentMethodNamePipe,
    ReactiveFormsModule,
    TranslatePipe,
    FormsModule,
    ParseMetadataConfigPipe,
    FormErrorComponent
  ],
  templateUrl: './proposal-gvd.component.html',
  styleUrls: ['./proposal-gvd.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProposalGvdComponent extends AbstractPaymentMethodComponent {
  @Input() availablePaymentMethodList: AvailablePaymentMethod[];
  @Input() summaryBooking: Booking;
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
  @Input() specialRequest: {
    reservationNumber: string;
    specialRequest: string;
  }[];
  @Input() additionalGuestValid: boolean;
  @Input() hotelTerm: string;
  @Input() hotelPrivacy: string;
  @Input() companyInformation: Guest;
  @Input() bookerInformationValid: boolean;
  @Input() bookingNotes: string;
  @Input() bookingNotesValid: boolean;

  @Output() guaranteeMethod = new EventEmitter();
  @Output() needValidation = new EventEmitter();

  selectedPaymentMethodCode: HotelPaymentModeCodeEnum;
  hotelPaymentModeCode = HotelPaymentModeCodeEnum;
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

  selectedPaymentMethod$: BehaviorSubject<HotelPaymentModeCodeEnum> =
    new BehaviorSubject(null);

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
      (changes.hasOwnProperty('currencyCode') ||
        changes.hasOwnProperty('availablePaymentMethodList')) &&
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

  submitConfirmPayment(): void {
    if (
      (this.bookerInformation?.bookForAnother ? this.guestInformation : true) &&
      this.bookerInformationValid &&
      this.additionalGuestValid &&
      this.bookingNotesValid
    ) {
      this.makePayment();
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
    this.paymentService
      .confirmBookingProposal({
        input: {
          hotelCode,
          paymentProviderCode: PaymentProviderCodeEnum.GauvendiPay,
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
                  [RouteKeyQueryParams.paymentId]:
                    confirmProposalResponse?.booking?.id,
                  [RouteKeyQueryParams.hotelCode]:
                    queryParams?.[RouteKeyQueryParams.hotelCode],
                  [RouteKeyQueryParams.currency]:
                    queryParams[RouteKeyQueryParams.currency],
                  [RouteKeyQueryParams.lang]:
                    queryParams[RouteKeyQueryParams.lang]
                }
              })
              .then(null);
          } else {
            this.handleErrorMessage(message);
          }
        },
        () => {
          this.paymentErrorMessage$.next('REQUEST_BOOKING_PAYMENT_FAILED');
        }
      );
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

  onPaymentMethodChange(paymentMethodCode: HotelPaymentModeCodeEnum): void {
    if (paymentMethodCode) {
      this.guaranteeMethod.next(paymentMethodCode);
      this.selectedPaymentMethodCode = paymentMethodCode;
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
            this.needValidation.emit();
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

  handleErrorMessage(message: string) {
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
}
