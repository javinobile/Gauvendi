import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from 'src/core/constants/environment.const';
import { ApiResponseDto } from 'src/core/dtos/common.dto';
import {
  AdyenProcessPaymentResponse,
  ProcessAdyenPaymentInput
} from '../dtos/payment-interface.dto';
import { RequestPaymentDto } from '../dtos/payment.dto';
import { buildAdyenPaymentInput } from '../utils/adyen.utils';
import { PaymentInterfaceService } from './payment-interface.service';

@Injectable()
export class ApaleoPaymentService {
  private readonly logger = new Logger(ApaleoPaymentService.name);
  constructor(
    private readonly paymentInterfaceService: PaymentInterfaceService,
    private readonly configService: ConfigService
  ) {}

  async handleApaleoPayment(
    body: RequestPaymentDto
  ): Promise<ApiResponseDto<AdyenProcessPaymentResponse>> {
    const {
      booking,
      booker,
      propertyPaymentMethodSetting,
      currencyCode,
      mappingHotel,
      bookingInput,
      whitelabelUrl,
      totalPrepaidAmount,
      isProposalBooking
    } = body;
    const metadata = propertyPaymentMethodSetting?.metadata?.metadata;
    const subMerchantId = metadata?.['subMerchantId'];
    const merchantAccount = metadata?.['merchant'] || '';
    const paymentMetaData: Record<string, any> = {
      booking_number: body.booking.bookingNumber
    };
    const additionalData: Record<string, any> = {
      'metadata.flowType': 'CaptureOnly',
      ...(mappingHotel?.mappingHotelCode && {
        'metadata.propertyId': mappingHotel.mappingHotelCode
      }),
      ...(mappingHotel?.connector?.accountId && {
        'metadata.accountId': mappingHotel.connector.accountId
      }),
      ...(subMerchantId && { subMerchantID: subMerchantId })
    };
    const totalAmount = totalPrepaidAmount ?? 0;
    const input: ProcessAdyenPaymentInput = buildAdyenPaymentInput({
      amount: totalAmount,
      paymentInformation: {
        type: bookingInput.creditCardInformation?.type || 'card',
        cardHolder: bookingInput.creditCardInformation?.cardHolder || '',
        cardNumber: bookingInput.creditCardInformation?.cardNumber || '',
        cvv: bookingInput.creditCardInformation?.cvv || '',
        expiryMonth: bookingInput.creditCardInformation?.expiryMonth || '',
        expiryYear: bookingInput.creditCardInformation?.expiryYear || ''
      },
      bookerEmail: booker.emailAddress || '',
      additionalData: additionalData,
      metadata: paymentMetaData,
      browserInfo: bookingInput.browserInfo,
      bookingNumber: booking.bookingNumber || '',
      browserIp: bookingInput.browserIp,
      currencyCode: currencyCode,
      merchantAccount: merchantAccount,
      origin: bookingInput.origin,
      returnUrlTemplate: this.configService.get(ENVIRONMENT.ADYEN_CHECKOUT_RETURN_URL) || '',
      whitelabelUrl,
      bookingId: booking.id || '',
      // isAuthorizedOnly: isProposalBooking || !(totalAmount > 0),
      isAuthorizedOnly: true,
      isTestEnv: this.configService.get(ENVIRONMENT.ADYEN_TEST_ENV) === 'true',
      shopperReference: booking.bookingNumber || '',
      enableRecurring: true
    });
    const apiKey = metadata?.['paymentApiKey'] || '';
    const liveEndpointUrlPrefix = metadata?.['urlPrefix'] || '';

    return await this.paymentInterfaceService.processAdyenPayment(
      input,
      apiKey,
      liveEndpointUrlPrefix,
      merchantAccount
    );
  }
}
