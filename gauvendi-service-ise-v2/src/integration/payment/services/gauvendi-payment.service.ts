import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingTransactionStatusEnum,
  ProcessPaymentValidationMessage,
  ResponseContentStatusEnum
} from 'src/core/enums/booking-transaction';
import { ApiResponseDto } from 'src/modules/core/dtos/common.dto';
import { RequestPaymentDto } from '../dtos/payment.dto';
import {
  ProcessGauvendiPaymentDto,
  ProcessGauvendiPaymentInput,
  StorePaymentInformationDto
} from '../dtos/stripe-payment.dto';
import { PaymentInterfaceService } from './payment-interface.service';
import { PaymentInterfaceResponse } from '../dtos/common.dto';
import { CustomerPaymentGatewayRepository } from 'src/modules/customer-payment-gateway/repositories/customer-payment-gateway.repository';
import { PaymentProviderCodeEnum } from 'src/core/enums/payment';
import { ResponseCodeEnum } from 'src/core/enums/common';
import { BookingTransactionRepository } from 'src/modules/booking-transaction/repositories/booking-transaction.repository';
import { GetStripePaymentMethodDto } from '../dtos/payment-interface.dto';
import { plainToInstance } from 'class-transformer';

interface BookingPaymentAction {
  id: string;
  paymentData: string;
  paymentMethodId: string;
  paymentProviderCode: string;
}

interface BookingPaymentResponse {
  action?: BookingPaymentAction;
}

@Injectable()
export class GauvendiPaymentService {
  private readonly logger = new Logger(GauvendiPaymentService.name);

  constructor(
    private readonly paymentInterfaceService: PaymentInterfaceService,
    private readonly configService: ConfigService,
    private readonly customerPaymentGatewayRepository: CustomerPaymentGatewayRepository,
    private readonly bookingTransactionRepository: BookingTransactionRepository
  ) {}

  async handleGauvendiPayment(
    body: RequestPaymentDto
  ): Promise<ApiResponseDto<ProcessGauvendiPaymentDto | BookingPaymentResponse>> {
    const {
      booking,
      booker,
      propertyPaymentMethodSetting,
      currencyCode,
      hotel,
      bookingInput,
      totalPrepaidAmount,
      bookingTransaction
    } = body;

    // Validate metadata
    if (!propertyPaymentMethodSetting?.metadata?.metadata) {
      return {
        code: ResponseCodeEnum.ERROR,
        status: ResponseContentStatusEnum.ERROR,
        message: ProcessPaymentValidationMessage.NOT_FOUND_PROPERTY_PAYMENT_METHOD_SETTING_METADATA,
        data: null
      };
    }

    const metadata = propertyPaymentMethodSetting.metadata.metadata;

    const totalAmount = totalPrepaidAmount ?? 0;

    const connectedAccount =
      metadata['bookingEngineOriginKey'] != null
        ? metadata['bookingEngineOriginKey'].toString()
        : null;

    const refPaymentMethodId = bookingInput.creditCardInformation?.refPaymentMethodId;

    if (!refPaymentMethodId) {
      return {
        code: ResponseCodeEnum.ERROR,
        status: ResponseContentStatusEnum.ERROR,
        message: ProcessPaymentValidationMessage.NOT_FOUND_REF_PAYMENT_METHOD_ID,
        data: null
      };
    }

    const bookingTransactionId = bookingTransaction.id;
    let transactionFee = 0;
    let paymentDescription: string | null = null;

    if (totalAmount > 0) {
      const feeFixedAmount =
        metadata['feeFixedAmount'] != null && metadata['feeFixedAmount'].toString().trim()
          ? Number(metadata['feeFixedAmount'].toString())
          : 0;
      const feePercentage =
        metadata['feePercentage'] != null && metadata['feePercentage'].toString().trim()
          ? Number(metadata['feePercentage'].toString())
          : 0;
      transactionFee = this.calculateApplicationFee(totalAmount, feeFixedAmount, feePercentage);
      paymentDescription = `${hotel.code} Booking ${booking.bookingNumber}`;
    }

    const metadataInput: Record<string, string> = {};
    metadataInput['booking_number'] = booking.bookingNumber ?? '';

    const input: ProcessGauvendiPaymentInput = {
      bookingNumber: booking.bookingNumber ?? '',
      propertyId: hotel.id,
      currencyCode: currencyCode,
      paymentMethodId: refPaymentMethodId,
      customerId: booker.id,
      customerEmail: booker.emailAddress ?? '',
      prepaidAmount: totalAmount,
      applicationFee: transactionFee,
      description: paymentDescription ?? '',
      metadata: metadataInput,
      connectedAccount: connectedAccount
    };

    try {
      const response: any = await this.paymentInterfaceService.processGauvendiPayment(input);

      if (!response || !response?.data) {
        return {
          code: ResponseCodeEnum.ERROR,
          message:
            response?.message || ProcessPaymentValidationMessage.REQUEST_BOOKING_PAYMENT_FAILED,
          status: ResponseContentStatusEnum.ERROR,
          data: null
        };
      }

      const processPaymentData = plainToInstance(ProcessGauvendiPaymentDto, response.data);

      // Check payment status
      if (processPaymentData.status === 'failed') {
        return {
          code: ResponseCodeEnum.ERROR,
          message: ProcessPaymentValidationMessage.REQUEST_BOOKING_PAYMENT_FAILED,
          status: ResponseContentStatusEnum.ERROR,
          data: null
        };
      }

      const paymentStatus = processPaymentData.status.toLowerCase();

      // Handle authentication_required status (3DS redirect)
      if (processPaymentData.status === 'authentication_required') {
        const bookingPaymentAction: BookingPaymentAction = {
          id: processPaymentData.paymentIntentId,
          paymentData: processPaymentData.clientSecret,
          paymentMethodId: refPaymentMethodId,
          paymentProviderCode: PaymentProviderCodeEnum.GAUVENDI_PAY
        };

        // Update booking transaction with authentication action data
        await this.bookingTransactionRepository.updateBookingTransaction({
          id: bookingTransactionId,
          authenticationActionData: JSON.stringify(bookingPaymentAction)
        });

        const bookingPaymentResponse: BookingPaymentResponse = {
          action: bookingPaymentAction
        };

        return {
          code: ResponseCodeEnum.PENDING,
          status: ResponseContentStatusEnum.PENDING,
          message: ProcessPaymentValidationMessage.REQUIRE_ACTION,
          data: bookingPaymentResponse as any
        };
      }

      // Handle succeeded status
      if (paymentStatus === 'succeeded') {
        // Store customer payment gateway information
        await this.storeCustomerInformation(processPaymentData, booker.id, refPaymentMethodId);

        // Store payment information (card details)
        await this.storePaymentInformation(
          bookingTransactionId,
          refPaymentMethodId,
          connectedAccount
        );

        // Update booking transaction
        await this.bookingTransactionRepository.updateBookingTransaction({
          id: bookingTransactionId,
          status: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED,
          paymentDate: new Date()
        });

        return {
          code: ResponseCodeEnum.SUCCESS,
          status: ResponseContentStatusEnum.SUCCESS,
          message: ProcessPaymentValidationMessage.PROCESS_PAYMENT_SUCCESS,
          data: processPaymentData
        };
      }

      // Other status => Failed
      await this.bookingTransactionRepository.updateBookingTransaction({
        id: bookingTransactionId,
        status: BookingTransactionStatusEnum.PAYMENT_FAILED
      });

      return {
        code: ResponseCodeEnum.ERROR,
        message: ProcessPaymentValidationMessage.REQUEST_BOOKING_PAYMENT_FAILED,
        status: ResponseContentStatusEnum.ERROR,
        data: null
      };
    } catch (error) {
      this.logger.error('[handleGauvendiPayment] error', error);
      return {
        code: ResponseCodeEnum.ERROR,
        message: error.message ?? ProcessPaymentValidationMessage.REQUEST_BOOKING_PAYMENT_FAILED,
        status: ResponseContentStatusEnum.ERROR,
        data: null
      };
    }
  }

