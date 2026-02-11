import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageTable1769740925320 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "image_url" character varying(255), "hotel_id" uuid, "sequence" integer, "size" bigint, "mime_type" character varying, "file_name" character varying, CONSTRAINT "PK_image_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_image_hotel_id_image_url" ON "image" ("hotel_id", "image_url") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_image_hotel_id_image_url"`);
    await queryRunner.query(`DROP TABLE "image"`);
  }
}
