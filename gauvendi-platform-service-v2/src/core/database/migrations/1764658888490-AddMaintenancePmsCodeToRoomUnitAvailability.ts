import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaintenancePmsCodeToRoomUnitAvailability1764658888490
  implements MigrationInterface
{
  name = ' add_maintenance_pms_code_to_room_unit_availability_1764658888490';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_unit_availability" ADD "maintenance_pms_code" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_unit_availability" DROP COLUMN "maintenance_pms_code"`
    );
  }
}
