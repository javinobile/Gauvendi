import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventCategoryImageUrl1763718458965 implements MigrationInterface {
  name = 'EventCategoryImageUrl1763718458965';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event_category" ADD "image_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event_category" DROP COLUMN "image_url"`);
  }
}
