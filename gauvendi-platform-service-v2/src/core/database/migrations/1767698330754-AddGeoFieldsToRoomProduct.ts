import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeoFieldsToRoomProduct1767698330754 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE room_product
      ADD COLUMN IF NOT EXISTS latitude VARCHAR(255),
      ADD COLUMN IF NOT EXISTS longitude VARCHAR(255),
      ADD COLUMN IF NOT EXISTS address VARCHAR(1000),
      ADD COLUMN IF NOT EXISTS city VARCHAR(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE room_product
      DROP COLUMN IF EXISTS latitude,
      DROP COLUMN IF EXISTS longitude,
      DROP COLUMN IF EXISTS address,
      DROP COLUMN IF EXISTS city
    `);
  }
}
