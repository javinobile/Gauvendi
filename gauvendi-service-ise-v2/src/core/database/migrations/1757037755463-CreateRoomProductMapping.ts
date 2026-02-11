import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomProductMapping1757037755463 implements MigrationInterface {
  name = ' CreateRoomProductMapping1757037755463';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "room_product_mapping" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_id" uuid NOT NULL, "related_room_product_id" uuid NOT NULL, CONSTRAINT "PK_c5c3f941e75abbbd26ffd6baabf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_544b2a40ef151b2b0133b872e9" ON "room_product_mapping" ("related_room_product_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_d77ec7ca3ab31b89103a1e6ad0" ON "room_product_mapping" ("room_product_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_4b877db53c31c3182c0951993f" ON "room_product_mapping" ("hotel_id", "related_room_product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de846e5721e188c809392284bb" ON "room_product_mapping" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping" ADD CONSTRAINT "FK_d77ec7ca3ab31b89103a1e6ad06" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping" ADD CONSTRAINT "FK_544b2a40ef151b2b0133b872e93" FOREIGN KEY ("related_room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // await queryRunner.query(`ALTER TABLE "rate_plan_derived_setting" DROP CONSTRAINT "REL_2e6419a2ca9d71bfc81284bfc7"`);
    // await queryRunner.query(`ALTER TABLE "rate_plan_derived_setting" DROP CONSTRAINT "REL_89c9ed76312fed9fad9f5f0df9"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_product_mapping" DROP CONSTRAINT "FK_544b2a40ef151b2b0133b872e93"`);
    await queryRunner.query(`ALTER TABLE "room_product_mapping" DROP CONSTRAINT "FK_d77ec7ca3ab31b89103a1e6ad06"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de846e5721e188c809392284bb"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_4b877db53c31c3182c0951993f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d77ec7ca3ab31b89103a1e6ad0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_544b2a40ef151b2b0133b872e9"`);
    await queryRunner.query(`DROP TABLE "room_product_mapping"`);

    // await queryRunner.query(
    //   `ALTER TABLE "rate_plan_derived_setting" ADD CONSTRAINT "REL_2e6419a2ca9d71bfc81284bfc7" UNIQUE ("derived_rate_plan_id")`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "rate_plan_derived_setting" ADD CONSTRAINT "REL_89c9ed76312fed9fad9f5f0df9" UNIQUE ("rate_plan_id")`,
    // );
  }
}
