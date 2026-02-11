import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from 'src/core/constants/environment.const';
import { ApiResponseDto } from 'src/core/dtos/common.dto';
import { ResponseContentStatusEnum } from 'src/core/enums/booking-transaction';
import { ResponseCodeEnum } from 'src/core/enums/common';
import { getCurlCommand } from 'src/core/utils/curl.util';
import { PAYMENT_API_URL } from '../constants/payment.const';
import { PaymentInterfaceResponse } from '../dtos/common.dto';
import {
  AddMewsCreditCardDto,
  AddMewsCreditCardInput,
  AdyenPaymentDetailsDto,
  AdyenPaymentDetailsInput,
  AdyenProcessPaymentResponse,
  AdyenProcessPaymentResponseStatusEnum,
  ChargeMewsCreditCardDto,
  ChargeMewsCreditCardInput,
  GetStripePaymentIntentDto,
  GetStripePaymentMethodDto,
  MewsCreateCustomerInput,
  MewsCreateCustomerResponse,
  OnePayRequestInvoiceDto,
  OnePayRequestInvoiceInput,
  PayPalOrderDto,
  ProcessAdyenPaymentInput,
  ProcessStripePaymentDto,
  ProcessStripePaymentInput
} from '../dtos/payment-interface.dto';
import { CreateOrdersRequest } from '../dtos/paypal-payment.dto';
import { ProcessGauvendiPaymentDto, ProcessGauvendiPaymentInput } from '../dtos/stripe-payment.dto';

