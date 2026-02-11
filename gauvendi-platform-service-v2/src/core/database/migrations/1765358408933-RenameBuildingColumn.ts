import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameBuildingColumn1765358408933 implements MigrationInterface {
  name = 'RenameBuildingColumn1765358408933';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_unit" RENAME COLUMN "text" TO "building"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_unit" RENAME COLUMN "building" TO "text"`);
  }
}
