import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMarketSegmentIDColumnForView1766743898424 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE OR REPLACE VIEW public.v_rate_plan_for_fact AS
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
                NULLIF(BTRIM(market_segment_id::text), '')::uuid AS market_segment_id,
                false AS soft_delete,
                created_by,
                created_at AS created_date,
                updated_by,
                updated_at AS updated_date
            FROM rate_plan;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_rate_plan_for_fact;`);
  }
}
