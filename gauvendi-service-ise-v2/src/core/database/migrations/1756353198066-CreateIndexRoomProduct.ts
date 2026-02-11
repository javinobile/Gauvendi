import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIndexRoomProduct1756353198066 implements MigrationInterface {
  name = ' CreateIndexRoomProduct1756353198066';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_90db9b15a693fbfebab1629e6e" ON "room_product" ("hotel_id", "type", "status", "maximum_adult", "maximum_kid", "maximum_pet") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_90db9b15a693fbfebab1629e6e"`);
  }
}
