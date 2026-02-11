import { MigrationInterface, QueryRunner } from "typeorm";

export class  AddFeatureDailyRate1764564838690 implements MigrationInterface {
    name = 'AddFeatureDailyRate1764564838690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "feature_daily_adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "feature_id" uuid NOT NULL, "date" text NOT NULL, "adjustment_value" numeric(26,4) NOT NULL, "adjustment_type" text NOT NULL DEFAULT 'Fixed', CONSTRAINT "PK_03c29444b120a0368bbc5ba6277" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_95907a09bd4bebf52eb273a73f" ON "feature_daily_adjustment" ("feature_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b6c33c2fda212ce199e5aac946" ON "feature_daily_adjustment" ("hotel_id", "feature_id", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_1641154365156c114743cc7efe" ON "feature_daily_adjustment" ("date") `);
        await queryRunner.query(`ALTER TABLE "feature_daily_adjustment" ADD CONSTRAINT "FK_95907a09bd4bebf52eb273a73f2" FOREIGN KEY ("feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "feature_daily_adjustment" DROP CONSTRAINT "FK_95907a09bd4bebf52eb273a73f2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1641154365156c114743cc7efe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b6c33c2fda212ce199e5aac946"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_95907a09bd4bebf52eb273a73f"`);
        await queryRunner.query(`DROP TABLE "feature_daily_adjustment"`);
       
    }

}
