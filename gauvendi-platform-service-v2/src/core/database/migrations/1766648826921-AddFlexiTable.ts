import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlexiTable1766648826921 implements MigrationInterface {
  name = 'AddFlexiTable1766648826921';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "flexi_rate_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "flexi_hotel_id" uuid NOT NULL, "sales_plan_id" uuid NOT NULL, "code" character varying(255) NOT NULL, "extra_service_included" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f6156842e28878ff8715dcdcca6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_114598a3cdaf37621ecd7fb045" ON "flexi_rate_plan" ("flexi_hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "flexi_hotel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "type" character varying(255) NOT NULL DEFAULT 'SITEMINDER', CONSTRAINT "PK_dac85883763e04a131ccfaab698" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "flexi_room_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "flexi_hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "code" character varying(255) NOT NULL, CONSTRAINT "PK_d9e680ca6410fd3b8fe43980d72" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "flexi_room_type"`);
    await queryRunner.query(`DROP TABLE "flexi_hotel"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_114598a3cdaf37621ecd7fb045"`);
    await queryRunner.query(`DROP TABLE "flexi_rate_plan"`);
  }
}
