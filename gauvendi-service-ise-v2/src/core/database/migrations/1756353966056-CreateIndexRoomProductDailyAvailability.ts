import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIndexRoomProductDailyAvailability1756353966056 implements MigrationInterface {
  name = ' CreateIndexRoomProductDailyAvailability1756353966056';
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index for queries filtering by date then hotel
    await queryRunner.query(`
          CREATE INDEX "IDX_room_product_daily_availability_date_hotel"
          ON "room_product_daily_availability" ("date", "hotel_id")
        `);

    // Covering index for availability calculations
    await queryRunner.query(`
          CREATE INDEX "IDX_room_product_daily_availability_covering"
          ON "room_product_daily_availability" ("hotel_id", "room_product_id", "date")
          INCLUDE ("sell_limit", "adjustment", "sold", "available")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_room_product_daily_availability_date_hotel"`);
    await queryRunner.query(`DROP INDEX "IDX_room_product_daily_availability_covering"`);
  }
}
