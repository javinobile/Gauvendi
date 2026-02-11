export const CMD = {
  PRICING: {
    GET_RATE_PLAN_SERVICE_LIST: 'get_rate_plan_service_list',
    CREATE_RATE_PLAN_SERVICE: 'create_rate_plan_service',
    DELETE_RATE_PLAN_SERVICE: 'delete_rate_plan_service',
    GET_RATE_PLAN_FEATURE_DAILY_RATE_LIST: 'get_rate_plan_feature_daily_rate_list',
    GET_HOTEL_CANCELLATION_POLICY_LIST: 'get_hotel_cancellation_policy_list',
    CHANGE_DEFAULT_HOTEL_CANCELLATION_POLICY: 'change_default_hotel_cancellation_policy',
    CREATE_OR_UPDATE_HOTEL_CANCELLATION_POLICY: 'create_or_update_hotel_cancellation_policy',
    GET_HOTEL_EXTRAS_LIST: 'get_hotel_extras_list',
    GET_HOTEL_TAX_LIST: 'get_hotel_tax_list',
    UPDATE_HOTEL_TAX_SETTINGS: 'update_hotel_tax_settings',

    GET_HOTEL_MAPPING_LIST: 'get_hotel_mapping_list',
    GET_MARKET_SEGMENT_LIST: 'get_market_segment_list'
  },
  MARKET_SEGMENT: {
    GET_LIST: 'get_market_segment_list',
    CREATE_OR_UPDATE: 'create_or_update_market_segment',
    DELETE: 'delete_market_segment',
    SET_STATUS: 'set_market_segment_status'
  },
  HOTEL_PAYMENT_TERM: {
    GET_LIST: 'get_hotel_payment_term_list',
    CREATE: 'create_hotel_payment_term',
    UPDATE: 'update_hotel_payment_term',
    DELETE: 'delete_hotel_payment_term'
  },
  GLOBAL_PAYMENT_METHOD: {
    GET_LIST: 'get_global_payment_method_list',
    ACTIVATE_HOTEL_PAYMENT_METHOD: 'activate_hotel_global_payment_method',
    DEACTIVATE_HOTEL_PAYMENT_METHOD: 'deactivate_hotel_global_payment_method'
  },
  GLOBAL_PAYMENT_PROVIDER: {
    GET_LIST: 'get_global_payment_provider_list'
  },
  RATE_PLAN_SELLABILITY: {
    GET_LIST: 'get_rate_plan_sellability_list',
    GET_DAILY_LIST: 'get_rate_plan_daily_sellability_list',
    CREATE_OR_UPDATE: 'create_or_update_rate_plan_daily_sellability',
    DELETE_DAILY: 'delete_rate_plan_daily_sellability'
  },

  ROOM_PRODUCT_RATE_PLAN: {
    CREATE_OR_UPDATE_EXTRA_OCCUPANCY_RATE_ADJUSTMENT:
      'create_or_update_extra_occupancy_rate_adjustment',
    CREATE_OR_UPDATE_AVAILABILITY_ADJUSTMENT: 'create_or_update_availability_adjustment',
    GET_DAILY_OCCUPANCY_SURCHARGE_RATE: 'get_daily_occupancy_surcharge_rate'
  },
  RATE_PLAN: {
    GET_AVAILABLE_SALES_PLAN_TO_DERIVE_LIST: 'get_available_sales_plan_to_derive_list',
    UPDATE_RATE_PLAN: 'update_rate_plan',
    CREATE_RATE_PLAN: 'create_rate_plan',
    DELETE_RATE_PLAN: 'delete_rate_plan',
    GET_ROOM_PRODUCT_ASSIGN_TO_RATE_PLAN: 'get_room_product_assign_to_rate_plan',
    UPSERT_SALES_PLAN_SELL_ABILITY: 'upsert_sales_plan_sell_ability',
    UPSERT_RATE_PLAN_ADJUSTMENT: 'upsert_rate_plan_adjustment',
    DELETE_RATE_PLAN_ADJUSTMENT: 'delete_rate_plan_adjustment',
    GET_RATE_PLAN_CXL_POLICY_DAILY_LIST: 'get_rate_plan_cxl_policy_daily_list',
    GET_RATE_PLAN_PAYMENT_TERM_DAILY_LIST: 'get_rate_plan_payment_term_daily_list',
    GET_RATE_PLAN_HOTEL_EXTRAS_DAILY_LIST: 'get_rate_plan_hotel_extras_daily_list',
    DELETE_RATE_PLAN_PAYMENT_TERM_DAILY: 'delete_rate_plan_payment_term_daily',
    DELETE_RATE_PLAN_CXL_POLICY_DAILY: 'delete_rate_plan_cxl_policy_daily',
    CREATE_OR_UPDATE_RATE_PLAN_CXL_POLICY_DAILY: 'create_or_update_rate_plan_cxl_policy_daily',
    CREATE_OR_UPDATE_RATE_PLAN_PAYMENT_TERM_DAILY: 'create_or_update_rate_plan_payment_term_daily',
    MONTHLY_RATE_PLAN_OVERVIEW: 'monthly_rate_plan_overview',
    CREATE_OR_UPDATE_RATE_PLAN_HOTEL_EXTRAS_DAILY: 'create_or_update_rate_plan_hotel_extras_daily',
    DELETE_RATE_PLAN_HOTEL_EXTRAS_DAILY: 'delete_rate_plan_hotel_extras_daily',
    PRODUCTS_TO_SELL_DAILY_LIST: 'rate_plan_products_to_sell_daily_list',
    GET_APALEO_RATE_PLAN_PMS_MAPPING_LIST: 'get_apaleo_rate_plan_pms_mapping_list',
    CREATE_OR_UPDATE_APALEO_RATE_PLAN_PMS_MAPPING: 'create_or_update_apaleo_rate_plan_pms_mapping',
    CREATE_OR_UPDATE_APALEO_ROOM_PRODUCT_RATE_PLAN_PMS_MAPPING:
      'create_or_update_apaleo_room_product_rate_plan_pms_mapping',
    GET_CPP_RATE_PLANS: 'get_cpp_rate_plans',
    CPP_SMART_FINDING_PROMO_CODE: 'cpp_smart_finding_promo_code',
    CPP_SEARCH_GUEST: 'cpp_search_guest',
    CPP_GUEST_DETAIL: 'cpp_guest_detail',
    ISE_RECOMMENDED_OFFERS: 'ise_recommended_offers',
    CPP_ASSIGN_ROOM_TO_PRODUCTS: 'cpp_assign_room_to_products',
    GET_DAILY_PROPERTY_PACE_TRENDS: 'get_daily_property_pace_trends',
    GET_DAILY_PROPERTY_PICKUP_ADR_LIST: 'get_daily_property_pickup_adr_list',
    GET_DAILY_PROPERTY_ADR_LIST: 'get_daily_property_adr_list'
  },
  RATE_PLAN_PAYMENT_TERM_SETTING: {
    GET_LIST: 'get_rate_plan_payment_term_setting_list',
    UPDATE: 'update_rate_plan_payment_term_setting',
    DELETE: 'delete_rate_plan_payment_term_setting',
    CREATE: 'create_rate_plan_payment_term_setting'
  },
  RATE_PLAN_PAYMENT_SETTLEMENT_SETTING: {
    LIST: 'get_sales_plan_payment_settlement_setting_list',
    CREATE_OR_UPDATE: 'create_or_update_rate_plan_payment_settlement_setting'
  },
  HOTEL_PAYMENT_METHOD_SETTING: {
    GET_LIST: 'get_hotel_payment_method_setting_list'
  },
  NOTIFICATION: {
    SEND_CONFIRM_BOOKING_EMAIL: 'send_confirm_booking_email',
    SEND_PROPOSED_BOOKING_EMAIL: 'send_proposed_booking_email',
    SEND_TEST_EMAIL: 'send_test_email',
    DOWNLOAD_BOOKING_CONFIRMATION_PDF: 'download_booking_confirmation_pdf'
  },
  BOOKING: {
    DETAILS: 'get_booking_details',
    OVERVIEW: 'get_booking_overview',
    BOOKER_INFO: 'get_booking_booker_info',
    UPDATE_BOOKER_INFO: 'update_booking_booker_info',
    PAYMENT_METHODS: 'get_booking_payment_methods',
    CALCULATE_PRICING: 'calculate_booking_pricing',
    CREATE_CPP_REQUEST_BOOKING: 'create_cpp_request_booking',
    REQUEST_BOOKING_CREATION: 'request_booking_creation',
    HANDLE_AFTER_PAYMENT: 'handle_after_payment',
    CPP_CONFIRM_PAYMENT_BOOKING: 'cpp_confirm_payment_booking'
  },
  RESERVATION: {
    MANAGEMENT_LIST: 'get_reservation_management_list',
    SOURCE_LIST: 'get_reservation_source_list',
    CHANNEL_LIST: 'get_reservation_channel_list',
    BOOKING_FLOW_LIST: 'get_reservation_booking_flow_list',
    STATUS_LIST: 'get_reservation_status_list',
    LIST: 'get_reservation_list',
    OVERVIEW: 'get_reservation_overview',
    DETAILS: 'get_reservation_details',
    GUEST_LIST: 'get_reservation_guest_list',
    COMPANY: 'get_reservation_company',
    PRICING_DETAILS: 'get_reservation_pricing_details',
    EMAIL_HISTORY: 'get_reservation_email_history',
    SYNC_PMS_RESERVATIONS: 'sync_pms_reservations',
    CANCEL_RESERVATION: 'cancel_reservation',
    SEND_CANCELLATION_RESERVATION_EMAIL: 'send_cancellation_reservation_email',
    RATE_PLAN_DETAILS: 'get_reservation_rate_plan_details',
    RELEASE_PROPOSED_RESERVATION: 'release_proposed_reservation',
    UPDATE_RESERVATION_LOCK_UNIT: 'update_reservation_lock_unit',
    GENERATE_RESERVATION_NOTES: 'generate_reservation_notes',
    JOB_PULL_PMS_RESERVATIONS: 'job_pull_pms_reservations',
    PUSH_PMS_RESERVATION: 'push_pms_reservation',
    MIGRATE_RESERVATION_AMENITY_EXTRA_TYPE: 'migrate_reservation_amenity_extra_type',
    MIGRATE_RESERVATION_STATUS: 'migrate_reservation_status',
    UPDATE_GUEST_LIST: 'update_guest_list',
    RELEASE_BOOKING: 'release_booking'
  },
  ORGANISATION: {
    GET_LIST: 'get_organisation_list'
  },
  RESTRICTION_AUTOMATION_SETTING: {
    GET_RATE_PLAN_RESTRICTION_AUTOMATION_SETTINGS: 'get_rate_plan_restriction_automation_settings',
    GET_ROOM_PRODUCT_RESTRICTION_AUTOMATION_SETTINGS:
      'get_room_product_restriction_automation_settings',
    GET_RESTRICTION_AUTOMATION_SETTINGS: 'get_restriction_automation_settings',
    UPDATE_RESTRICTION_AUTOMATION_SETTINGS: 'update_restriction_automation_settings'
  },
  HOTEL_AMENITY: {
    UPLOAD_IMAGE: 'upload_hotel_amenity_image',
    CREATE: 'create_hotel_amenity',
    UPDATE: 'update_hotel_amenity',
    DELETE: 'delete_hotel_amenity',
    GET_CPP_EXTRAS_SERVICE_LIST: 'get_cpp_extras_service_list',
    GET_PMS_AMENITY_LIST: 'get_pms_amenity_list',
    UPDATE_HOTEL_AMENITY_LIST: 'update_hotel_amenity_list'
  },

  ROOM_PRODUCT_AVAILABILITY: {
    GET_DAILY_AVAILABILITY: 'get_room_product_daily_availability',
    GET_SETTING_PMS_ROOM_PRODUCT_MAPPING: 'get_setting_pms_room_product_mapping'
  },
  FEATURE: {
    GET_HOTEL_FEATURE: 'get_hotel_feature',
    SYNC_FEATURE: 'sync_feature'
  },
  TRANSLATION: {
    GET_DYNAMIC_CONTENT_TRANSLATION: 'get_dynamic_content_translation',
    UPDATE_DYNAMIC_CONTENT_TRANSLATION: 'update_dynamic_content_translation'
  },
  HOTEL_TEMPLATE_EMAIL: {
    GET_LIST: 'get_hotel_template_email_list',
    UPDATE_EMAIL_CONTENT: 'update_hotel_template_email_content',
    GET_EMAIL_TRANSLATION: 'get_hotel_template_email_translation',
    UPDATE_EMAIL_TRANSLATION: 'update_hotel_template_email_translation',
    MIGRATE_EMAIL_TRANSLATION: 'migrate_hotel_template_email_translation'
  },
  ROOM_PRODUCT: {
    CLONE: 'clone_room_product',
    GET_CPP_CALENDAR_ROOM_PRODUCTS: 'get_cpp_calendar_room_products',
    GET_CPP_PRODUCT_CART_LIST: 'get_cpp_product_cart_list',
    GET_CPP_CALCULATE_ROOM_PRODUCT_PRICE_LIST_V2: 'get_cpp_calculate_room_product_price_list_v2',
    DELETE_ROOM_PRODUCTS: 'delete_room_products',
    MIGRATE_MISSING_STANDARD_FEATURE: 'migrate_missing_standard_feature'
  },
  PMS: {
    APALEO: {
      REGISTER_WEBHOOK: 'apaleo_register_webhook',
      HANDLE_RESERVATION_CREATED: 'apaleo_handle_reservation_created',
      HANDLE_RESERVATION_CHANGED: 'apaleo_handle_reservation_changed',
      HANDLE_RESERVATION_CANCELED: 'apaleo_handle_reservation_canceled',
      HANDLE_RESERVATION_DELETED: 'apaleo_handle_reservation_deleted',
      HANDLE_RESERVATION_UNIT_ASSIGNED: 'apaleo_handle_reservation_unit_assigned',
      HANDLE_RESERVATION_UNIT_UNASSIGNED: 'apaleo_handle_reservation_unit_unassigned',
      HANDLE_RESERVATION_AMENDED: 'apaleo_handle_reservation_amended',
      HANDLE_RESERVATION_SET_TO_NO_SHOW: 'apaleo_handle_reservation_set_to_no_show',
      HANDLE_UNIT_CREATED: 'apaleo_handle_unit_created',
      HANDLE_UNIT_CHANGED: 'apaleo_handle_unit_changed',
      HANDLE_UNIT_DELETED: 'apaleo_handle_unit_deleted',
      HANDLE_RATE_PLAN_CREATED: 'apaleo_handle_rate_plan_created',
      HANDLE_RATE_PLAN_CHANGED: 'apaleo_handle_rate_plan_changed',
      HANDLE_RATE_PLAN_DELETED: 'apaleo_handle_rate_plan_deleted',
      HANDLE_CITY_TAX_CREATED: 'apaleo_handle_city_tax_created',
      HANDLE_CITY_TAX_CHANGED: 'apaleo_handle_city_tax_changed',
      HANDLE_CITY_TAX_DELETED: 'apaleo_handle_city_tax_deleted',
      HANDLE_SERVICE_CREATED: 'apaleo_handle_service_created',
      HANDLE_SERVICE_CHANGED: 'apaleo_handle_service_changed',
      HANDLE_SERVICE_DELETED: 'apaleo_handle_service_deleted',
      HANDLE_BLOCK_CREATED: 'apaleo_handle_block_created',
      HANDLE_BLOCK_CHANGED: 'apaleo_handle_block_changed',
      HANDLE_BLOCK_DELETED: 'apaleo_handle_block_deleted',
      HANDLE_BLOCK_CONFIRMED: 'apaleo_handle_block_confirmed',
      HANDLE_BLOCK_CANCELED: 'apaleo_handle_block_canceled',
      HANDLE_MAINTENANCE_CREATED: 'apaleo_handle_maintenance_created',
      HANDLE_MAINTENANCE_CHANGED: 'apaleo_handle_maintenance_changed',
      HANDLE_MAINTENANCE_DELETED: 'apaleo_handle_maintenance_deleted',
      HANDLE_FOLIO_PAYMENT_POSTED: 'apaleo_handle_folio_payment_posted',
      HANDLE_FOLIO_PAYMENT_FAILED: 'apaleo_handle_folio_payment_failed',
      HANDLE_FOLIO_PAYMENT_CANCELED: 'apaleo_handle_folio_payment_canceled',
      HANDLE_FOLIO_REFUND_POSTED: 'apaleo_handle_folio_refund_posted',
      HANDLE_FOLIO_REFUND_FAILED: 'apaleo_handle_folio_refund_failed'
    },

    CONNECTOR: {
      GET_LIST: 'get_pms_connector_list',
      AUTHORIZE_CONNECTOR: 'authorize_connector',
      GET_PMS_HOTEL_LIST: 'get_pms_hotel_list',
      CREATE_MAPPING_HOTEL: 'create_mapping_hotel',
      DEAUTHORIZE_CONNECTOR: 'deauthorize_connector'
    },

    MEWS: {
      DEAUTHORIZE_CONNECTOR: 'mews_deauthorize_connector',
      SYNC_ROOM_UNIT: 'mews_sync_room_unit'
    },

    PUSH_RESERVATIONS_TO_PMS: 'push_reservations_to_pms'
  },
  ROOM_UNIT: {
    GET_CPP_CALENDAR_ROOM_RESERVATIONS: 'get_cpp_calendar_room_reservations',
    GET_CPP_CALENDAR_ROOM: 'get_cpp_calendar_room',
    SYNC_ROOM_UNIT_INVENTORY: 'sync_room_unit_inventory',
    GET_PMS_ROOM_UNITS_INVENTORY: 'get_pms_room_units_inventory',
    DELETE_MAINTENANCES: 'delete_maintenances',
    MIGRATE_MAINTENANCES: 'migrate_maintenances',
    REFRESH_ROOM_UNIT_AVAILABILITY_STATUS: 'refresh_room_unit_availability_status',
    REGENERATE_FEATURE_STRING: 'regenerate_feature_string'
  },
  HOTEL_RETAIL_FEATURE: {
    GET_CPP_RETAIL_FEATURES: 'get_cpp_retail_features'
  },
  HOTEL_CITY_TAX: {
    GET_PMS_CITY_TAX_LIST: 'get_pms_city_tax_list',
    UPDATE_HOTEL_CITY_TAX_LIST: 'update_hotel_city_tax_list'
  },
  HOTEL_TAX: {
    GET_PMS_TAX_LIST: 'get_pms_tax_list',
    UPDATE_HOTEL_TAX_LIST: 'update_hotel_tax_list'
  },
  CRON_JOB: {
    RELEASE_PROPOSED_RESERVATION: 'release_proposed_reservation',
    JOB_PULL_BLOCK_PMS: 'job_pull_block_pms',
    JOB_PULL_MAINTENANCE_PMS: 'job_pull_maintenance_pms',
    JOB_RELEASE_PENDING_PAYMENT: 'job_release_pending_payment'
  },

  EXCEL: {
    EXPORT_RESERVATIONS: 'export_reservations'
  },
  GUEST: {
    ADMIN_SYNC_GUESTS: 'admin_sync_guests'
  },
  USERS: {
    VALIDATE_USER: 'validate_user',
    VALIDATE_USERNAME: 'validate_username',
    VALIDATE_EMAIL: 'validate_email',
    GET_ROLE_LIST: 'get_role_list',
    GET_HOTEL_MEMBERS: 'get_hotel_members',
    GET_USER_DETAILS: 'get_user_details',
    GET_LIST_USER: 'get_list_user',
    CREATE_USER: 'create_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',
    GET_INTERNAL_USER: 'get_internal_user',
    UPDATE_HOTEL_MEMBER_ROLE: 'update_hotel_member_role',
    ASSIGN_HOTEL_MEMBER: 'assign_hotel_member',
    UNASSIGN_HOTEL_MEMBER: 'unassign_hotel_member'
  },
  HOTEL_CONFIGURATION: {
    GET_HOTEL_ACCESSIBILITY_INTEGRATION: 'get_hotel_accessibility_integration',
    CREATE_OR_UPDATE_HOTEL_ACCESSIBILITY_INTEGRATION:
      'create_or_update_hotel_accessibility_integration',
    DELETE_HOTEL_ACCESSIBILITY_INTEGRATION: 'delete_hotel_accessibility_integration',
    MIGRATION_HOTEL_CONFIGURATIONS: 'migration_hotel_configurations'
  },
  FEATURE_PRICING: {
    GET_FEATURE_DAILY_ADJUSTMENTS: 'get_feature_daily_adjustments',
    CREATE_OR_UPDATE_FEATURE_DAILY_ADJUSTMENTS: 'create_or_update_feature_daily_adjustments',
    REMOVE_FEATURE_DAILY_ADJUSTMENTS: 'remove_feature_daily_adjustments',
    MIGRATION_FEATURE_ADJUSTMENT: 'migration_feature_adjustment'
  },
  INTEGRATION: {
    GOOGLE_ANALYTICS: {
      CREATE_OR_UPDATE: 'create_or_update_google_analytics',
      DELETE: 'delete_google_analytics'
    },
    GOOGLE_TAG_MANAGER: {
      CREATE_OR_UPDATE: 'create_or_update_google_tag_manager',
      DELETE: 'delete_google_tag_manager'
    },
    GOOGLE_ADS: {
      CREATE_OR_UPDATE: 'create_or_update_google_ads',
      DELETE: 'delete_google_ads'
    },
    META_CONVERSION: {
      CREATE_OR_UPDATE: 'create_or_update_meta_conversion_integration',
      DELETE: 'delete_meta_conversion_integration'
    },
    PROPERTY_TRACKING: {
      GET_LIST: 'get_property_tracking_list',
      CREATE_OR_UPDATE: 'create_or_update_property_tracking',
      DELETE: 'delete_property_tracking'
    },
    MARKETING_LIST: {
      GET_LIST: 'get_marketing_list'
    },
    REQUEST_APALEO_INTEGRATION: 'request_apaleo_integration'
  },
  BUSINESS_INTELLIGENCE: {
    GENERATE_QUICKSIGHT_DASHBOARD_URL: 'generate_quicksight_dashboard_url'
  },
  HOTEL: {
    UPLOAD_EMAIL_GENERAL_IMAGES: 'upload_email_general_images'
  }
};

