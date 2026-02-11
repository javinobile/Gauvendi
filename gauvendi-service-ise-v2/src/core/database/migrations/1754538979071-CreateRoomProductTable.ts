import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomProductTable1754538979071 implements MigrationInterface {
  name = 'CreateRoomProductTable1754538979071';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "room_unit_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_unit_id" uuid NOT NULL, "hotel_id" character varying(36), "date" text, "status" text, CONSTRAINT "PK_5b1752a07caf302d825844db38e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b9c38d6b61694f650a7083a7c" ON "room_unit_availability" ("hotel_id", "room_unit_id", "date", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6756aa034f100ba3be14559fc6" ON "room_unit_availability" ("hotel_id", "room_unit_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_daily_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "room_product_id" uuid NOT NULL, "hotel_id" character varying(36), "date" text, "available" integer, "sold" integer, "sell_limit" integer, "adjustment" integer, CONSTRAINT "PK_a5bac6c6db639b9eb8e9f993a69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_89256677b62dd7f7e15629ca08" ON "room_product_daily_availability" ("hotel_id", "room_product_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "hotel_id" character varying(36), "description" text, "image_url" text, "sequence" integer, CONSTRAINT "PK_cab23f7ddc241fcd46579b4df48" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_31006b232152c4af6470b1be8b" ON "room_product_image" ("room_product_id", "image_url") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_extra" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "extras_id" character varying(36), "hotel_id" character varying(36), "type" text, CONSTRAINT "PK_01bf84c4ffa0438cb14f47f133c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4920a88d7942a0ac15b09630ae" ON "room_product_extra" ("hotel_id", "room_product_id", "type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "name" text NOT NULL, "description" text, "hotel_id" character varying(36), "code" text NOT NULL, "rfc_allocation_setting" text, "status" text, "number_of_bedrooms" integer, "type" text, "extra_adult" integer, "extra_children" integer, "space" numeric, "feature_string" text, "capacity_default" integer, "maximum_adult" integer, "maximum_kid" integer, "maximum_pet" integer, "capacity_extra" integer, "extra_bed_adult" integer, "extra_bed_kid" integer, "travel_tag" text array, "occasion" text array, "is_sellable" boolean, "distribution_channel" text array, "base_price_mode" text, CONSTRAINT "PK_fe956f8460185e95126c49d941b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_e038dcd2cfb656f2e3c71609af" ON "room_product" ("hotel_id", "type", "status") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_51da11badc4d52edef9908b169" ON "room_product" ("hotel_id", "distribution_channel") `,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_46025be46b58eefe5244460fb7" ON "room_product" ("hotel_id", "code") `);
    await queryRunner.query(
      `CREATE TABLE "room_product_assigned_unit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "hotel_id" character varying(36), "room_unit_id" uuid NOT NULL, CONSTRAINT "PK_93969e0dde7f80a169f69b831ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18a8b3f926e1fd80af18a9462f" ON "room_product_assigned_unit" ("hotel_id", "room_product_id", "room_unit_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_unit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "room_number" text, "hotel_id" character varying(36), "mapping_pms_code" text, "capacity_default" integer, "maximum_adult" integer, "maximum_kid" integer, "capacity_extra" integer, "extra_bed_adult" integer, "extra_bed_kid" integer, "room_floor" text, "text" text, "connecting_room_id" character varying(36), "number_of_bedrooms" text, "space" numeric, "feature_string" text, "status" text, "is_changed" boolean, CONSTRAINT "PK_3ecf12c3d733b3a99b8db9b42ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_b3f9963255297d945532880ec6" ON "room_unit" ("hotel_id", "status") `);
    await queryRunner.query(`CREATE INDEX "IDX_690e396e6484e45b98797203c7" ON "room_unit" ("hotel_id", "mapping_pms_code") `);
    await queryRunner.query(`CREATE INDEX "IDX_02098761a77d8888f65405c792" ON "room_unit" ("hotel_id", "room_number") `);
    await queryRunner.query(
      `ALTER TABLE "room_unit_availability" ADD CONSTRAINT "FK_358e5fbbd1b98a4af83acf46207" FOREIGN KEY ("room_unit_id") REFERENCES "room_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" ADD CONSTRAINT "FK_36c62333a804768f70a35604bd5" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_image" ADD CONSTRAINT "FK_1a3a34489e095fb57ad642a7a76" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_extra" ADD CONSTRAINT "FK_b9a81cc6b44958cacf8aac93df2" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_assigned_unit" ADD CONSTRAINT "FK_119bdfdc44326900a07fdd9ddb9" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_assigned_unit" ADD CONSTRAINT "FK_038af49e8c2dea0d2b9f05a09a9" FOREIGN KEY ("room_unit_id") REFERENCES "room_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_product_assigned_unit" DROP CONSTRAINT "FK_038af49e8c2dea0d2b9f05a09a9"`);
    await queryRunner.query(`ALTER TABLE "room_product_assigned_unit" DROP CONSTRAINT "FK_119bdfdc44326900a07fdd9ddb9"`);
    await queryRunner.query(`ALTER TABLE "room_product_extra" DROP CONSTRAINT "FK_b9a81cc6b44958cacf8aac93df2"`);
    await queryRunner.query(`ALTER TABLE "room_product_image" DROP CONSTRAINT "FK_1a3a34489e095fb57ad642a7a76"`);
    await queryRunner.query(`ALTER TABLE "room_product_daily_availability" DROP CONSTRAINT "FK_36c62333a804768f70a35604bd5"`);
    await queryRunner.query(`ALTER TABLE "room_unit_availability" DROP CONSTRAINT "FK_358e5fbbd1b98a4af83acf46207"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_02098761a77d8888f65405c792"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_690e396e6484e45b98797203c7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b3f9963255297d945532880ec6"`);
    await queryRunner.query(`DROP TABLE "room_unit"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_18a8b3f926e1fd80af18a9462f"`);
    await queryRunner.query(`DROP TABLE "room_product_assigned_unit"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_46025be46b58eefe5244460fb7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_51da11badc4d52edef9908b169"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e038dcd2cfb656f2e3c71609af"`);
    await queryRunner.query(`DROP TABLE "room_product"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4920a88d7942a0ac15b09630ae"`);
    await queryRunner.query(`DROP TABLE "room_product_extra"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_31006b232152c4af6470b1be8b"`);
    await queryRunner.query(`DROP TABLE "room_product_image"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_89256677b62dd7f7e15629ca08"`);
    await queryRunner.query(`DROP TABLE "room_product_daily_availability"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6756aa034f100ba3be14559fc6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0b9c38d6b61694f650a7083a7c"`);
    await queryRunner.query(`DROP TABLE "room_unit_availability"`);
  }
}
