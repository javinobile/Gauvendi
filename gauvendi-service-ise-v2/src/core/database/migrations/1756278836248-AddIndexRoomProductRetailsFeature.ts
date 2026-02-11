import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexRoomProductRetailsFeature1756278836248 implements MigrationInterface {
    name = 'AddIndexRoomProductRetailsFeature1756278836248'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_73ef18e60dce206c5323de417b" ON "room_product_retail_feature" ("retail_feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a2f7d1c21ccc69ce676cf1e2a2" ON "room_product_retail_feature" ("room_product_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_a2f7d1c21ccc69ce676cf1e2a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_73ef18e60dce206c5323de417b"`);
    }

}
