// === TABLE CREATION ORDER ===
// 1. room_product_daily_availability
// 2. room_product_extra_occupancy_rate
// 3. hotel_configuration
// 4. rate_plan_cxl_policy_daily
// 5. rate_plan_daily_extra_service
// 6. rate_plan_daily_payment_term
// 7. room_product_daily_base_price
// 8. room_product_daily_selling_price
// 9. room_product_pricing_method_detail
// 10. hotel_retail_category_translation
// 11. hotel_retail_category
// 12. hotel_retail_feature_translation
// 13. rate_plan_feature_daily_rate
// 14. room_unit_retail_feature
// 15. event_category
// 16. event
// 17. event_feature
// 18. hotel_retail_feature
// 19. room_product_retail_feature
// 20. room_product_feature_rate_adjustment
// 21. room_product_rate_plan_extra_occupancy_rate_adjustment
// 22. room_product_rate_plan
// 23. room_product_rate_plan_availability_adjustment
// 24. rate_plan_daily_adjustment
// 25. rate_plan_daily_sellability
// 26. rate_plan_derived_setting
// 27. rate_plan_extra_service
// 28. rate_plan_payment_settlement_setting
// 29. rate_plan_payment_term_setting
// 30. rate_plan_sellability
// 31. rate_plan_translation
// 32. hotel_cancellation_policy
// 33. hotel_payment_term
// 34. rate_plan
// 35. currency
// 36. global_payment_method
// 37. booking_transaction
// 38. booking
// 39. company
// 40. reservation_amenity_date
// 41. reservation_amenity
// 42. reservation_room
// 43. reservation_time_slice
// 44. reservation
// 45. guest
// 46. country
// 47. file_library
// 48. hotel_tax
// 49. hotel_tax_setting
// 50. identity_role
// 51. identity_access_control
// 52. identity_user_access_control
// 53. identity_user
// 54. hotel
// 55. template_amenity
// 56. hotel_age_category
// 57. hotel_amenity_price
// 58. hotel_amenity
// 59. room_product_extra
// 60. room_product_image
// 61. room_product_mapping_pms
// 62. hotel_standard_feature_translation
// 63. hotel_standard_feature
// 64. room_product_standard_feature
// 65. room_product_type_mapping
// 66. room_product_base_price_setting
// 67. room_product_mapping
// 68. restriction_automation_setting
// 69. room_product
// 70. room_product_assigned_unit
// 71. room_unit_availability
// 72. room_unit
// 73. restriction
// 74. hotel_restriction_setting
// 75. translation_i18n_locale
// 76. translation_hotel_language_bundle
// 77. translation_dynamic_content
// 78. translation_entity_config
// 79. translation_static_content
// 80. background_job
// 81. occ_reference
// 82. mapping_rfc_dynamic_pricing
// 83. identity_permission
// 84. identity_auth0_user
// 85. organisation
// 86. organisation_widget_config
// 87. mapping_standard_feature
// 88. mapping_retail_feature
// 89. connector
// 90. mapping_pms_hotel
// 91. hotel_template_email
// 92. hotel_payment_mode
// 93. hotel_payment_method_setting
// 94. hotel_payment_account
// 95. hotel_market_segment
// 96. hotel_city_tax_age_group
// 97. hotel_city_tax
// 98. global_payment_provider
// 99. flyway_schema_history
// 100. event_label
// 101. brand
// 102. currency_rate
// 103. supported_reservation_source
// 104. reservation_related_mrfc
// 105. customer_payment_gateway
// 106. booking_upsell_information
// 107. booking_proposal_setting
// 108. hotel_service_setting

