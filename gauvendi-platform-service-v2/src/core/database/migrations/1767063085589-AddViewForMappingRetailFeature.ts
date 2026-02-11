import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewForMappingRetailFeature1767063085589 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create view for hotel retail feature mapping
    await queryRunner.query(`
        CREATE OR REPLACE VIEW public.v_hotel_retail_feature_for_fact AS
        SELECT
            id AS id,
            hotel_retail_category_id,
            code,
            name,
            base_rate AS base_rate,                          
            base_weight::double precision AS base_weight,     
            description,
            short_description,
            display_sequence,
            is_visible,
            status,
            mapping_feature_code,
            type,
            travel_tag::text AS travel_tag,                   
            occasion::text AS occasion,                       
            false AS soft_delete,                            
            created_by,
            created_at::timestamp without time zone AS created_date,
            updated_by,
            updated_at::timestamp without time zone AS updated_date,
            is_multi_bedroom,
            is_suggested_price
        FROM public.hotel_retail_feature;
        `);

    // Create view for RFC retail feature mapping
    await queryRunner.query(`
      CREATE OR REPLACE VIEW public.v_rfc_retail_feature_for_fact AS
      SELECT
          rprf.id,
          rprf.hotel_id,
          rprf.room_product_id AS rfc_id,
          rprf.retail_feature_id,
          rprf.quantity,
          false AS soft_delete,                               
          rprf.created_by,
          rprf.created_at::timestamp without time zone AS created_date,
          rprf.updated_by,
          rprf.updated_at::timestamp without time zone AS updated_date
      FROM public.room_product_retail_feature rprf;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop views in reverse order
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_rfc_retail_feature_for_fact;`);
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_hotel_retail_feature_for_fact;`);
  }
}
