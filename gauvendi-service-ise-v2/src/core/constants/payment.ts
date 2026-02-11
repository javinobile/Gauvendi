import { PaymentModeCodeEnum } from '../enums/payment';

export const PAYABLE_METHOD_LIST = [PaymentModeCodeEnum.GUAWCC, PaymentModeCodeEnum.PAYPAL];
export const OFFLINE_PAYMENT_METHOD_LIST = [
  PaymentModeCodeEnum.GUAINV,
  PaymentModeCodeEnum.GUAWDE,
  PaymentModeCodeEnum.PMDOTH
];
