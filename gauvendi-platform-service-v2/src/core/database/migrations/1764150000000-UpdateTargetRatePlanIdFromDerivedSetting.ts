import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTargetRatePlanIdFromDerivedSetting1764150000000 implements MigrationInterface {
  name = 'UpdateTargetRatePlanIdFromDerivedSetting1764150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update target_rate_plan_id from derived_rate_plan_id for all rate plans that have derived settings
    await queryRunner.query(`
      UPDATE room_product_pricing_method_detail rpmd
      SET target_rate_plan_id = rpds.derived_rate_plan_id
      FROM rate_plan_derived_setting rpds
      WHERE rpmd.rate_plan_id = rpds.rate_plan_id
        AND rpmd.hotel_id = rpds.hotel_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
