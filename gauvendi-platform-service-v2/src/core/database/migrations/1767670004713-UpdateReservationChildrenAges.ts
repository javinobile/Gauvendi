import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReservationChildrenAges1767670004713 implements MigrationInterface {
  name = 'UpdateReservationChildrenAges1767670004713';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* 0️⃣ Drop view */
    await queryRunner.query(`
      DROP VIEW public.v_reservation_for_fact;
    `);

    /* 1️⃣ Alter table */
    await queryRunner.query(`
      ALTER TABLE "reservation"
      ALTER COLUMN "children_ages"
      TYPE integer[]
      USING (
        CASE
          WHEN children_ages IS NULL OR children_ages = '[]' THEN NULL
          ELSE string_to_array(
            replace(replace(children_ages, '[', ''), ']', ''),
            ','
          )::integer[]
        END
      );
    `);

    /* 2️⃣ Update view */
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

          /* 🔁 integer[] → text */
          CASE
            WHEN children_ages IS NULL THEN NULL
            ELSE array_to_string(children_ages, ',')
          END AS children_ages,

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
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    /* 1️⃣ Revert view */
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

    /* 2️⃣ Revert table */
    await queryRunner.query(`
      ALTER TABLE "reservation"
      ALTER COLUMN "children_ages"
      TYPE character varying(255)
      USING array_to_string("children_ages", ',');
    `);
  }
}
