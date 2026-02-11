import { Injectable, Logger } from '@nestjs/common';
import { ApiResponseDto, ResponseContentStatusEnum } from 'src/core/dtos/common.dto';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { RatePlanPaymentSettlementSettingModeEnum, ResponseCodeEnum } from 'src/core/enums/common';
import { CustomerPaymentGatewayRepository } from 'src/modules/customer-payment-gateway/repositories/customer-payment-gateway.repository';
import { RatePlanPaymentSettlementSettingRepository } from 'src/modules/rate-plan-payment-settlement-setting/repositories/rate-plan-payment-settlement-setting.repository';
import {
  AddMewsCreditCardDto,
  AddMewsCreditCardInput,
  ChargeMewsCreditCardInput,
  MewsCreateCustomerInput,
  MewsCreateCustomerResponse
} from '../dtos/payment-interface.dto';
import { RequestPaymentDto } from '../dtos/payment.dto';
import { PaymentInterfaceService } from './payment-interface.service';
import { ProcessPaymentValidationMessage } from '@src/core/enums/booking-transaction';

@Injectable()
export class MewsPaymentService {
  private readonly logger = new Logger(MewsPaymentService.name);
  constructor(
    private readonly paymentInterfaceService: PaymentInterfaceService,
    private readonly customerPaymentGatewayRepository: CustomerPaymentGatewayRepository,
    private readonly ratePlanPaymentSettlementSettingRepository: RatePlanPaymentSettlementSettingRepository
  ) {}

  async handleMewsPayment(body: RequestPaymentDto): Promise<ApiResponseDto<{ paymentId: string }>> {
    const { bookingInput, connector, booker } = body;
    const creditCardInformation = bookingInput.creditCardInformation;

    if (!this.validateCreditCardInformation(creditCardInformation)) {
      return {
        code: ResponseCodeEnum.ERROR,
        message: ProcessPaymentValidationMessage.REQUIRE_CARD_INFORMATION,
        status: ResponseContentStatusEnum.ERROR
      };
    }

    const accessToken = this.getAccessToken(connector);
    if (!accessToken) {
      return {
        code: ResponseCodeEnum.ERROR,
        message: ProcessPaymentValidationMessage.NOT_FOUND_PAYMENT_PROVIDER,
        status: ResponseContentStatusEnum.ERROR
      };
    }

    // Create MEWS customer
    const customerResponse = await this.handleMewsCustomer(booker, accessToken);
    this.logger.log('[handleMewsPayment] Customer response:', customerResponse);

    if (customerResponse.code !== ResponseCodeEnum.SUCCESS || !customerResponse.data) {
      return {
        code: ResponseCodeEnum.ERROR,
        message: 'Failed to create MEWS customer',
        status: ResponseContentStatusEnum.ERROR
      };
    }

    const refCustomerId = customerResponse.data.id;

    // Add MEWS credit card
    const creditCardResponse = await this.handleMewsCreditCard(body, refCustomerId, accessToken);

    if (creditCardResponse.code !== ResponseCodeEnum.SUCCESS || !creditCardResponse.data) {
      return {
        code: ResponseCodeEnum.ERROR,
        message: 'Failed to add MEWS credit card',
        status: ResponseContentStatusEnum.ERROR
      };
    }

    // Store customer payment gateway information
    const refPaymentMethodId = creditCardResponse.data.credit_card_id;
    await this.customerPaymentGatewayRepository.createCustomerPaymentGateway({
      internalCustomerId: booker.id,
      refPaymentCustomerId: refCustomerId,
      refPaymentMethodId,
      paymentProvider: bookingInput.paymentProviderCode
    });

    // Process payment
    const totalAmount = body.totalPrepaidAmount || 0;
    if (totalAmount <= 0) {
      return {
        code: ResponseCodeEnum.SUCCESS,
        message: 'Payment successful',
        status: ResponseContentStatusEnum.SUCCESS,
        data: null
      };
    }

    const paymentResponse = await this.handleChargePayment(body, refPaymentMethodId, accessToken);

    if (paymentResponse.code !== ResponseCodeEnum.SUCCESS || !paymentResponse.data) {
      return {
        code: ResponseCodeEnum.ERROR,
        message: 'Failed to process payment',
        status: ResponseContentStatusEnum.ERROR
      };
    }

    return paymentResponse;
  }

