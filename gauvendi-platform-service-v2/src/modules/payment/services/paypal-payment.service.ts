import { Injectable, Logger } from '@nestjs/common';
import { ApiResponseDto } from 'src/core/dtos/common.dto';
import { PayPalOrderDto } from '../dtos/payment-interface.dto';
import { RequestPaymentDto } from '../dtos/payment.dto';
import { CreateOrdersRequest, PaypalIntent, PurchaseUnits } from '../dtos/paypal-payment.dto';
import { PaymentInterfaceService } from './payment-interface.service';

@Injectable()
export class PayPalPaymentService {
  private readonly logger = new Logger(PayPalPaymentService.name);
  constructor(private readonly paymentInterfaceService: PaymentInterfaceService) {}

  async handlePayPalPayment(body: RequestPaymentDto): Promise<ApiResponseDto<PayPalOrderDto>> {
    const input: CreateOrdersRequest = this.createPayPalOrderInput(body);
    const response = await this.paymentInterfaceService.createPayPalOrder(input);
    this.logger.log('[handlePayPalPayment] Response:', response);
    return response;
  }

  createPayPalOrderInput(body: RequestPaymentDto): CreateOrdersRequest {
    const { hotel, booking, bookingInput, propertyPaymentMethodSetting, roomProductList, currencyCode } = body;
    const reservations = booking.reservations;
    const merchantId = propertyPaymentMethodSetting?.metadata?.['metadata']?.['merchant'] || '';
    const purchaseUnits: PurchaseUnits[] = [];

    reservations.forEach((res) => {
      const rate = (res.totalBaseAmount || 0) / (res.totalGrossAmount || 0);
      const itemTotal = Number(((res.payOnConfirmationAmount || 0) * rate).toFixed(2));
      const taxTotal = Number(((res.payOnConfirmationAmount || 0) - itemTotal).toFixed(2));
      const emailAddress = hotel.emailAddress?.[0];
      const roomProduct = roomProductList.find((r) => r.roomProductId === res.roomProductId);
      const purchaseUnitInput: PurchaseUnits = {
        referenceId: res.reservationNumber || '',
        description: `${hotel.code} - Payment for booking ${booking.bookingNumber}`,
        customId: res.reservationNumber || '',
        amount: {
          currencyCode: currencyCode,
          value: res.payOnConfirmationAmount?.toFixed(2) || '0',
          breakdown: {
            itemTotal: {
              currencyCode: currencyCode,
              value: itemTotal.toString()
            },
            taxTotal: {
              currencyCode: currencyCode,
              value: taxTotal.toString()
            }
          }
        },
        payee: {
          emailAddress,
          merchantId
        },
        items: [
          {
            name: roomProduct?.roomProductName || '',
            unitAmount: {
              currencyCode: currencyCode,
              value: itemTotal.toString()
            },
            tax: {
              currencyCode: currencyCode,
              value: taxTotal.toString()
            },
            quantity: '1',
            description: `${hotel.code} - Payment for booking ${booking.bookingNumber}`,
            sku: roomProduct?.roomProductCode || ''
          }
        ]
      };

      purchaseUnits.push(purchaseUnitInput);
    });

    return {
      intent: PaypalIntent.CAPTURE,
      purchaseUnits: purchaseUnits
    };
  }
}
