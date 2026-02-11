import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoldUnassignedToRoomProductDailyAvailability1764061087573
  implements MigrationInterface
{
  name = 'AddSoldUnassignedToRoomProductDailyAvailability1764061087573';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" ADD "sold_unassigned" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" DROP COLUMN "sold_unassigned"`
    );
  }
}
