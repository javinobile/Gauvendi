// Preserve exact Java validation message format
export enum RatePlanAdjustmentValidationMessage {
  // Error messages - matching Java enum values exactly
  NULL_INPUT = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-400',
  REQUIRE_ID = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-401',
  REQUIRE_RATE_PLAN_ID = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-402',
  OVERLAP_DATE_RANGE = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-403',
  REQUIRE_VALUE = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-404',
  REQUIRE_FROM_DATE = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-405',
  REQUIRE_TO_DATE = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-406',
  FROM_DATE_MUST_BEFORE_TO_DATE = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-407',
  REQUIRE_UNIT = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-408',

  // Success messages - matching Java enum values exactly
  CREATE_OR_UPDATE_SUCCESS = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-200',
  UPDATE_SUCCESS = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-201',
  DELETE_SUCCESS = 'PRICING_MODULE-RATE_PLAN_ADJUSTMENT_SERVICE-202',
}

export const RatePlanAdjustmentValidationMessages = {
  // Error messages
  [RatePlanAdjustmentValidationMessage.NULL_INPUT]: 'Input data is required',
  [RatePlanAdjustmentValidationMessage.REQUIRE_ID]: 'Rate plan adjustment ID is required',
  [RatePlanAdjustmentValidationMessage.REQUIRE_RATE_PLAN_ID]: 'Rate plan ID is required',
  [RatePlanAdjustmentValidationMessage.OVERLAP_DATE_RANGE]: 'Date range overlaps with existing adjustment',
  [RatePlanAdjustmentValidationMessage.REQUIRE_VALUE]: 'Adjustment value is required',
  [RatePlanAdjustmentValidationMessage.REQUIRE_FROM_DATE]: 'From date is required',
  [RatePlanAdjustmentValidationMessage.REQUIRE_TO_DATE]: 'To date is required',
  [RatePlanAdjustmentValidationMessage.FROM_DATE_MUST_BEFORE_TO_DATE]: 'From date must be before to date',
  [RatePlanAdjustmentValidationMessage.REQUIRE_UNIT]: 'Adjustment unit is required',

  // Success messages
  [RatePlanAdjustmentValidationMessage.CREATE_OR_UPDATE_SUCCESS]: 'Rate plan adjustment created or updated successfully',
  [RatePlanAdjustmentValidationMessage.UPDATE_SUCCESS]: 'Rate plan adjustment updated successfully',
  [RatePlanAdjustmentValidationMessage.DELETE_SUCCESS]: 'Rate plan adjustment deleted successfully',
} as const;
