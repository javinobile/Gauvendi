import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefinitelyBlockAndPartiallyBlockToRoomProductDailyAvailability1763709808299
  implements MigrationInterface
{
  name = 'AddDefinitelyBlockAndPartiallyBlockToRoomProductDailyAvailability1763709808299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" ADD "definitely_block" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" ADD "partially_block" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" DROP COLUMN "partially_block"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" DROP COLUMN "definitely_block"`
    );
  }
}
