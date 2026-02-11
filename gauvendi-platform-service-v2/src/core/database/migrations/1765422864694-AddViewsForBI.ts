import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewsForBI1765422864694 implements MigrationInterface {
  name = 'AddViewsForBI1765422864694';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // View: v_booking_upsell_information_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_booking_upsell_information_for_fact
        AS
        SELECT id,
            hotel_id AS property_id,
            booking_id,
            lowest_price_option_list,
            lowest_price_total_base_amount,
            lowest_price_total_tax_amount,
            lowest_price_total_gross_amount,
            lowest_price_accommodation_base_amount,
            lowest_price_accommodation_tax_amount,
            lowest_price_accommodation_gross_amount,
            lowest_price_included_service_base_amount,
            lowest_price_included_service_tax_amount,
            lowest_price_included_service_gross_amount,
            lowest_price_service_base_amount,
            lowest_price_service_tax_amount,
            lowest_price_service_gross_amount,
            book_total_base_amount,
            book_total_tax_amount,
            book_total_gross_amount,
            book_accommodation_base_amount,
            book_accommodation_tax_amount,
            book_accommodation_gross_amount,
            book_included_service_base_amount,
            book_included_service_tax_amount,
            book_included_service_gross_amount,
            book_service_base_amount,
            book_service_tax_amount,
            book_service_gross_amount,
            city_tax_amount,
            deleted_at IS NOT NULL AS soft_delete,
            created_by::character varying(255) AS created_by,
            created_at AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at AS updated_date
        FROM booking_upsell_information;
    `);

    // View: v_guest_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_guest_for_fact
        AS
        SELECT id,
            country_id,
            first_name,
            last_name,
            email_address,
            address,
            city,
            state,
            postal_code,
            phone_number,
            country_number,
            company_postal_code,
            company_country,
            company_city,
            company_address::text AS company_address,
            company_email,
            company_name,
            company_tax_id,
            deleted_at IS NOT NULL AS soft_delete,
            created_by::character varying(255) AS created_by,
            created_at::timestamp without time zone AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at::timestamp without time zone AS updated_date,
            is_main_guest,
            is_booker,
            is_returning_guest
        FROM guest;
    `);

    // View: v_hotel_amenity_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_hotel_amenity_for_fact
        AS
        SELECT id,
            hotel_id,
            icon_image_id,
            template_amenity_id,
            name,
            description,
            base_rate::numeric(26,4) AS base_rate,
            amenity_type,
            pricing_unit,
            ise_pricing_display_mode,
            availability,
            post_next_day,
            display_sequence,
            mapping_hotel_amenity_code,
            false AS soft_delete,
            created_by::character varying(255) AS created_by,
            created_at AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at AS updated_date,
            code,
            status,
            is_included,
            array_to_string(distribution_channel, ','::text) AS distribution_channel,
            selling_type,
            linked_amenity_code::text AS linked_amenity_code
        FROM hotel_amenity;
    `);

    // View: v_hotel_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_hotel_for_fact
        AS
        SELECT id,
            brand_id,
            icon_image_id,
            email_image_id,
            organisation_id,
            base_currency_id,
            icon_symbol_image_id,
            custom_theme_image_id,
            background_category_image_id,
            name,
            code,
            status,
            array_to_string(email_address, ','::text)::character varying(500) AS email_address,
            signature,
            sender_name,
            sender_email,
            time_zone,
            tax_setting,
            service_charge_setting,
            is_city_tax_included_selling_price,
            stay_option_background_image_id,
            customize_stay_option_background_image_id,
            stay_option_suggestion_image_id,
            signature_background_image_id,
            country_id,
            lowest_price_image_id,
            preferred_language_code,
            initial_setup,
            phone_code,
            phone_number,
            room_number,
            deleted_at IS NOT NULL AS soft_delete,
            created_by::character varying(255) AS created_by,
            created_at AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at AS updated_date,
            city,
            state,
            postal_code,
            address,
            address_display,
            latitude,
            longitude,
            description,
            phone,
            measure_metric
        FROM hotel;
    `);

    // View: v_rate_plan_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_rate_plan_for_fact
        AS
        SELECT id,
            hotel_id,
            name,
            code,
            pricing_methodology,
            hour_prior,
            display_unit,
            cancellation_fee_value,
            cancellation_fee_unit,
            hotel_cxl_policy_code,
            payment_term_code,
            pay_at_hotel,
            pay_on_confirmation,
            description,
            rounding_mode,
            status,
            pms_mapping_rate_plan_code AS mapping_rate_plan_code,
            type,
            array_to_string(promo_codes, ','::text) AS promo_code,
            is_primary,
            NULL::boolean AS is_sellable,
            array_to_string(distribution_channel, ','::text)::character varying(200) AS distribution_channel,
            rfc_attribute_mode,
            mrfc_positioning_mode,
            hotel_extras_code_list,
            adjustment_value,
            adjustment_unit,
            selling_strategy_type,
            market_segment_id::uuid AS market_segment_id,
            false AS soft_delete,
            created_by,
            created_at AS created_date,
            updated_by,
            updated_at AS updated_date
        FROM rate_plan;
    `);

    // View: v_reservation_amenity_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_reservation_amenity_for_fact
        AS
        SELECT id,
            reservation_id,
            hotel_amenity_id,
            master_hotel_amenity_id,
            total_base_amount,
            total_gross_amount,
            tax_amount,
            service_charge_amount,
            age_category_code,
            deleted_at IS NOT NULL AS soft_delete,
            COALESCE(created_by::character varying(255), 'system'::character varying) AS created_by,
            created_at::timestamp without time zone AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at::timestamp without time zone AS updated_date
        FROM reservation_amenity;
    `);

    // View: v_reservation_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_reservation_for_fact
        AS
        SELECT id,
            hotel_id AS property_id,
            booking_id,
            reservation_number,
            trip_purpose,
            mapping_reservation_code,
            mapping_channel_reservation_code,
            arrival::timestamp without time zone AS arrival,
            departure::timestamp without time zone AS departure,
            booking_flow,
            channel,
            source,
            status,
            booking_language,
            rate_plan_id AS sales_plan_id,
            market_segment_id,
            rate_plan_type AS sales_plan_type,
            room_product_id,
            adults,
            children_ages,
            pets,
            primary_guest_id,
            additional_guests,
            company_id,
            total_base_amount,
            tax_amount,
            tax_details::text AS tax_details,
            city_tax_amount,
            city_tax_details::text AS city_tax_details,
            service_charge_amount,
            total_gross_amount,
            pay_on_confirmation_amount,
            pay_at_hotel_amount,
            balance,
            booking_date::timestamp without time zone AS booking_date,
            released_date::timestamp without time zone AS released_date,
            cancelled_by,
            cancelled_date::timestamp without time zone AS cancelled_date,
            cancelled_reason,
            cancellation_fee,
            cxl_policy_code,
            no_show_fee,
            matched_feature,
            mismatched_feature,
            currency_code,
            payment_term_code,
            hotel_payment_mode_code,
            promo_code,
            hour_prior,
            is_locked,
            note,
            guest_note,
            deleted_at IS NOT NULL AS soft_delete,
            created_by,
            created_at::timestamp without time zone AS created_date,
            updated_by,
            updated_at::timestamp without time zone AS updated_date
        FROM reservation;
    `);

    // View: v_reservation_related_mrfc_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_reservation_related_mrfc_for_fact
        AS
        SELECT id,
            hotel_id AS property_id,
            reservation_id,
            mrfc_id,
            mrfc_base_amount,
            mrfc_gross_amount,
            reservation_gross_amount,
            reservation_gross_accommodation_amount,
            reservation_gross_included_service_amount,
            reservation_gross_service_amount,
            mrfc_gross_accommodation_amount,
            deleted_at IS NOT NULL AS soft_delete,
            created_by::character varying(255) AS created_by,
            created_at AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at AS updated_date
        FROM reservation_related_mrfc;
    `);

    // View: v_reservation_time_slice_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_reservation_time_slice_for_fact
        AS
        SELECT id,
            room_id,
            reservation_id,
            room_product_id AS rfc_id,
            millisec_from_time,
            millisec_to_time,
            total_base_amount,
            total_gross_amount,
            tax_amount,
            service_charge_amount,
            is_locked,
            deleted_at IS NOT NULL AS soft_delete,
            COALESCE(created_by::character varying(255), 'system'::character varying) AS created_by,
            created_at::timestamp without time zone AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at::timestamp without time zone AS updated_date,
            from_time::timestamp without time zone AS from_time,
            to_time::timestamp without time zone AS to_time
        FROM reservation_time_slice;
    `);

    // View: v_room_product_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_room_product_for_fact
        AS
        SELECT id,
            hotel_id,
            name::character varying(255) AS name,
            code::character varying(255) AS code,
            description,
            NULL::smallint AS capacity_adult,
            NULL::smallint AS capacity_children,
            NULL::integer AS min_child,
            NULL::integer AS max_child,
            NULL::character varying(60) AS rfc_type,
            rfc_allocation_setting::character varying(60) AS rfc_allocation_setting,
            status::character varying(60) AS status,
            number_of_bedrooms,
            type::character varying(60) AS type,
            extra_adult::smallint AS extra_adult,
            extra_children::smallint AS extra_children,
            space::integer AS space,
            feature_string::character varying(2000) AS feature_string,
            capacity_default::smallint AS capacity_default,
            maximum_adult::smallint AS maximum_adult,
            maximum_kid::smallint AS maximum_kid,
            maximum_pet::smallint AS maximum_pet,
            capacity_extra::smallint AS capacity_extra,
            extra_bed_adult::smallint AS extra_bed_adult,
            extra_bed_kid::smallint AS extra_bed_kid,
            array_to_string(travel_tag, ','::text) AS travel_tag,
            array_to_string(occasion, ','::text) AS occasion,
            is_sellable,
            COALESCE(NULLIF(array_to_string(distribution_channel, ','::text), ''::text), '[]'::text)::character varying(200) AS distribution_channel,
            COALESCE(NULLIF(TRIM(BOTH FROM base_price_mode), ''::text), 'FEATURE_BASED'::text)::character varying(200) AS base_price_mode,
            deleted_at IS NOT NULL AS soft_delete,
            COALESCE(created_by::character varying(255), 'system'::character varying) AS created_by,
            created_at::timestamp without time zone AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at::timestamp without time zone AS updated_date
        FROM room_product;
    `);

    // View: v_room_unit_availability_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_room_unit_availability_for_fact
        AS
        SELECT id,
            room_unit_id AS room_id,
            hotel_id,
            status::character varying(60) AS status,
            date::date AS date,
            false AS soft_delete,
            COALESCE(created_by::character varying(255), 'system'::character varying) AS created_by,
            created_at::timestamp without time zone AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at::timestamp without time zone AS updated_date
        FROM room_unit_availability;
    `);

    // View: v_room_unit_for_fact
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_room_unit_for_fact
        AS
        SELECT id,
            hotel_id,
            mapping_pms_code::character varying(100) AS mapping_room_code,
            room_number::character varying(100) AS room_number,
            capacity_default,
            maximum_adult,
            maximum_kid,
            capacity_extra,
            extra_bed_adult,
            extra_bed_kid,
            room_floor::character varying(100) AS room_floor,
            building::character varying(200) AS building,
            connecting_room_id,
            number_of_bedrooms::integer AS number_of_bedrooms,
            space::integer AS space,
            feature_string::character varying(3000) AS feature_string,
            is_changed,
            status::character varying(40) AS status,
            deleted_at IS NOT NULL AS soft_delete,
            COALESCE(created_by::character varying(255), 'system'::character varying) AS created_by,
            created_at::timestamp without time zone AS created_date,
            updated_by::character varying(255) AS updated_by,
            updated_at::timestamp without time zone AS updated_date
        FROM room_unit;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_booking_upsell_information_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_guest_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_hotel_amenity_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_hotel_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_rate_plan_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_reservation_amenity_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_reservation_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_reservation_related_mrfc_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_reservation_time_slice_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_room_product_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_room_unit_availability_for_fact`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_room_unit_for_fact`);
  }
}
