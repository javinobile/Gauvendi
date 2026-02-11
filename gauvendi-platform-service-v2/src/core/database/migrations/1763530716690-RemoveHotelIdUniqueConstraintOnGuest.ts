import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveHotelIdUniqueConstraintOnGuest1763530716690 implements MigrationInterface {
  name = 'RemoveHotelIdUniqueConstraintOnGuest1763530716690';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guest" DROP CONSTRAINT "REL_ccee49c448c6efb0e0d65041d6"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "guest" ADD CONSTRAINT "FK_ccee49c448c6efb0e0d65041d6c" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