  private async storePaymentInformation(
    bookingTransactionId: string,
    refPaymentMethodId: string,
    connectedAccount: string | null
  ): Promise<void> {
    try {
      let cardType: string | null = null;
      let maskCardNumber: string | null = null;
      let expiryMonth: string | null = null;
      let expiryYear: string | null = null;
      let accountHolder: string | null = null;

      // Get payment method information
      const getStripePaymentMethodResponse =
        await this.paymentInterfaceService.getStripePaymentMethod(
          refPaymentMethodId,
          connectedAccount || ''
        );

      if (getStripePaymentMethodResponse?.data) {
        const paymentMethod = plainToInstance(
          StorePaymentInformationDto,
          getStripePaymentMethodResponse.data
        );
        maskCardNumber = paymentMethod.maskedCardNumber || null;
        expiryMonth = paymentMethod.expiryMonth || null;
        expiryYear = paymentMethod.expiryYear?.toString() || null;
        accountHolder = paymentMethod.accountHolder || null;
        cardType = paymentMethod.brand || null;
      }

      // Update booking transaction with payment information
      await this.bookingTransactionRepository.updateBookingTransaction({
        id: bookingTransactionId,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        accountHolder: accountHolder,
        accountNumber: maskCardNumber,
        cardType: cardType
      });
    } catch (error) {
      this.logger.error('[storePaymentInformation] error', error);
      // Don't throw error, just log it
    }
  }

  private async storeCustomerInformation(
    processPaymentData: ProcessGauvendiPaymentDto,
    bookerId: string,
    refPaymentMethodId: string
  ): Promise<void> {
    try {
      const stripeCustomerId = processPaymentData.customerId;
      if (stripeCustomerId) {
        await this.customerPaymentGatewayRepository.createCustomerPaymentGateway({
          internalCustomerId: bookerId,
          refPaymentCustomerId: stripeCustomerId,
          refPaymentMethodId: refPaymentMethodId,
          paymentProvider: PaymentProviderCodeEnum.GAUVENDI_PAY
        });
      }
    } catch (error) {
      this.logger.error('[storeCustomerInformation] error', error);
      // Don't throw error, just log it
    }
  }

  private calculateApplicationFee(
    amount: number,
    feeFixedAmount: number,
    feePercentage: number
  ): number {
    // Transaction fee = (Amount * fee_percentage) + fee_fixed_amount
    return amount * feePercentage + feeFixedAmount;
  }
}
