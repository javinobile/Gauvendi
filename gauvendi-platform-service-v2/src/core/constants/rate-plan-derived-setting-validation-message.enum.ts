// Preserve exact Java validation message format
export enum RatePlanDerivedSettingValidationMessage {
  // Error messages - matching Java enum values exactly
  REQUIRE_HOTEL_ID = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-400',
  REQUIRE_RATE_PLAN_ID = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-401', 
  REQUIRE_DERIVED_RATE_PLAN_ID = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-402',

  // Success messages - matching Java enum values exactly
  CREATE_OR_UPDATE_SUCCESS = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-200',
  UPDATE_SUCCESS = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-201',
  DELETE_SUCCESS = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-202',
}

export const RatePlanDerivedSettingValidationMessages = {
  // Error messages
  [RatePlanDerivedSettingValidationMessage.REQUIRE_HOTEL_ID]: 'Hotel ID is required',
  [RatePlanDerivedSettingValidationMessage.REQUIRE_RATE_PLAN_ID]: 'Rate plan ID is required',
  [RatePlanDerivedSettingValidationMessage.REQUIRE_DERIVED_RATE_PLAN_ID]: 'Derived rate plan ID is required',

  // Success messages
  [RatePlanDerivedSettingValidationMessage.CREATE_OR_UPDATE_SUCCESS]: 'Rate plan derived setting created or updated successfully',
  [RatePlanDerivedSettingValidationMessage.UPDATE_SUCCESS]: 'Rate plan derived setting updated successfully',
  [RatePlanDerivedSettingValidationMessage.DELETE_SUCCESS]: 'Rate plan derived setting deleted successfully',
} as const;
