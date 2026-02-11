import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleHotelTable1765529567591 implements MigrationInterface {
  name = 'AddGoogleHotelTable1765529567591';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "google_hotel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid, "hotel_code" character varying(255), "total_date_count" integer, "need_rounding" boolean, "status" character varying(255), CONSTRAINT "PK_d8992ccd2e446ce1fb356331004" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d7af95a702add67b1bb558264e" ON "google_hotel" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfd722b2ff7f11c16f8189a759" ON "google_hotel" ("hotel_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2554b309e6106c3d847493d73f" ON "google_hotel" ("hotel_id") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_2554b309e6106c3d847493d73f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cfd722b2ff7f11c16f8189a759"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d7af95a702add67b1bb558264e"`);
    await queryRunner.query(`DROP TABLE "google_hotel"`);
  }
}
