import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSellingPriceCacheAmbiguousColumns1757040000000 implements MigrationInterface {
  name = 'FixSellingPriceCacheAmbiguousColumns1757040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // // Fix the update_selling_price_cache function to resolve ambiguous column references
    // await queryRunner.query(`
    //   CREATE OR REPLACE FUNCTION update_selling_price_cache(
    //     p_hotel_id VARCHAR(36),
    //     p_room_product_id UUID,
    //     p_rate_plan_id UUID,
    //     p_date TEXT,
    //     p_occupancy INTEGER DEFAULT 1
    //   ) RETURNS VOID AS $$
    //   DECLARE
    //     price_data RECORD;
    //   BEGIN
    //     -- Use advisory lock to prevent concurrent calculations for the same record
    //     PERFORM pg_advisory_lock(
    //       hashtext(p_hotel_id || p_room_product_id::text || p_rate_plan_id::text || p_date || p_occupancy::text)
    //     );

    //     -- Compute the selling price
    //     SELECT * INTO price_data 
    //     FROM compute_selling_price(p_hotel_id, p_room_product_id, p_rate_plan_id, p_date, p_occupancy);

    //     -- Update or insert the cache record
    //     INSERT INTO room_product_daily_selling_price (
    //       hotel_id, room_product_id, rate_plan_id, date, occupancy,
    //       base_price, feature_adjustments, rate_plan_adjustments, 
    //       occupancy_surcharges, service_charges, net_price, gross_price,
    //       tax_rate, tax_amount, last_calculated_at, is_stale, calculation_version
    //     ) VALUES (
    //       p_hotel_id, p_room_product_id, p_rate_plan_id, p_date, p_occupancy,
    //       price_data.base_price, price_data.feature_adjustments, price_data.rate_plan_adjustments,
    //       price_data.occupancy_surcharges, price_data.service_charges, price_data.net_price, price_data.gross_price,
    //       price_data.tax_rate, price_data.tax_amount, NOW(), false, '1.0'
    //     )
    //     ON CONFLICT (hotel_id, room_product_id, rate_plan_id, date, occupancy)
    //     DO UPDATE SET
    //       base_price = EXCLUDED.base_price,
    //       feature_adjustments = EXCLUDED.feature_adjustments,
    //       rate_plan_adjustments = EXCLUDED.rate_plan_adjustments,
    //       occupancy_surcharges = EXCLUDED.occupancy_surcharges,
    //       service_charges = EXCLUDED.service_charges,
    //       net_price = EXCLUDED.net_price,
    //       gross_price = EXCLUDED.gross_price,
    //       tax_rate = EXCLUDED.tax_rate,
    //       tax_amount = EXCLUDED.tax_amount,
    //       last_calculated_at = EXCLUDED.last_calculated_at,
    //       is_stale = EXCLUDED.is_stale,
    //       updated_at = NOW();

    //     -- Release the advisory lock
    //     PERFORM pg_advisory_unlock(
    //       hashtext(p_hotel_id || p_room_product_id::text || p_rate_plan_id::text || p_date || p_occupancy::text)
    //     );
    //   END;
    //   $$ LANGUAGE plpgsql;
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the original function with ambiguous column references
    // Note: This will bring back the original issue, but maintains rollback capability
    // await queryRunner.query(`
    //   CREATE OR REPLACE FUNCTION update_selling_price_cache(
    //     p_hotel_id VARCHAR(36),
    //     p_room_product_id UUID,
    //     p_rate_plan_id UUID,
    //     p_date TEXT,
    //     p_occupancy INTEGER DEFAULT 1
    //   ) RETURNS VOID AS $$
    //   DECLARE
    //     price_data RECORD;
    //   BEGIN
    //     -- Use advisory lock to prevent concurrent calculations for the same record
    //     PERFORM pg_advisory_lock(
    //       hashtext(p_hotel_id || p_room_product_id::text || p_rate_plan_id::text || p_date || p_occupancy::text)
    //     );

    //     -- Compute the selling price
    //     SELECT * INTO price_data 
    //     FROM compute_selling_price(p_hotel_id, p_room_product_id, p_rate_plan_id, p_date, p_occupancy);

    //     -- Update or insert the cache record
    //     INSERT INTO room_product_daily_selling_price (
    //       hotel_id, room_product_id, rate_plan_id, date, occupancy,
    //       base_price, feature_adjustments, rate_plan_adjustments, 
    //       occupancy_surcharges, service_charges, net_price, gross_price,
    //       tax_rate, tax_amount, last_calculated_at, is_stale, calculation_version
    //     ) VALUES (
    //       p_hotel_id, p_room_product_id, p_rate_plan_id, p_date, p_occupancy,
    //       price_data.base_price, price_data.feature_adjustments, price_data.rate_plan_adjustments,
    //       price_data.occupancy_surcharges, price_data.service_charges, price_data.net_price, price_data.gross_price,
    //       price_data.tax_rate, price_data.tax_amount, NOW(), false, '1.0'
    //     )
    //     ON CONFLICT (hotel_id, room_product_id, rate_plan_id, date, occupancy)
    //     DO UPDATE SET
    //       base_price = EXCLUDED.base_price,
    //       feature_adjustments = EXCLUDED.feature_adjustments,
    //       rate_plan_adjustments = EXCLUDED.rate_plan_adjustments,
    //       occupancy_surcharges = EXCLUDED.occupancy_surcharges,
    //       service_charges = EXCLUDED.service_charges,
    //       net_price = EXCLUDED.net_price,
    //       gross_price = EXCLUDED.gross_price,
    //       tax_rate = EXCLUDED.tax_rate,
    //       tax_amount = EXCLUDED.tax_amount,
    //       last_calculated_at = NOW(),
    //       is_stale = false,
    //       updated_at = NOW();

    //     -- Release the advisory lock
    //     PERFORM pg_advisory_unlock(
    //       hashtext(p_hotel_id || p_room_product_id::text || p_rate_plan_id::text || p_date || p_occupancy::text)
    //     );
    //   END;
    //   $$ LANGUAGE plpgsql;
    // `);
  }
}
