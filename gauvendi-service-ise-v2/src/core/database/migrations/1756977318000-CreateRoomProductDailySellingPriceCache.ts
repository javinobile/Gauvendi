import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomProductDailySellingPriceCache1756977318000 implements MigrationInterface {
  name = 'CreateRoomProductDailySellingPriceCache1756977318000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop functions
    // await queryRunner.query(`DROP FUNCTION IF EXISTS update_selling_price_cache(VARCHAR(36), UUID, UUID, TEXT, INTEGER)`);
    // await queryRunner.query(`DROP FUNCTION IF EXISTS compute_selling_price(VARCHAR(36), UUID, UUID, TEXT, INTEGER)`);
  }
}
