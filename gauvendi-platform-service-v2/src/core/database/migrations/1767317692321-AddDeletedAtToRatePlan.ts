import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToRatePlan1767317692321 implements MigrationInterface {
  name = 'AddDeletedAtToRatePlan1767317692321';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "deleted_at"`);
  }
}