export const CRON_JOB_CMD_BASE = 'cron_job' as const;

export const CRON_JOB_CMD = {
  JOB_RELEASE_PENDING_PAYMENT: `${CRON_JOB_CMD_BASE}.job_release_pending_payment` as const,
  JOB_DELETE_DUPLICATED_RESTRICTIONS: `${CRON_JOB_CMD_BASE}.job_delete_duplicated_restrictions`,
  JOB_PULL_MAINTENANCE_PMS: `${CRON_JOB_CMD_BASE}.job_pull_maintenance_pms`,
  JOB_PULL_BLOCK_PMS: `${CRON_JOB_CMD_BASE}.job_pull_block_pms`,
  JOB_PUSH_RATE_TO_PMS: `${CRON_JOB_CMD_BASE}.job_push_rate_to_pms`,
  JOB_SET_CLOSING_HOUR: `${CRON_JOB_CMD_BASE}.job_set_closing_hour`,
  JOB_PULL_PMS_RESTRICTIONS: `${CRON_JOB_CMD_BASE}.job_pull_pms_restrictions`,
  JOB_PULL_PMS_RESERVATIONS: `${CRON_JOB_CMD_BASE}.job_pull_pms_reservations`,
  JOB_PULL_PMS_AVAILABILITY: `${CRON_JOB_CMD_BASE}.job_pull_pms_availability`,
  JOB_PULL_PMS_RATE_PLAN_PRICING: `${CRON_JOB_CMD_BASE}.job_pull_pms_rate_plan_pricing`,
  RELEASE_PROPOSED_RESERVATION: `${CRON_JOB_CMD_BASE}.release_proposed_reservation`
} as const;

export const ISE_SOCKET_CMD = {
  CREATE_PAYMENT_STATUS: 'ws_create_payment_status',
  PAYMENT_COMPLETE: 'ws_payment_complete'
};
