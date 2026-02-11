import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableRoomProductRestriction1755076624046 implements MigrationInterface {
  name = 'CreateTableRoomProductRestriction1755076624046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "room_product_restriction_automate_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "hotel_id" character varying(36) NOT NULL, "is_automated" boolean DEFAULT false, "override_default" boolean DEFAULT false, "override_default_set_maximum" boolean DEFAULT false, CONSTRAINT "PK_b658f1d9914d44254110d9af032" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1d428747c13df97866e0f8a2c5" ON "room_product_restriction_automate_setting" ("room_product_id", "hotel_id") `,
    );

    await queryRunner.query(
      `ALTER TABLE "room_product_restriction_automate_setting" ADD CONSTRAINT "FK_room_product_restriction_automate_setting_room_product" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_1d428747c13df97866e0f8a2c5"`);
    await queryRunner.query(`DROP TABLE "room_product_restriction_automate_setting"`);

    await queryRunner.query(
      `ALTER TABLE "room_product_restriction_automate_setting" DROP CONSTRAINT "FK_room_product_restriction_automate_setting_room_product"`,
    );
  }
}
