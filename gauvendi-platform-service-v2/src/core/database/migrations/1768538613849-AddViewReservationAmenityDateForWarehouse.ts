import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewReservationAmenityDateForWarehouse1768538613849 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE OR REPLACE VIEW public.v_reservation_amenity_date_for_fact AS
            SELECT
                id                              AS id,                              
                reservation_amenity_id          AS reservation_amenity_id,          
                count                           AS count,
                date_of_amenity                 AS date_of_amenity,
                total_base_amount               AS total_base_amount,
                total_gross_amount              AS total_gross_amount,
                tax_amount                      AS tax_amount,
                service_charge_amount           AS service_charge_amount,
                (deleted_at IS NOT NULL)        AS soft_delete,
                
                created_by                      AS created_by,                       
                updated_by                      AS updated_by,
                
                created_at::timestamp           AS created_date,                    
                updated_at::timestamp           AS updated_date,                    
                
                date                            AS date

            FROM public.reservation_amenity_date
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS public.v_reservation_amenity_date_for_fact`);
  }
}
