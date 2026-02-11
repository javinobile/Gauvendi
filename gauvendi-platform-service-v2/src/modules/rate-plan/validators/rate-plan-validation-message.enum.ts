export enum RatePlanValidationMessage {
  // Error messages
  NULL_INPUT = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-400',
  NOT_FOUND = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-401',
  REQUIRE_ID = NOT_FOUND,
  REQUIRE_HOTEL_ID = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-402',
  REQUIRE_CODE = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-403',
  REQUIRE_NAME = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-404',
  REQUIRE_CANCELLATION_CODE = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-405',
  REQUIRE_PAYMENT_CODE = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-406',
  REQUIRE_PAY_AT_HOTEL = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-407',
  REQUIRE_PAY_ON_CONFIRMATION = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-408',
  CODE_MUST_BE_UNIQUE = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-409',
  CLONE_RATE_PLAN_FAILED = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-410',
  REQUIRE_ADJUSTMENT_INFORMATION = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-411',
  SETUP_DERIVED_SETTINGS_FAILED = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-412',
  MASTER_SALES_PLAN_UNAVAILABLE = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-413',
  SALES_PLAN_HAS_DERIVED_SALES_PLANS = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-414',
  MARKET_SEGMENT_NOT_FOUND = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-415',

  // Success messages
  CREATE_SUCCESS = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-200',
  UPDATE_SUCCESS = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-201',
  DELETE_SUCCESS = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-202',
  CLONE_RATE_PLAN_SUCCESS = 'RATEPLAN_MODULE-RATEPLAN_SERVICE-203'
}

export const RatePlanValidationMessages = {
  // Error messages
  [RatePlanValidationMessage.NULL_INPUT]: 'Input cannot be null or empty',
  [RatePlanValidationMessage.NOT_FOUND]: 'Rate plan not found',
  [RatePlanValidationMessage.REQUIRE_HOTEL_ID]: 'Hotel ID is required',
  [RatePlanValidationMessage.REQUIRE_CODE]: 'Rate plan code is required',
  [RatePlanValidationMessage.REQUIRE_NAME]: 'Rate plan name is required',
  [RatePlanValidationMessage.REQUIRE_CANCELLATION_CODE]: 'Cancellation policy code is required',
  [RatePlanValidationMessage.REQUIRE_PAYMENT_CODE]: 'Payment term code is required',
  [RatePlanValidationMessage.REQUIRE_PAY_AT_HOTEL]: 'Pay at hotel percentage is required',
  [RatePlanValidationMessage.REQUIRE_PAY_ON_CONFIRMATION]:
    'Pay on confirmation percentage is required',
  [RatePlanValidationMessage.CODE_MUST_BE_UNIQUE]: 'Rate plan code must be unique within the hotel',
  [RatePlanValidationMessage.CLONE_RATE_PLAN_FAILED]: 'Failed to clone rate plan',
  [RatePlanValidationMessage.REQUIRE_ADJUSTMENT_INFORMATION]:
    'Adjustment information is required when adjustment value or unit is provided',
  [RatePlanValidationMessage.SETUP_DERIVED_SETTINGS_FAILED]: 'Failed to setup derived settings',
  [RatePlanValidationMessage.MASTER_SALES_PLAN_UNAVAILABLE]:
    'Master sales plan is unavailable for derived pricing',
  [RatePlanValidationMessage.SALES_PLAN_HAS_DERIVED_SALES_PLANS]:
    'Cannot delete rate plan that has derived sales plans',
  [RatePlanValidationMessage.MARKET_SEGMENT_NOT_FOUND]: 'Market segment not found',

  // Success messages
  [RatePlanValidationMessage.CREATE_SUCCESS]: 'Rate plan created successfully',
  [RatePlanValidationMessage.UPDATE_SUCCESS]: 'Rate plan updated successfully',
  [RatePlanValidationMessage.DELETE_SUCCESS]: 'Rate plan deleted successfully',
  [RatePlanValidationMessage.CLONE_RATE_PLAN_SUCCESS]: 'Rate plan cloned successfully'
} as const;
