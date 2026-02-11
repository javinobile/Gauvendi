import { MigrationInterface, QueryRunner } from 'typeorm';

export class RelatedMigration1756343891683 implements MigrationInterface {
  name = 'RelatedMigration1756343891683';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "connector" ("id" character varying NOT NULL, "organisation_id" character varying NOT NULL, "connector_type" character varying NOT NULL, "status" character varying NOT NULL, "property_id" character varying NOT NULL, "refresh_token" character varying NOT NULL, "soft_delete" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_6c5a19153f8f3074f2836a2b082" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "room_product_mapping_pms" DROP CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_933574ddcad8acad7b8a274c73"`);
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping_pms" ADD CONSTRAINT "UQ_0ab2847d1f1262d30871ead02b0" UNIQUE ("room_product_id")`,
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
    await queryRunner.query(`ALTER TABLE "room_product_mapping_pms" DROP CONSTRAINT "UQ_0ab2847d1f1262d30871ead02b0"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_933574ddcad8acad7b8a274c73" ON "room_product_mapping_pms" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping_pms" ADD CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`DROP TABLE "connector"`);
  }
}
