import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveHotelIdFromRatePlanExtraService1757039788070 implements MigrationInterface {
  name = 'RemoveHotelIdFromRatePlanExtraService1757039788070';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8dc2a2750b6e201dd0c1bfd7f2"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_31439f41f37214c84164d32263"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ea5b2b782bbef2751db9905bd8"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_18a8b3f926e1fd80af18a9462f"`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "rate_plan_extra_service" DROP COLUMN "hotel_id"`);
    await queryRunner.query(`ALTER TABLE "room_product_assigned_unit" DROP COLUMN "hotel_id"`);

    // Drop other indexes (safe with IF EXISTS)
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_01beeadedebb419d7ecc49903c"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_2a90bbc9221736f02c59e3a78b"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_3b852e505cc20032696c4fd635"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_4b877db53c31c3182c0951993f"`);

    // Create new indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_75587f956c9f128f13ef841cff" ON "rate_plan_extra_service" ("extras_id", "rate_plan_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f1c28c97fc30dd76aff2e764e" ON "rate_plan_extra_service" ("rate_plan_id", "type")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_097319570a5335d02a206bb989" ON "room_product_assigned_unit" ("room_product_id", "room_unit_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_097319570a5335d02a206bb989"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8f1c28c97fc30dd76aff2e764e"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_75587f956c9f128f13ef841cff"`);

    // Re-add dropped columns
    await queryRunner.query(`ALTER TABLE "room_product_assigned_unit" ADD "hotel_id" character varying(36)`);
    await queryRunner.query(`ALTER TABLE "rate_plan_extra_service" ADD "hotel_id" character varying(36)`);

    // Recreate old indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_18a8b3f926e1fd80af18a9462f" ON "room_product_assigned_unit" ("room_product_id", "hotel_id", "room_unit_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea5b2b782bbef2751db9905bd8" ON "rate_plan_extra_service" ("rate_plan_id", "hotel_id", "type")`
    );
    await queryRunner.query(`CREATE INDEX "IDX_31439f41f37214c84164d32263" ON "rate_plan_extra_service" ("hotel_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8dc2a2750b6e201dd0c1bfd7f2" ON "rate_plan_extra_service" ("rate_plan_id", "hotel_id")`
    );
  }
}
