import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropIndexRestriction1770699040192 implements MigrationInterface {
  name = 'DropIndexRestriction1770699040192';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6d2904c89354d613f61719d9ff"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_bca1eb33761d931204909083d6"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_4496fc35c4b12dc79c5d98b08f"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_48794cc99f154a352f716dc8ea"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6b568a48cf0c03707ed7559791"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_0baf16153be9a576ce24198949"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8dc428efa848980f3da30d1ea9"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f0ed616b4c0e9fdaa5877657e8"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6d2904c89354d613f61719d9ff" ON "restriction" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bca1eb33761d931204909083d6" ON "restriction" ("hotel_id", "type") `
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_4496fc35c4b12dc79c5d98b08f" ON "restriction" ("from_date", "hotel_id", "to_date", "type", "weekdays") `
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_48794cc99f154a352f716dc8ea" ON "restriction" ("from_date", "hotel_id", "room_product_ids", "to_date", "type") `
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6b568a48cf0c03707ed7559791" ON "restriction" ("from_date", "hotel_id", "rate_plan_ids", "to_date", "type") `
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0baf16153be9a576ce24198949" ON "restriction" ("from_date", "hotel_id", "rate_plan_ids", "room_product_ids", "to_date", "type") `
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8dc428efa848980f3da30d1ea9" ON "room_product_daily_selling_price" ("date", "hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f0ed616b4c0e9fdaa5877657e8" ON "room_product_daily_selling_price" ("hotel_id", "rate_plan_id") `
    );
  }
}
