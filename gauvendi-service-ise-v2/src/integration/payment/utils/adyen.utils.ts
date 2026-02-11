import {
  AdyenPaymentAccount,
  BuildAdyenPaymentInputParams,
  ProcessAdyenPaymentInput
} from '../dtos/payment-interface.dto';

export function buildAdyenPaymentInput(
  params: BuildAdyenPaymentInputParams
): ProcessAdyenPaymentInput {
  const {
    amount,
    paymentInformation,
    bookerEmail,
    additionalData,
    metadata,
    browserInfo,
    bookingNumber,
    browserIp,
    currencyCode,
    merchantAccount,
    origin,
    returnUrlTemplate,
    whitelabelUrl,
    bookingId,
    isAuthorizedOnly,
    isTestEnv,
    shopperReference,
    enableRecurring
  } = params;

  const paymentAccount: AdyenPaymentAccount = {
    type: paymentInformation?.type || '',
    account_holder: paymentInformation?.cardHolder || '',
    card_number: paymentInformation?.cardNumber || '',
    cvv: paymentInformation?.cvv || '',
    expMonth: paymentInformation?.expiryMonth || '',
    expYear: paymentInformation?.expiryYear || ''
  };

  const payload: ProcessAdyenPaymentInput = {
    amount: amount,
    browser_info: browserInfo,
    currency_code: currencyCode,
    is_authorised_only: isAuthorizedOnly,
    merchant_account: merchantAccount,
    metadata: metadata ?? undefined,
    origin,
    payment_account: paymentAccount,
    reference: bookingNumber,
    return_url: formatReturnUrl(returnUrlTemplate, whitelabelUrl, bookingId),
    shopper_email: bookerEmail,
    shopper_IP: browserIp,
    shopper_reference: shopperReference,
    enable_recurring: enableRecurring
  };

  // Merge additional data and set risk skip in test environment
  const mergedAdditional: Record<string, string> | undefined = {
    ...(additionalData ?? {}),
    ...(isTestEnv ? { 'riskdata.skipRisk': 'true' } : {})
  };

  if (Object.keys(mergedAdditional).length > 0) {
    payload.additional_data = mergedAdditional;
  }

  return payload;
}

function formatReturnUrl(template: string, whitelabelUrl: string, bookingId: string): string {
  // Replace the first two %s occurrences in order, matching Java String.format usage
  let formatted = template;
  formatted = formatted.replace('%s', whitelabelUrl);
  formatted = formatted.replace('%s', bookingId);
  return formatted;
}
