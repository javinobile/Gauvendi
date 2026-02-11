import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockDailyTable1764035359569 implements MigrationInterface {
  name = ' AddBlockDailyTable1764035359569';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "group_booking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid NOT NULL, "mapping_pms_code" character varying, "name" character varying, "description" character varying, CONSTRAINT "PK_9e1559e3062fb3e49c0794af38e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_89d628f16969992b0f968b63cf" ON "group_booking" ("mapping_pms_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f2e97214fcd440b8298521b53" ON "group_booking" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."block_daily_status_enum" AS ENUM('Tentative', 'Definite', 'Canceled')`
    );
    await queryRunner.query(
      `CREATE TABLE "block_daily" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid NOT NULL, "block_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "definitely_block" integer, "tentatively_block" integer, "picked_units" integer, "date" text NOT NULL, "status" "public"."block_daily_status_enum" NOT NULL, "mapping_pms_code" character varying, "group_booking_id" uuid NOT NULL, CONSTRAINT "PK_b25f9f610ccba3ee09ea39154e3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59da5a255f4db53abaf3a5a59b" ON "block_daily" ("block_id", "hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5cc7a4275bf3e985df72ae7031" ON "block_daily" ("mapping_pms_code", "hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c42444f62975fa38c1778db92e" ON "block_daily" ("group_booking_id", "hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32758c1cbf8cba18c2788ec1ec" ON "block_daily" ("room_product_id", "date", "hotel_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" DROP COLUMN "partially_block"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" DROP COLUMN "definitely_block"`
    );
    await queryRunner.query(
      `ALTER TABLE "block_daily" ADD CONSTRAINT "FK_bdde600642ee9cf03c1fafbb440" FOREIGN KEY ("group_booking_id") REFERENCES "group_booking"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "block_daily" DROP CONSTRAINT "FK_bdde600642ee9cf03c1fafbb440"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" ADD "definitely_block" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" ADD "partially_block" integer`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_32758c1cbf8cba18c2788ec1ec"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c42444f62975fa38c1778db92e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5cc7a4275bf3e985df72ae7031"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_59da5a255f4db53abaf3a5a59b"`);
    await queryRunner.query(`DROP TABLE "block_daily"`);
    await queryRunner.query(`DROP TYPE "public"."block_daily_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1f2e97214fcd440b8298521b53"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_89d628f16969992b0f968b63cf"`);
    await queryRunner.query(`DROP TABLE "group_booking"`);
  }
}
