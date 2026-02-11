import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaintenanceTable1764729435757 implements MigrationInterface {
  name = 'AddMaintenanceTable1764729435757';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_unit_availability" RENAME COLUMN "maintenance_pms_code" TO "maintenance_id"`
    );
    await queryRunner.query(
      `CREATE TABLE "maintenance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_unit_id" uuid, "mapping_pms_code" character varying, CONSTRAINT "PK_542fb6a28537140d2df95faa52a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "room_unit_availability" DROP COLUMN "maintenance_id"`);
    await queryRunner.query(`ALTER TABLE "room_unit_availability" ADD "maintenance_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "room_unit_availability" ADD CONSTRAINT "FK_4a6e88bf7c7ea85ceda7c4f8055" FOREIGN KEY ("maintenance_id") REFERENCES "maintenance"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_unit_availability" DROP CONSTRAINT "FK_4a6e88bf7c7ea85ceda7c4f8055"`
    );
    await queryRunner.query(`ALTER TABLE "room_unit_availability" DROP COLUMN "maintenance_id"`);
    await queryRunner.query(`ALTER TABLE "room_unit_availability" ADD "maintenance_id" text`);
    await queryRunner.query(`DROP TABLE "maintenance"`);
    await queryRunner.query(
      `ALTER TABLE "room_unit_availability" RENAME COLUMN "maintenance_id" TO "maintenance_pms_code"`
    );
  }
}
