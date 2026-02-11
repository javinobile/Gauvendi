import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservationAmenityPricingUnit1765427640360 implements MigrationInterface {
    name = 'AddReservationAmenityPricingUnit1765427640360'

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "reservation_amenity" ADD "pricing_unit" character varying(60)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation_amenity" DROP COLUMN "pricing_unit"`);
      
    }

}
