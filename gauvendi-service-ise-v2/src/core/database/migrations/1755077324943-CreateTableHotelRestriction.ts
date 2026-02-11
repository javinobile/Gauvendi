import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableHotelRestriction1755077324943 implements MigrationInterface {
    name = 'CreateTableHotelRestriction1755077324943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hotel_restriction_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "restriction_entity" text NOT NULL, "restriction_code" text NOT NULL, "mode" text NOT NULL DEFAULT 'NEUTRAL', CONSTRAINT "PK_4bc209f7b4208ce11e8c271845b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a79399683a0589dba3f78e4c95" ON "hotel_restriction_setting" ("hotel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_34fda2f73b0e7550232b2c688f" ON "hotel_restriction_setting" ("hotel_id", "restriction_entity", "restriction_code") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_34fda2f73b0e7550232b2c688f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a79399683a0589dba3f78e4c95"`);
        await queryRunner.query(`DROP TABLE "hotel_restriction_setting"`);
    }

}
