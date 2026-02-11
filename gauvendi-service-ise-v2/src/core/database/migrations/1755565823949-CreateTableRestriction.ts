import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableRestriction1755565823949 implements MigrationInterface {
  name = 'CreateTableRestriction1755565823949';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "restriction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "type" text NOT NULL, "from_date" TIMESTAMP WITH TIME ZONE, "to_date" TIMESTAMP WITH TIME ZONE, "weekdays" jsonb, "room_product_ids" uuid array, "rate_plan_ids" text array, "min_length" integer, "max_length" integer, "min_adv" integer, "max_adv" integer, "min_los_through" integer, "max_reservation_count" integer, CONSTRAINT "PK_3d1ba426bdc66915417ad4ee65e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0baf16153be9a576ce24198949" ON "restriction" ("hotel_id", "type", "from_date", "to_date", "room_product_ids", "rate_plan_ids") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b568a48cf0c03707ed7559791" ON "restriction" ("hotel_id", "type", "from_date", "to_date", "rate_plan_ids") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48794cc99f154a352f716dc8ea" ON "restriction" ("hotel_id", "type", "from_date", "to_date", "room_product_ids") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4496fc35c4b12dc79c5d98b08f" ON "restriction" ("hotel_id", "type", "from_date", "to_date", "weekdays") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6cdb93dd7c4fb79b10f7827e66" ON "restriction" ("hotel_id", "type", "from_date", "to_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a18a60e2eb043357043ac7ebfc" ON "restriction" ("hotel_id", "from_date", "to_date") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_bca1eb33761d931204909083d6" ON "restriction" ("hotel_id", "type") `);
    await queryRunner.query(`CREATE INDEX "IDX_6d2904c89354d613f61719d9ff" ON "restriction" ("hotel_id") `);


    await queryRunner.query(
      `ALTER TABLE "restriction" ADD CONSTRAINT "check_min_max_length" CHECK (min_length IS NULL OR max_length IS NULL OR min_length <= max_length)`,
    );
    await queryRunner.query(
      `ALTER TABLE "restriction" ADD CONSTRAINT "check_min_max_adv" CHECK (min_adv IS NULL OR max_adv IS NULL OR min_adv <= max_adv)`,
    );
    await queryRunner.query(
      `ALTER TABLE "restriction" ADD CONSTRAINT "check_positive_values" CHECK (
        (min_length IS NULL OR min_length > 0) AND
        (max_length IS NULL OR max_length > 0) AND
        (min_adv IS NULL OR min_adv >= 0) AND
        (max_adv IS NULL OR max_adv >= 0) AND
        (min_los_through IS NULL OR min_los_through >= 0) AND
        (max_reservation_count IS NULL OR max_reservation_count > 0)
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "restriction" ADD CONSTRAINT "check_date_range" CHECK (from_date <= to_date)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restriction" DROP CONSTRAINT "FK_restriction_room_product"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1d428747c13df97866e0f8a2c5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_933574ddcad8acad7b8a274c73"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6d2904c89354d613f61719d9ff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bca1eb33761d931204909083d6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a18a60e2eb043357043ac7ebfc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6cdb93dd7c4fb79b10f7827e66"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4496fc35c4b12dc79c5d98b08f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_48794cc99f154a352f716dc8ea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6b568a48cf0c03707ed7559791"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0baf16153be9a576ce24198949"`);
    await queryRunner.query(`DROP TABLE "restriction"`);
  }
}
