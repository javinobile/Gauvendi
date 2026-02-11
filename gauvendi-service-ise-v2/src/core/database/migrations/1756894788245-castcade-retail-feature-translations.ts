import { MigrationInterface, QueryRunner } from "typeorm";

export class CastcadeRetailFeatureTranslations1756894788245 implements MigrationInterface {
    name = 'CastcadeRetailFeatureTranslations1756894788245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hotel_retail_feature_translation" DROP CONSTRAINT "FK_ef6197736df38c8a8d11ef72623"`);
        await queryRunner.query(`ALTER TABLE "hotel_retail_feature_translation" ADD CONSTRAINT "FK_ef6197736df38c8a8d11ef72623" FOREIGN KEY ("hotel_retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hotel_retail_feature_translation" DROP CONSTRAINT "FK_ef6197736df38c8a8d11ef72623"`);
        await queryRunner.query(`ALTER TABLE "hotel_retail_feature_translation" ADD CONSTRAINT "FK_ef6197736df38c8a8d11ef72623" FOREIGN KEY ("hotel_retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
