import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableTranslationName1756281232445 implements MigrationInterface {
    name = 'NullableTranslationName1756281232445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hotel_retail_feature_translation" ALTER COLUMN "name" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hotel_retail_feature_translation" ALTER COLUMN "name" SET NOT NULL`);
    }

}
