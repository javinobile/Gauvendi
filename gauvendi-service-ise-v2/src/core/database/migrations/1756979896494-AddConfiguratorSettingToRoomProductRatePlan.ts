import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfiguratorSettingToRoomProductRatePlan1756979896494 implements MigrationInterface {
  name = ' AddConfiguratorSettingToRoomProductRatePlan1756979896494';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_product_rate_plan" ADD "configurator_setting" jsonb NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_product_rate_plan" DROP COLUMN "configurator_setting"`);
  }
}
