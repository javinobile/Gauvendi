import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableRoomProductMappingPms1754616871334 implements MigrationInterface {
  name = 'CreateTableRoomProductMappingPms1754616871334';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "room_product_mapping_pms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "hotel_id" character varying(36) NOT NULL, "room_product_mapping_pms_code" character varying, CONSTRAINT "PK_5c70781795f6fca67a2e60e6a13" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_933574ddcad8acad7b8a274c73" ON "room_product_mapping_pms" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping_pms" ADD CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_product_mapping_pms" DROP CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_933574ddcad8acad7b8a274c73"`);
    await queryRunner.query(`DROP TABLE "room_product_mapping_pms"`);
  }
}