@Injectable()
export class PaymentInterfaceService {
  private readonly logger = new Logger(PaymentInterfaceService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  private buildHeaders(
    apiKey?: string,
    liveEndpointUrlPrefix?: string,
    merchantAccount?: string
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    if (liveEndpointUrlPrefix) {
      headers['x-live-endpoint-prefix'] = liveEndpointUrlPrefix;
    }

    if (merchantAccount) {
      headers['x-merchant-account'] = merchantAccount;
    }

    return headers;
  }

  private constructUrl(endpoint: string, params?: Record<string, string>): string {
    const baseUrl = this.configService.get(ENVIRONMENT.REMOTE_SERVICE_ENDPOINT_ITF_PAYMENT);
    let url = `${baseUrl}${endpoint}`;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(key, value);
      });
    }

    this.logger.log(`[constructUrl] Final URL: ${url}`);
    return url;
  }

  async processStripePayment(
    input: ProcessStripePaymentInput
  ): Promise<PaymentInterfaceResponse<ProcessStripePaymentDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.PROCESS_STRIPE_PAYMENT);
      const headers = this.buildHeaders();

      const response = await firstValueFrom(
        this.httpService.post<PaymentInterfaceResponse<ProcessStripePaymentDto>>(url, input, {
          headers
        })
      );

      this.logger.log('[processStripePayment] Response data:', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('[processStripePayment] Process payment failed:', error.message);
      throw error;
    }
  }

  async processGauvendiPayment(
    input: ProcessGauvendiPaymentInput
  ): Promise<PaymentInterfaceResponse<ProcessGauvendiPaymentDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.PROCESS_STRIPE_PAYMENT);
      const headers = this.buildHeaders();

      const response = await firstValueFrom(
        this.httpService.post<PaymentInterfaceResponse<ProcessGauvendiPaymentDto>>(url, input, {
          headers
        })
      );

      this.logger.log('[processStripePayment] Response data:', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('[processStripePayment] Process payment failed:', error.message);
      throw error;
    }
  }

  async getStripePaymentMethod(
    paymentMethodId: string,
    connectedAccount: string
  ): Promise<PaymentInterfaceResponse<GetStripePaymentMethodDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.GET_STRIPE_PAYMENT_METHOD, {
        '{id}': paymentMethodId
      });
      const headers = this.buildHeaders();
      headers['x-connected-account'] = connectedAccount;

      const response = await firstValueFrom(
        this.httpService.get<PaymentInterfaceResponse<GetStripePaymentMethodDto>>(url, { headers })
      );

      // this.logger.log('[getStripePaymentMethod] Response data:', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('[getStripePaymentMethod] Get payment method failed:', error.message);
      throw error;
    }
  }

  async getStripePaymentIntent(
    id: string,
    connectedAccount: string
  ): Promise<PaymentInterfaceResponse<GetStripePaymentIntentDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.GET_STRIPE_PAYMENT_INTENT, { '{id}': id });
      const headers = this.buildHeaders();
      headers['x-connected-account'] = connectedAccount;

      const response = await firstValueFrom(
        this.httpService.get<PaymentInterfaceResponse<GetStripePaymentIntentDto>>(url, { headers })
      );

      // this.logger.log('[getStripePaymentIntent] Response data:', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('[getStripePaymentIntent] Get payment intent failed:', error.message);
      throw error;
    }
  }

  async processAdyenPayment(
    input: ProcessAdyenPaymentInput,
    apiKey: string,
    liveEndpointUrlPrefix: string,
    merchantAccount: string
  ): Promise<ApiResponseDto<AdyenProcessPaymentResponse>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.PROCESS_ADYEN_PAYMENT);
      const headers = this.buildHeaders(apiKey, liveEndpointUrlPrefix, merchantAccount);
      const cmd = getCurlCommand(url, 'POST', headers, input);
      this.logger.debug(`[processAdyenPayment] Curl command: ${JSON.stringify(cmd)}`);
      const response = await firstValueFrom(
        this.httpService.post<ApiResponseDto<AdyenProcessPaymentResponse>>(url, input, {
          headers
        })
      );

      this.logger.log('[processAdyenPayment] Response data:', JSON.stringify(response.data));
      const data = response.data.data;

      if (data?.status === AdyenProcessPaymentResponseStatusEnum.AUTHORISED) {
        return {
          code: ResponseCodeEnum.SUCCESS,
          status: ResponseContentStatusEnum.SUCCESS,
          message: 'Payment processed successfully',
          data: data
        };
      }

      if (data?.status === AdyenProcessPaymentResponseStatusEnum.REDIRECT_SHOPPER) {
        return {
          code: ResponseCodeEnum.PENDING,
          status: ResponseContentStatusEnum.PENDING,
          message: 'Payment requires redirect for 3D Secure authentication',
          data: data
        };
      }

      return {
        code: ResponseCodeEnum.ERROR,
        status: ResponseContentStatusEnum.ERROR,
        message: data?.refusal_reason || 'Payment failed',
        data: data
      };
    } catch (error) {
      const err = error.response?.data;
      this.logger.error('[processAdyenPayment] Process payment failed:', err);
      return {
        code: ResponseCodeEnum.ERROR,
        status: ResponseContentStatusEnum.ERROR,
        message: err?.message || 'Process payment failed',
        data: null
      };
    }
  }

  async submitAdyenPaymentDetails(
    input: {
      redirectResult: string;
      threeDSResult: string | null;
    },
    apiKey: string,
    liveEndpointUrlPrefix: string
  ): Promise<PaymentInterfaceResponse<AdyenPaymentDetailsDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.ADYEN_PAYMENT_DETAILS);
      const headers = this.buildHeaders(apiKey, liveEndpointUrlPrefix);

      const response = await firstValueFrom(
        this.httpService.post<PaymentInterfaceResponse<AdyenPaymentDetailsDto>>(url, input, {
          headers
        })
      );

      this.logger.log('[submitAdyenPaymentDetails] Response data:', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('[submitAdyenPaymentDetails] Details failed:', error.message);
      throw error;
    }
  }

  async createMewsCustomer(
    input: MewsCreateCustomerInput
  ): Promise<ApiResponseDto<MewsCreateCustomerResponse>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.CREATE_MEWS_CUSTOMER);
      const headers = this.buildHeaders();
      const curlCommand = getCurlCommand(url, 'POST', headers, input);
      this.logger.debug(`[createMewsCustomer] Curl command: ${JSON.stringify(curlCommand)}`);
      const response = await firstValueFrom(
        this.httpService.post<PaymentInterfaceResponse<MewsCreateCustomerResponse>>(url, input, {
          headers
        })
      );

      this.logger.log('[createMewsCustomer] Response data:', response.data);
      return {
        code: ResponseCodeEnum.SUCCESS,
        status: ResponseContentStatusEnum.SUCCESS,
        message: 'Customer created successfully',
        data: response.data?.data
      };
    } catch (error) {
      this.logger.error('[createMewsCustomer] Create user failed:', error.message);
      return {
        code: ResponseCodeEnum.ERROR,
        status: ResponseContentStatusEnum.ERROR,
        message: error.message,
        data: null
      };
    }
  }

  async addMewsCreditCard(
    input: AddMewsCreditCardInput
  ): Promise<ApiResponseDto<AddMewsCreditCardDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.ADD_MEWS_CREDIT_CARD);
      const headers = this.buildHeaders();
      const curlCommand = getCurlCommand(url, 'POST', headers, input);
      this.logger.debug(`[addMewsCreditCard] Curl command: ${JSON.stringify(curlCommand)}`);
      const response = await firstValueFrom(
        this.httpService.post<ApiResponseDto<AddMewsCreditCardDto>>(url, input, {
          headers
        })
      );

      this.logger.log('[addMewsCreditCard] Response data:', response.data);
      return {
        code: ResponseCodeEnum.SUCCESS,
        status: ResponseContentStatusEnum.SUCCESS,
        message: 'Card added successfully',
        data: response.data?.data
      };
    } catch (error) {
      const err = error.response?.data;
      this.logger.error('[addMewsCreditCard] Add card failed:', err);
      return {
        code: err?.statusCode || ResponseCodeEnum.ERROR,
        status: ResponseContentStatusEnum.ERROR,
        message: err?.message || 'Add card failed',
        data: null
      };
    }
  }

  async chargeMewsCreditCard(
    input: ChargeMewsCreditCardInput
  ): Promise<ApiResponseDto<ChargeMewsCreditCardDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.CHARGE_MEWS_CREDIT_CARD);
      const headers = this.buildHeaders();
      const curlCommand = getCurlCommand(url, 'POST', headers, input);
      this.logger.debug(`[chargeMewsCreditCard] Curl command: ${JSON.stringify(curlCommand)}`);
      const response = await firstValueFrom(
        this.httpService.post<ApiResponseDto<ChargeMewsCreditCardDto>>(url, input, {
          headers
        })
      );

      this.logger.log('[chargeMewsCreditCard] Response data:', response.data);
      return {
        code: ResponseCodeEnum.SUCCESS,
        status: ResponseContentStatusEnum.SUCCESS,
        message: 'Charge successful',
        data: response.data?.data
      };
    } catch (error) {
      const err = error.response?.data;
      this.logger.error('[chargeMewsCreditCard] Charge failed:', err);
      return {
        code: err?.statusCode || ResponseCodeEnum.ERROR,
        status: ResponseContentStatusEnum.ERROR,
        message: err?.message || 'Charge failed',
        data: null
      };
    }
  }

  async createPayPalOrder(input: CreateOrdersRequest): Promise<ApiResponseDto<PayPalOrderDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.CREATE_PAYPAL_ORDER);
      const headers = this.buildHeaders();
      const cmd = getCurlCommand(url, 'POST', headers, input);
      this.logger.debug(`[createPayPalOrder] Curl command: ${JSON.stringify(cmd)}`);
      const response = await firstValueFrom(
        this.httpService.post<ApiResponseDto<PayPalOrderDto>>(url, input, { headers })
      );
      const res = response.data;

      this.logger.log('[createPayPalOrder] Response data:', response.data);
      return {
        code: ResponseCodeEnum.SUCCESS,
        status: ResponseContentStatusEnum.SUCCESS,
        message: 'Order created successfully',
        data: res?.data
      };
    } catch (error) {
      const err = error.response?.data;
      this.logger.error('[createPayPalOrder] Create order failed:', err);
      return {
        code: ResponseCodeEnum.ERROR,
        status: ResponseContentStatusEnum.ERROR,
        message: err?.message || 'Create order failed',
        data: null
      };
    }
  }

  async capturePayPalOrder(id: string): Promise<PaymentInterfaceResponse<PayPalOrderDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.CAPTURE_PAYPAL_ORDER, { '{id}': id });
      const headers = this.buildHeaders();

      const response = await firstValueFrom(
        this.httpService.post<PaymentInterfaceResponse<PayPalOrderDto>>(url, {}, { headers })
      );

      this.logger.log('[capturePayPalOrder] Response data:', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('[capturePayPalOrder] Capture failed:', error.message);
      throw error;
    }
  }

  async createOnePayRequestInvoice(
    input: OnePayRequestInvoiceInput
  ): Promise<PaymentInterfaceResponse<OnePayRequestInvoiceDto>> {
    try {
      const url = this.constructUrl(PAYMENT_API_URL.CREATE_ONEPAY_REQUEST_INVOICE);
      const headers = this.buildHeaders();

      const response = await firstValueFrom(
        this.httpService.post<PaymentInterfaceResponse<OnePayRequestInvoiceDto>>(url, input, {
          headers
        })
      );

      this.logger.log('[createOnePayRequestInvoice] Response data:', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('[createOnePayRequestInvoice] Create failed:', error.message);
      throw error;
    }
  }
}
