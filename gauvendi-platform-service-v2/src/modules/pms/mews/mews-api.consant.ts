export const MewsApiConstants = {
  TEST_ACCESS_URL: '{{MEWS_API}}/api/connector/v1/configuration/get',
  GET_AVAILABILITY_URL: '{{MEWS_API}}/api/connector/v1/services/getAvailability',
  GET_SERVICES_URL: '{{MEWS_API}}/api/connector/v1/services/getAll',
  GET_PRODUCT_URL: '{{MEWS_API}}/api/connector/v1/resourceCategories/getAll',
  GET_ROOM_UNIT_URL: '{{MEWS_API}}/api/connector/v1/resources/getAll',
  GET_ROOM_UNIT_MAINTENANCE_URL: '{{MEWS_API}}/api/connector/v1/resourceBlocks/getAll',
  GET_RESTRICTIONS_URL: '{{MEWS_API}}/api/connector/v1/restrictions/getAll',
  CLEAR_RESTRICTIONS_URL: '{{MEWS_API}}/api/connector/v1/restrictions/clear',
  SET_RESTRICTIONS_URL: '{{MEWS_API}}/api/connector/v1/restrictions/set',
  GET_ROOM_PRODUCT_ASSIGNMENT_URL:
    '{{MEWS_API}}/api/connector/v1/resourceCategoryAssignments/getAll',
  GET_RATE_PLAN_PRICING_URL: '{{MEWS_API}}/api/connector/v1/rates/getPricing',
  GET_RATE_PLAN_URL: '{{MEWS_API}}/api/connector/v1/rates/getAll',
  GET_TAXATIONS_URL: '{{MEWS_API}}/api/connector/v1/taxations/getAll',
  GET_TAX_ENVIRONMENTS_URL: '{{MEWS_API}}/api/connector/v1/taxEnvironments/getAll'
};

export const PMS_MEWS_API_URI = {
  CREATE_RESERVATION: '/reservations/add',
  GET_ALL_AGE_CATEGORIES: '/ageCategories/getAll',
  ADD_CUSTOMER: '/customers/add',
  GET_ALL_CUSTOMER: '/customers/getAll'
};


