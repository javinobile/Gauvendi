export enum RatePlanFeatureDailyRateValidationMessage {
  // Required field validation
  FROM_DATE_MUST_BEFORE_TO_DATE = 'FROM_DATE_MUST_BEFORE_TO_DATE',
  HOTEL_NOT_FOUND = 'HOTEL_NOT_FOUND',
  
  // Success messages  
  CREATE_SUCCESS = 'CREATE_SUCCESS',
  UPDATE_SUCCESS = 'UPDATE_SUCCESS',
  DELETE_SUCCESS = 'DELETE_SUCCESS',
}

export const RatePlanFeatureDailyRateValidationMessages = {
  [RatePlanFeatureDailyRateValidationMessage.FROM_DATE_MUST_BEFORE_TO_DATE]: 'From date must be before to date',
  [RatePlanFeatureDailyRateValidationMessage.HOTEL_NOT_FOUND]: 'Hotel not found',
  [RatePlanFeatureDailyRateValidationMessage.CREATE_SUCCESS]: 'Rate plan feature daily rate created successfully',
  [RatePlanFeatureDailyRateValidationMessage.UPDATE_SUCCESS]: 'Rate plan feature daily rate updated successfully',
  [RatePlanFeatureDailyRateValidationMessage.DELETE_SUCCESS]: 'Rate plan feature daily rate deleted successfully',
};