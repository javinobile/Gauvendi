import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAllMissingIndexes1756279910530 implements MigrationInterface {
    name = 'AddAllMissingIndexes1756279910530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_358e5fbbd1b98a4af83acf4620" ON "room_unit_availability" ("room_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_36c62333a804768f70a35604bd" ON "room_product_daily_availability" ("room_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9a81cc6b44958cacf8aac93df" ON "room_product_extra" ("room_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0ab2847d1f1262d30871ead02b" ON "room_product_mapping_pms" ("room_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a94d191c5e9ce191719431b04d" ON "room_unit_retail_feature" ("retail_feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2206d38c3b77af96a635fd53f7" ON "room_unit_retail_feature" ("room_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_651e87645bb8a7908329c0b5c2" ON "room_product_standard_feature" ("standard_feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c0161f12fa933939715f3e4094" ON "room_product_standard_feature" ("room_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fc74acb8ce5a605535dc65d15b" ON "room_product_type_mapping" ("room_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_038af49e8c2dea0d2b9f05a09a" ON "room_product_assigned_unit" ("room_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_119bdfdc44326900a07fdd9ddb" ON "room_product_assigned_unit" ("room_product_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_119bdfdc44326900a07fdd9ddb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_038af49e8c2dea0d2b9f05a09a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc74acb8ce5a605535dc65d15b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0161f12fa933939715f3e4094"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_651e87645bb8a7908329c0b5c2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2206d38c3b77af96a635fd53f7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a94d191c5e9ce191719431b04d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ab2847d1f1262d30871ead02b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9a81cc6b44958cacf8aac93df"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36c62333a804768f70a35604bd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_358e5fbbd1b98a4af83acf4620"`);
    }

}
