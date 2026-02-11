import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductBasePriceEnums1756357328643 implements MigrationInterface {
    name = 'AddProductBasePriceEnums1756357328643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_room_product_daily_availability_date_hotel"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_room_product_daily_availability_covering"`);
        await queryRunner.query(`CREATE INDEX "IDX_4a2481c471efa56df04e16662d" ON "room_product_daily_availability" ("hotel_id", "date") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_4a2481c471efa56df04e16662d"`);
        await queryRunner.query(`CREATE INDEX "IDX_room_product_daily_availability_covering" ON "room_product_daily_availability" ("room_product_id", "hotel_id", "date", "available", "sold", "sell_limit", "adjustment") `);
        await queryRunner.query(`CREATE INDEX "IDX_room_product_daily_availability_date_hotel" ON "room_product_daily_availability" ("hotel_id", "date") `);
    }

}
