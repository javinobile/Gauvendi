// Preserve exact Java validation message format
export enum RatePlanPaymentTermSettingValidationMessage {
  // Error messages - matching Java enum values exactly
  NULL_INPUT = 'PRICING_MODULE-RATE_PLAN_PAYMENT_TERM_SETTING_SERVICE-400',
  NOT_FOUND = 'PRICING_MODULE-RATE_PLAN_PAYMENT_TERM_SETTING_SERVICE-401',
  EXISTED_SALES_PLAN_PAYMENT_TERM_SETTING = 'PRICING_MODULE-RATE_PLAN_PAYMENT_TERM_SETTING_SERVICE-402',
  REQUIRE_ID_OR_PROPERTY_PAYMENT_TERM_ID = 'PRICING_MODULE-RATE_PLAN_PAYMENT_TERM_SETTING_SERVICE-403',
  REQUIRE_ID = 'PRICING_MODULE-RATE_PLAN_PAYMENT_TERM_SETTING_SERVICE-404',

  // Success messages - matching Java enum values exactly
  CREATE_SUCCESS = 'PRICING_MODULE-RATE_PLAN_PAYMENT_TERM_SETTING_SERVICE-200',
  UPDATE_SUCCESS = 'PRICING_MODULE-RATE_PLAN_PAYMENT_TERM_SETTING_SERVICE-201',
  DELETE_SUCCESS = 'PRICING_MODULE-RATE_PLAN_PAYMENT_TERM_SETTING_SERVICE-202'
}

export const RatePlanPaymentTermSettingValidationMessages = {
  // Error messages
  [RatePlanPaymentTermSettingValidationMessage.NULL_INPUT]: 'Input data is required',
  [RatePlanPaymentTermSettingValidationMessage.NOT_FOUND]:
    'Rate plan payment term setting not found',
  [RatePlanPaymentTermSettingValidationMessage.EXISTED_SALES_PLAN_PAYMENT_TERM_SETTING]:
    'Rate plan payment term setting already exists',
  [RatePlanPaymentTermSettingValidationMessage.REQUIRE_ID_OR_PROPERTY_PAYMENT_TERM_ID]:
    'Either ID or property payment term ID is required',

  // Success messages
  [RatePlanPaymentTermSettingValidationMessage.CREATE_SUCCESS]:
    'Rate plan payment term setting created successfully',
  [RatePlanPaymentTermSettingValidationMessage.UPDATE_SUCCESS]:
    'Rate plan payment term setting updated successfully',
  [RatePlanPaymentTermSettingValidationMessage.DELETE_SUCCESS]:
    'Rate plan payment term setting deleted successfully'
} as const;
