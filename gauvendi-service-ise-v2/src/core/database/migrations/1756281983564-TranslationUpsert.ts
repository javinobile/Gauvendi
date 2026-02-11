import { MigrationInterface, QueryRunner } from "typeorm";

export class TranslationUpsert1756281983564 implements MigrationInterface {
    name = 'TranslationUpsert1756281983564'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_17ed681d41fd83ec7738a8c9fb" ON "hotel_retail_feature_translation" ("hotel_retail_feature_id", "language_code") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b6a0d8a1d50ececde31ff69b05" ON "hotel_standard_feature_translation" ("hotel_standard_feature_id", "language_code") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b6a0d8a1d50ececde31ff69b05"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17ed681d41fd83ec7738a8c9fb"`);
    }

}