  async handleChargePayment(
    body: RequestPaymentDto,
    refPaymentMethodId: string,
    accessToken: string
  ): Promise<ApiResponseDto<{ paymentId: string }>> {
    const setting =
      await this.ratePlanPaymentSettlementSettingRepository.getRatePlanPaymentSettlementSetting({
        ratePlanId: body.bookingInput?.bookingInformation?.reservationList?.[0]?.salesPlanId || '',
        hotelId: body.hotel.id
      });

    const isPmsPayment = setting?.mode === RatePlanPaymentSettlementSettingModeEnum.PMS_SETTLEMENT;
    if (isPmsPayment) {
      return {
        code: ResponseCodeEnum.SUCCESS,
        message: 'Payment successful',
        status: ResponseContentStatusEnum.SUCCESS,
        data: { paymentId: '' }
      };
    }
    const totalAmount = body.totalPrepaidAmount || 0;
    const currencyCode = body.bookingInput.bookingInformation?.bookingPricing?.currencyCode || '';
    const input: ChargeMewsCreditCardInput = {
      accessToken,
      creditCardId: refPaymentMethodId,
      grossAmount: totalAmount,
      currencyCode,
      note: `Payment for booking number: ${body.booking.bookingNumber} booking id: ${body.booking.id}`
    };
    const chargeResponse = await this.paymentInterfaceService.chargeMewsCreditCard(input);
    this.logger.log('[handleChargePayment] Charge response:', chargeResponse);
    if (chargeResponse.status !== ResponseContentStatusEnum.SUCCESS || !chargeResponse.data) {
      return {
        code: ResponseCodeEnum.ERROR,
        message: chargeResponse.message,
        status: ResponseContentStatusEnum.ERROR
      };
    }

    return {
      code: ResponseCodeEnum.SUCCESS,
      message: 'Payment successful',
      status: ResponseContentStatusEnum.SUCCESS,
      data: { paymentId: chargeResponse.data.payment_id }
    };
  }

  private async handleMewsCreditCard(
    body: RequestPaymentDto,
    refCustomerId: string,
    accessToken: string
  ): Promise<ApiResponseDto<AddMewsCreditCardDto>> {
    const transactionId = body.bookingInput.transactionId;
    this.logger.log('[handleMewsCreditCard] Transaction ID:', transactionId);
    if (!transactionId) {
      return {
        code: ResponseCodeEnum.ERROR,
        message: 'Transaction ID is required',
        status: ResponseContentStatusEnum.ERROR,
        data: null
      };
    }

    const creditCardInformation = body.bookingInput.creditCardInformation;
    const input: AddMewsCreditCardInput = {
      accessToken,
      customerId: refCustomerId,
      storageData: transactionId,
      expiration: `${creditCardInformation?.expiryYear}-${creditCardInformation?.expiryMonth}`
    };
    return await this.paymentInterfaceService.addMewsCreditCard(input);
  }

  /**
   * Validate credit card information
   * Checks if required credit card fields are provided
   */
  private validateCreditCardInformation(creditCardInformation: any): boolean {
    if (!creditCardInformation) {
      return false;
    }

    // Check for required credit card fields
    const { cardHolder, cardNumber, expiryMonth, expiryYear } = creditCardInformation;

    // At least basic credit card information should be provided
    if (
      !cardNumber ||
      !cardHolder ||
      !expiryMonth ||
      !expiryYear ||
      !cardNumber.trim() ||
      !cardHolder.trim()
    ) {
      return false;
    }

    return true;
  }

  private getAccessToken(connector: Connector | null): string {
    return connector?.refreshToken || '';
  }

  /**
   * Create MEWS customer with guest information
   */
  private async handleMewsCustomer(
    booker: Guest,
    accessToken: string
  ): Promise<ApiResponseDto<MewsCreateCustomerResponse>> {
    const customerInput: MewsCreateCustomerInput = {
      accessToken,
      email: booker.emailAddress || '',
      firstName: booker.firstName || '',
      lastName: booker.lastName || '',
      phone: booker.phoneNumber || undefined,
      address: {
        line1: booker.address || undefined,
        city: booker.city || undefined,
        state: booker.state || undefined,
        postalCode: booker.postalCode || undefined,
        country: booker.countryId || undefined // Note: might need country name instead of ID
      }
    };

    return await this.paymentInterfaceService.createMewsCustomer(customerInput);
  }
}
