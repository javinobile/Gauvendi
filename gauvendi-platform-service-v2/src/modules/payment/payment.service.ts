import { Inject, Injectable, Logger } from '@nestjs/common';
import { OFFLINE_PAYMENT_METHOD_LIST } from 'src/core/constants/payment';
import { ApiResponseDto, ResponseContentStatusEnum } from 'src/core/dtos/common.dto';
import {
  BookingTransaction,
  BookingTransactionStatusEnum
} from 'src/core/entities/booking-entities/booking-transaction.entity';

import { HotelPaymentModeCodeEnum, ResponseCodeEnum } from 'src/core/enums/common';
import { RequestPaymentDto } from './dtos/payment.dto';
import { RequestPaymentResponseDto } from './dtos/request-payment.dto';
import { ApaleoPaymentService } from './services/apaleo-payment.service';
import { MewsPaymentService } from './services/mews-payment.service';
import { PayPalPaymentService } from './services/paypal-payment.service';
// import { BookingGateway } from 'src/ws/gateways/booking.gateway';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { GauvendiPaymentService } from './services/gauvendi-payment.service';
import { GetStripePaymentMethodDto } from './dtos/payment-interface.dto';
import { ProcessGauvendiPaymentDto } from './dtos/stripe-payment.dto';
import { ProcessPaymentValidationMessage } from '@src/core/enums/booking-transaction';
import { PaymentProviderCodeEnum } from '@src/core/enums/payment';
import { ClientProxy } from '@nestjs/microservices';
import { ISE_SOCKET_SERVICE } from '@src/core/client/ise-socket-client.module';
import { ISE_SOCKET_CMD } from '@src/core/constants/cmd.const';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(
    private readonly mewsPaymentService: MewsPaymentService,
    private readonly apaleoPaymentService: ApaleoPaymentService,
    private readonly paypalPaymentService: PayPalPaymentService,
    // private readonly bookingGateway: BookingGateway,
    private readonly gauvendiPaymentService: GauvendiPaymentService,

    @Inject(ISE_SOCKET_SERVICE) private readonly iseSocketClient: ClientProxy
  ) {}

  async requestPayment(body: RequestPaymentDto): Promise<RequestPaymentResponseDto> {
    const { booking, paymentModeCode } = body;

    const totalPrepaidAmount = booking.reservations
      .map((reservation) => reservation.payOnConfirmationAmount)
      .reduce((a, b) => (a || 0) + (b || 0), 0);
    body.totalPrepaidAmount = totalPrepaidAmount || 0;

    if (paymentModeCode === HotelPaymentModeCodeEnum.NOGUAR) {
      const bookingTransactionInput: Partial<BookingTransaction> = {
        status: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED,
        totalAmount: 0,
        paymentData: JSON.stringify({
          creditCardMasked: null,
          paymentProvider: body.paymentProviderCode
        })
      };
      return {
        bookingTransactionInput,
        paymentInfo: null
      };
    }

    if (OFFLINE_PAYMENT_METHOD_LIST.includes(paymentModeCode as HotelPaymentModeCodeEnum)) {
      const bookingTransactionInput = {
        status: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED,
        totalAmount: totalPrepaidAmount,
        paymentData: JSON.stringify({
          creditCardMasked: null,
          paymentProvider: body.paymentProviderCode
        }),
        paymentDate: new Date()
      };

      return {
        bookingTransactionInput,
        paymentInfo: null
      };
    }

    return await this.processPayment(body);
  }

  async processPayment(body: RequestPaymentDto): Promise<RequestPaymentResponseDto> {
    const { paymentProviderCode, totalPrepaidAmount: totalAmount, bookingInput } = body;

    const bookingTransactionInput: Partial<BookingTransaction> = {
      status: BookingTransactionStatusEnum.PAYMENT_PENDING,
      totalAmount: totalAmount,
      paymentData: JSON.stringify({
        creditCardMasked: this.maskCardNumber(bookingInput.creditCardInformation?.cardNumber || ''),
        paymentProvider: paymentProviderCode
      })
    };

    let paymentInfo: ApiResponseDto<{ [key: string]: any }> | null = null;

    switch (paymentProviderCode) {
      case PaymentProviderCodeEnum.APALEO_PAY: {
        const paymentResponse = await this.apaleoPaymentService.handleApaleoPayment(body);
        const paymentData = paymentResponse.data || {};

        // Determine transaction status based on response code
        if (paymentResponse.code === ResponseCodeEnum.SUCCESS) {
          bookingTransactionInput.status = BookingTransactionStatusEnum.PAYMENT_SUCCEEDED;
        } else if (paymentResponse.code === ResponseCodeEnum.PENDING) {
          // 3DS redirect required
          bookingTransactionInput.status = BookingTransactionStatusEnum.PAYMENT_PENDING;
          // this.bookingGateway.paymentStatus.set(body.booking.id, new BehaviorSubject(null));
          await lastValueFrom(
            this.iseSocketClient.send(
              { cmd: ISE_SOCKET_CMD.CREATE_PAYMENT_STATUS },
              {
                bookingId: body.booking.id
              }
            )
          );
        } else {
          bookingTransactionInput.status = BookingTransactionStatusEnum.PAYMENT_FAILED;
          bookingTransactionInput.paymentMessages = [
            {
              status: paymentData['status'],
              message: paymentData['refusal_reason'] || 'Card authentication failed',
              createdAt: new Date()
            }
          ];
        }
        const authenticationActionData = {
          url: paymentData?.['action_url'],
          method: paymentData?.['action_method'],
          type: paymentData?.['action_type'],
          data: {
            MD: paymentData?.['md'],
            paReq: paymentData?.['pa_req'],
            termUrl: paymentData?.['term_url']
          },
          paymentProviderCode: paymentProviderCode
        };
        bookingTransactionInput.authenticationActionData = JSON.stringify(authenticationActionData);
        bookingTransactionInput.referenceNumber = paymentResponse.data?.psp_reference;
        bookingTransactionInput.cardType = paymentResponse.data?.payment_method;
        bookingTransactionInput.accountNumber = paymentResponse.data?.masked_card_number;
        bookingTransactionInput.accountHolder = paymentResponse.data?.account_holder;
        bookingTransactionInput.expiryMonth = paymentResponse.data?.expiry_date
          ?.split('/')[0]
          .padStart(2, '0');
        bookingTransactionInput.expiryYear = paymentResponse.data?.expiry_date?.split('/')[1];
        paymentInfo = {
          code: paymentResponse.code,
          message: paymentResponse.message,
          status: paymentResponse.status,
          data: paymentResponse.data
        };
        break;
      }
      case PaymentProviderCodeEnum.MEWS_PAYMENT: {
        const paymentResponse = await this.mewsPaymentService.handleMewsPayment(body);
        this.logger.log('[processPayment] Payment response:', paymentResponse);
        bookingTransactionInput.status =
          paymentResponse.code !== ResponseCodeEnum.SUCCESS
            ? BookingTransactionStatusEnum.PAYMENT_FAILED
            : BookingTransactionStatusEnum.PAYMENT_SUCCEEDED;
        bookingTransactionInput.referenceNumber = paymentResponse.data?.paymentId;
        paymentInfo = {
          code: paymentResponse.code,
          message: paymentResponse.message,
          status: paymentResponse.status,
          data: paymentResponse.data
        };
        break;
      }
      case PaymentProviderCodeEnum.PAYPAL: {
        const paymentResponse = await this.paypalPaymentService.handlePayPalPayment(body);
        bookingTransactionInput.status =
          paymentResponse.code !== ResponseCodeEnum.SUCCESS
            ? BookingTransactionStatusEnum.PAYMENT_FAILED
            : BookingTransactionStatusEnum.PAYMENT_PENDING;
        const orderID = paymentResponse.data?.id;
        bookingTransactionInput.referenceNumber = orderID;
        if (bookingTransactionInput.status === BookingTransactionStatusEnum.PAYMENT_PENDING) {
          // this.bookingGateway.paymentStatus.set(body.booking.id, new BehaviorSubject(null));
          await lastValueFrom(
            this.iseSocketClient.send(
              { cmd: ISE_SOCKET_CMD.CREATE_PAYMENT_STATUS },
              {
                bookingId: body.booking.id
              }
            )
          );
        }
        paymentInfo = {
          code: paymentResponse.code,
          message: paymentResponse.message,
          status: paymentResponse.status,
          data: {
            orderID
          }
        };
        break;
      }

      case PaymentProviderCodeEnum.GAUVENDI_PAY: {
        const paymentResponse = await this.gauvendiPaymentService.handleGauvendiPayment(body);
        this.logger.log('[processPayment] Payment response:', paymentResponse);

        if (paymentResponse.code === ResponseCodeEnum.PENDING) {
          // 3DS redirect required (authentication_required)
          bookingTransactionInput.status = BookingTransactionStatusEnum.PAYMENT_PENDING;
          // this.bookingGateway.paymentStatus.set(body.booking.id, new BehaviorSubject(null));
          await lastValueFrom(
            this.iseSocketClient.send(
              { cmd: ISE_SOCKET_CMD.CREATE_PAYMENT_STATUS },
              {
                bookingId: body.booking.id
              }
            )
          );

          const action = (paymentResponse.data as any)?.action;
          if (action) {
            const authenticationActionData = {
              id: action.id,
              paymentData: action.paymentData,
              paymentMethodId: action.paymentMethodId,
              paymentProviderCode: action.paymentProviderCode
            };
            bookingTransactionInput.authenticationActionData =
              JSON.stringify(authenticationActionData);
            bookingTransactionInput.referenceNumber = action.id;
            bookingTransactionInput.paymentData = action.paymentData;
          }

          paymentInfo = {
            code: paymentResponse.code,
            message: paymentResponse.message,
            status: paymentResponse.status,
            data: paymentResponse.data
          };
          break;
        }

        if (paymentResponse.code !== ResponseCodeEnum.SUCCESS) {
          bookingTransactionInput.status = BookingTransactionStatusEnum.PAYMENT_FAILED;
          paymentInfo = {
            code: ResponseCodeEnum.ERROR,
            message:
              paymentResponse?.message ??
              ProcessPaymentValidationMessage.REQUEST_BOOKING_PAYMENT_FAILED,
            status: ResponseContentStatusEnum.ERROR,
            data: null
          };
          break;
        }

        // Payment succeeded - transaction already updated in handleGauvendiPayment
        const processPaymentData = paymentResponse.data as ProcessGauvendiPaymentDto;
        bookingTransactionInput.status = BookingTransactionStatusEnum.PAYMENT_SUCCEEDED;
        bookingTransactionInput.referenceNumber = processPaymentData.paymentIntentId;
        bookingTransactionInput.paymentData = processPaymentData.clientSecret;

        paymentInfo = {
          code: paymentResponse.code,
          message: paymentResponse.message,
          status: paymentResponse.status,
          data: paymentResponse.data
        };
        break;
      }
      default:
        break;
    }
    return {
      bookingTransactionInput,
      paymentInfo
    };
  }

  private maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.trim().length === 0) {
      this.logger.warn('[maskCardNumber] empty cardNumber');
      return '';
    }

    const cardNumberTrim = cardNumber.trim();
    const cardNumberLength = cardNumberTrim.length;

    if (cardNumberLength === 4) {
      return `**** **** **** ${cardNumberTrim}`;
    } else if (cardNumberLength === 16) {
      return this.maskCreditCard(cardNumberTrim);
    } else {
      return cardNumberTrim;
    }
  }

  private maskCreditCard(creditCardNumber: string): string {
    const masked =
      creditCardNumber.substring(0, 4) +
      ' ' +
      creditCardNumber.substring(4, 6) +
      '** **** ' +
      creditCardNumber.substring(12, 16);
    return masked;
  }
}