// === FOREIGN KEY DEPENDENCIES ===
// room_product_daily_availability -> room_product (via room_product_id)
// room_product_extra_occupancy_rate -> room_product (via room_product_id)
// hotel_configuration -> hotel (via hotel_id)
// rate_plan_cxl_policy_daily -> rate_plan (via rate_plan_id)
// rate_plan_daily_extra_service -> rate_plan (via rate_plan_id)
// rate_plan_daily_payment_term -> rate_plan (via rate_plan_id)
// room_product_daily_base_price -> room_product (via room_product_id)
// room_product_daily_base_price -> rate_plan (via rate_plan_id)
// room_product_daily_selling_price -> room_product (via room_product_id)
// room_product_daily_selling_price -> rate_plan (via rate_plan_id)
// room_product_pricing_method_detail -> room_product (via room_product_id)
// room_product_pricing_method_detail -> rate_plan (via rate_plan_id)
// hotel_retail_category_translation -> hotel_retail_category (via hotel_retail_category_id)
// hotel_retail_feature_translation -> hotel_retail_feature (via hotel_retail_feature_id)
// rate_plan_feature_daily_rate -> rate_plan (via rate_plan_id)
// rate_plan_feature_daily_rate -> hotel_retail_feature (via feature_id)
// room_unit_retail_feature -> room_unit (via room_unit_id)
// room_unit_retail_feature -> hotel_retail_feature (via retail_feature_id)
// event -> hotel (via hotel_id)
// event -> event_category (via category_id)
// event_feature -> event (via event_id)
// event_feature -> hotel_retail_feature (via hotel_retail_feature_id)
// hotel_retail_feature -> hotel_retail_category (via hotel_retail_category_id)
// room_product_retail_feature -> room_product (via room_product_id)
// room_product_retail_feature -> hotel_retail_feature (via retail_feature_id)
// room_product_feature_rate_adjustment -> room_product (via room_product_id)
// room_product_feature_rate_adjustment -> room_product_rate_plan (via room_product_rate_plan_id)
// room_product_feature_rate_adjustment -> room_product_retail_feature (via feature_id)
// room_product_rate_plan_extra_occupancy_rate_adjustment -> room_product_rate_plan (via room_product_rate_plan_id)
// room_product_rate_plan -> rate_plan (via rate_plan_id)
// room_product_rate_plan -> room_product (via room_product_id)
// room_product_rate_plan_availability_adjustment -> room_product_rate_plan (via room_product_rate_plan_id)
// room_product_rate_plan_availability_adjustment -> rate_plan (via rate_plan_id)
// rate_plan_daily_adjustment -> rate_plan (via rate_plan_id)
// rate_plan_daily_sellability -> rate_plan (via rate_plan_id)
// rate_plan_derived_setting -> rate_plan (via derived_rate_plan_id)
// rate_plan_derived_setting -> rate_plan (via rate_plan_id)
// rate_plan_extra_service -> rate_plan (via rate_plan_id)
// rate_plan_payment_settlement_setting -> rate_plan (via rate_plan_id)
// rate_plan_payment_term_setting -> rate_plan (via rate_plan_id)
// rate_plan_sellability -> rate_plan (via rate_plan_id)
// rate_plan_translation -> rate_plan (via rate_plan_id)
// hotel_cancellation_policy -> hotel (via hotel_id)
// hotel_payment_term -> hotel (via hotel_id)
// rate_plan -> hotel_cancellation_policy (via hotel_cxl_policy_code)
// rate_plan -> hotel_payment_term (via payment_term_code)
// booking_transaction -> currency (via currency_id)
// booking_transaction -> booking (via booking_id)
// booking_transaction -> global_payment_method (via payment_mode)
// booking -> guest (via booker_id)
// reservation_amenity_date -> reservation_amenity (via reservation_amenity_id)
// reservation_amenity -> reservation (via reservation_id)
// reservation_amenity -> hotel_amenity (via hotel_amenity_id)
// reservation_room -> reservation (via reservation_id)
// reservation_time_slice -> reservation (via reservation_id)
// reservation -> booking (via booking_id)
// reservation -> room_product (via room_product_id)
// reservation -> rate_plan (via rate_plan_id)
// reservation -> guest (via primary_guest_id)
// reservation -> company (via company_id)
// reservation -> hotel_cancellation_policy (via cxl_policy_code)
// reservation -> hotel (via hotel_id)
// guest -> country (via country_id)
// hotel_tax -> hotel (via hotel_id)
// hotel_tax_setting -> hotel (via hotel_id)
// hotel_tax_setting -> hotel_tax (via tax_code)
// identity_access_control -> identity_role (via role_id)
// identity_access_control -> hotel (via hotel_id)
// identity_user_access_control -> identity_user (via user_id)
// identity_user_access_control -> identity_access_control (via access_control_id)
// identity_user -> hotel (via hotel_id)
// hotel -> country (via country_id)
// hotel -> currency (via base_currency_id)
// hotel -> file_library (via icon_image_id)
// hotel -> file_library (via email_image_id)
// hotel_age_category -> hotel (via hotel_id)
// hotel_amenity_price -> hotel_amenity (via hotel_amenity_id)
// hotel_amenity_price -> hotel_age_category (via hotel_age_category_id)
// hotel_amenity -> hotel (via hotel_id)
// hotel_amenity -> template_amenity (via template_amenity_id)
// room_product_extra -> room_product (via room_product_id)
// room_product_extra -> hotel_amenity (via extras_id)
// room_product_image -> room_product (via room_product_id)
// room_product_mapping_pms -> room_product (via room_product_id)
// hotel_standard_feature_translation -> hotel_standard_feature (via hotel_standard_feature_id)
// room_product_standard_feature -> room_product (via room_product_id)
// room_product_standard_feature -> hotel_standard_feature (via standard_feature_id)
// room_product_type_mapping -> room_product (via room_product_id)
// room_product_base_price_setting -> room_product (via room_product_id)
// room_product_mapping -> room_product (via room_product_id)
// room_product_mapping -> room_product (via related_room_product_id)
// restriction_automation_setting -> room_product (via reference_id)
// room_product_assigned_unit -> room_product (via room_product_id)
// room_product_assigned_unit -> room_unit (via room_unit_id)
// room_unit_availability -> room_unit (via room_unit_id)
// translation_hotel_language_bundle -> translation_i18n_locale (via i18n_locale_id)
// translation_dynamic_content -> translation_entity_config (via etc_id)
// translation_dynamic_content -> translation_hotel_language_bundle (via hlb_id)
// translation_static_content -> translation_entity_config (via etc_id)
// translation_static_content -> translation_i18n_locale (via i18n_locale_id)
// mapping_rfc_dynamic_pricing -> hotel (via hotel_id)
// mapping_rfc_dynamic_pricing -> rate_plan (via rate_plan_id)
// mapping_rfc_dynamic_pricing -> room_product (via room_product_id)
// connector -> organisation (via organisation_id)
// connector -> hotel (via hotel_id)
// mapping_pms_hotel -> connector (via connector_id)
// hotel_payment_mode -> hotel (via hotel_id)
// hotel_payment_account -> hotel (via hotel_id)
// hotel_market_segment -> hotel (via hotel_id)
// hotel_city_tax_age_group -> hotel (via hotel_id)
// hotel_city_tax_age_group -> hotel_city_tax (via hotel_city_tax_id)
// hotel_city_tax -> hotel (via hotel_id)
// currency_rate -> currency (via base_currency_id)
// currency_rate -> currency (via exchange_currency_id)
// customer_payment_gateway -> guest (via internal_customer_id)

