import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHotelIdAndMappingPmsCodeToCompany1765536352969 implements MigrationInterface {
  name = ' AddHotelIdAndMappingPmsCodeToCompany1765536352969';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company" ADD "hotel_id" uuid`);
    await queryRunner.query(`ALTER TABLE "company" ADD "mapping_pms_code" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "mapping_pms_code"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "hotel_id"`);
  }
}