// === DEPENDENCY ANALYSIS ===
// ❌ Found dependency order issues:
//    ISSUE: "room_product_daily_availability" (position 1) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_extra_occupancy_rate" (position 2) references "room_product" (position 69) which is created later
//    ISSUE: "hotel_configuration" (position 3) references "hotel" (position 54) which is created later
//    ISSUE: "rate_plan_cxl_policy_daily" (position 4) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_daily_extra_service" (position 5) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_daily_payment_term" (position 6) references "rate_plan" (position 34) which is created later
//    ISSUE: "room_product_daily_base_price" (position 7) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_daily_base_price" (position 7) references "rate_plan" (position 34) which is created later
//    ISSUE: "room_product_daily_selling_price" (position 8) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_daily_selling_price" (position 8) references "rate_plan" (position 34) which is created later
//    ISSUE: "room_product_pricing_method_detail" (position 9) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_pricing_method_detail" (position 9) references "rate_plan" (position 34) which is created later
//    ISSUE: "hotel_retail_category_translation" (position 10) references "hotel_retail_category" (position 11) which is created later
//    ISSUE: "hotel_retail_feature_translation" (position 12) references "hotel_retail_feature" (position 18) which is created later
//    ISSUE: "rate_plan_feature_daily_rate" (position 13) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_feature_daily_rate" (position 13) references "hotel_retail_feature" (position 18) which is created later
//    ISSUE: "room_unit_retail_feature" (position 14) references "room_unit" (position 72) which is created later
//    ISSUE: "room_unit_retail_feature" (position 14) references "hotel_retail_feature" (position 18) which is created later
//    ISSUE: "event" (position 16) references "hotel" (position 54) which is created later
//    ISSUE: "event_feature" (position 17) references "hotel_retail_feature" (position 18) which is created later
//    ISSUE: "room_product_retail_feature" (position 19) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_feature_rate_adjustment" (position 20) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_feature_rate_adjustment" (position 20) references "room_product_rate_plan" (position 22) which is created later
//    ISSUE: "room_product_rate_plan_extra_occupancy_rate_adjustment" (position 21) references "room_product_rate_plan" (position 22) which is created later
//    ISSUE: "room_product_rate_plan" (position 22) references "rate_plan" (position 34) which is created later
//    ISSUE: "room_product_rate_plan" (position 22) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_rate_plan_availability_adjustment" (position 23) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_daily_adjustment" (position 24) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_daily_sellability" (position 25) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_derived_setting" (position 26) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_derived_setting" (position 26) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_extra_service" (position 27) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_payment_settlement_setting" (position 28) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_payment_term_setting" (position 29) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_sellability" (position 30) references "rate_plan" (position 34) which is created later
//    ISSUE: "rate_plan_translation" (position 31) references "rate_plan" (position 34) which is created later
//    ISSUE: "hotel_cancellation_policy" (position 32) references "hotel" (position 54) which is created later
//    ISSUE: "hotel_payment_term" (position 33) references "hotel" (position 54) which is created later
//    ISSUE: "booking_transaction" (position 37) references "booking" (position 38) which is created later
//    ISSUE: "booking" (position 38) references "guest" (position 45) which is created later
//    ISSUE: "reservation_amenity_date" (position 40) references "reservation_amenity" (position 41) which is created later
//    ISSUE: "reservation_amenity" (position 41) references "reservation" (position 44) which is created later
//    ISSUE: "reservation_amenity" (position 41) references "hotel_amenity" (position 58) which is created later
//    ISSUE: "reservation_room" (position 42) references "reservation" (position 44) which is created later
//    ISSUE: "reservation_time_slice" (position 43) references "reservation" (position 44) which is created later
//    ISSUE: "reservation" (position 44) references "room_product" (position 69) which is created later
//    ISSUE: "reservation" (position 44) references "guest" (position 45) which is created later
//    ISSUE: "reservation" (position 44) references "hotel" (position 54) which is created later
//    ISSUE: "guest" (position 45) references "country" (position 46) which is created later
//    ISSUE: "hotel_tax" (position 48) references "hotel" (position 54) which is created later
//    ISSUE: "hotel_tax_setting" (position 49) references "hotel" (position 54) which is created later
//    ISSUE: "identity_access_control" (position 51) references "hotel" (position 54) which is created later
//    ISSUE: "identity_user_access_control" (position 52) references "identity_user" (position 53) which is created later
//    ISSUE: "identity_user" (position 53) references "hotel" (position 54) which is created later
//    ISSUE: "hotel_amenity_price" (position 57) references "hotel_amenity" (position 58) which is created later
//    ISSUE: "room_product_extra" (position 59) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_image" (position 60) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_mapping_pms" (position 61) references "room_product" (position 69) which is created later
//    ISSUE: "hotel_standard_feature_translation" (position 62) references "hotel_standard_feature" (position 63) which is created later
//    ISSUE: "room_product_standard_feature" (position 64) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_type_mapping" (position 65) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_base_price_setting" (position 66) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_mapping" (position 67) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_mapping" (position 67) references "room_product" (position 69) which is created later
//    ISSUE: "restriction_automation_setting" (position 68) references "room_product" (position 69) which is created later
//    ISSUE: "room_product_assigned_unit" (position 70) references "room_unit" (position 72) which is created later
//    ISSUE: "room_unit_availability" (position 71) references "room_unit" (position 72) which is created later
//    ISSUE: "translation_dynamic_content" (position 77) references "translation_entity_config" (position 78) which is created later
//    ISSUE: "hotel_city_tax_age_group" (position 96) references "hotel_city_tax" (position 97) which is created later

// === SUMMARY ===
// Total tables: 108
// Total foreign key relationships: 115
// Dependency issues: 69
