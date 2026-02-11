import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableHotelFeature1755841524569 implements MigrationInterface {
  name = 'CreateTableHotelFeature1755841524569';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hotel_retail_category_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_retail_category_id" uuid NOT NULL, "language_code" text NOT NULL, "name" text NOT NULL, CONSTRAINT "PK_f192c4707f28d75281fdb8be9c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_retail_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "image_url" text, "code" text NOT NULL, "name" text NOT NULL, "category_type" text, "display_sequence" integer, "price_weight" integer, CONSTRAINT "PK_e9f1fea190c9e9398b95820bde6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc24100cb97a00daa984f51e2d" ON "hotel_retail_category" ("hotel_id", "category_type") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_b47c106cd5df3a464302ba02f6" ON "hotel_retail_category" ("hotel_id", "code") `);
    await queryRunner.query(`CREATE INDEX "IDX_1440d928138855e190d98caa24" ON "hotel_retail_category" ("hotel_id") `);
    await queryRunner.query(
      `CREATE TABLE "room_unit_retail_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_unit_id" uuid NOT NULL, "retail_feature_id" uuid NOT NULL, "quantity" integer, CONSTRAINT "PK_d65ddf723f7db37875af0599092" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b1bd55bbf8e22989e46f44fd90" ON "room_unit_retail_feature" ("hotel_id", "retail_feature_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_055e6ac7c922988f7650bd2c02" ON "room_unit_retail_feature" ("hotel_id", "room_unit_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_2f8bd58ca00c725cdddfdd1a52" ON "room_unit_retail_feature" ("hotel_id") `);
    await queryRunner.query(
      `CREATE TABLE "hotel_retail_feature_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_retail_feature_id" uuid NOT NULL, "language_code" text NOT NULL, "name" text NOT NULL, "description" text, "measurement_unit" text, CONSTRAINT "PK_d0f7bbaab1e7e9bee4ee10bcb07" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_retail_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "base_rate" numeric(10,2), "base_weight" double precision, "children_suitability" boolean, "adults_suitability" text, "description" text, "short_description" text, "display_sequence" integer, "mapping_feature_code" character varying, "is_visible" boolean DEFAULT true, "status" text DEFAULT 'ACTIVE', "type" text, "travel_tag" text array, "occasion" text array, "is_multi_bedroom" boolean, "is_suggested_price" boolean, "measurement_unit" character varying, "image_url" text, "hotel_retail_category_id" uuid NOT NULL, CONSTRAINT "PK_e9cb67fa81a960851e0ced6bccf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aee1dc6d4e9ecd6a01a56ff04b" ON "hotel_retail_feature" ("hotel_retail_category_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_retail_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_id" uuid NOT NULL, "quantity" integer, "retail_feature_id" uuid NOT NULL, CONSTRAINT "PK_df1a7a5aa5fff448338754e844b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04b0a8214b0830250c0d75ea2f" ON "room_product_retail_feature" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e1541e2275c04abe58d812c69" ON "room_product_retail_feature" ("hotel_id", "retail_feature_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_4a7db9bcf10c0d957cf6250d5f" ON "room_product_retail_feature" ("hotel_id") `);
    await queryRunner.query(
      `CREATE TABLE "room_unit_standard_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_unit_id" uuid NOT NULL, "standard_feature_id" uuid NOT NULL, CONSTRAINT "PK_3e77fb2a8eb0c7161f2ed99313e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86eb05c812fb96070909c03da2" ON "room_unit_standard_feature" ("hotel_id", "standard_feature_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_518e791e5ee73a1f2046ede9ed" ON "room_unit_standard_feature" ("hotel_id", "room_unit_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_dc9dcb5cdaac84f9494663cb0b" ON "room_unit_standard_feature" ("hotel_id") `);
    await queryRunner.query(
      `CREATE TABLE "hotel_standard_feature_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_standard_feature_id" uuid NOT NULL, "language_code" text NOT NULL, "name" text, "description" text, CONSTRAINT "PK_fd2f008aa1f5a7531f8622b72d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_standard_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "code" text NOT NULL, "name" text NOT NULL, "description" text, "short_description" text, "mapping_feature_code" text, "display_sequence" integer, "image_url" text, CONSTRAINT "PK_d1a764409d6f5404f3a2b6579b8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_d1f5446aef17e07ce56928e15c" ON "hotel_standard_feature" ("hotel_id", "code") `);
    await queryRunner.query(`CREATE INDEX "IDX_e7a69906d16a42dbaee392dcc5" ON "hotel_standard_feature" ("hotel_id") `);
    await queryRunner.query(
      `CREATE TABLE "room_product_standard_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_id" uuid NOT NULL, "standard_feature_id" uuid NOT NULL, CONSTRAINT "PK_d5728b7663c3b5a5e738178a64a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6040d6cdcf8b883fde815a3883" ON "room_product_standard_feature" ("hotel_id", "standard_feature_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_33b8cc9a56eec3fb126c54a076" ON "room_product_standard_feature" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_c93321f29eb354bf2b8264e1fb" ON "room_product_standard_feature" ("hotel_id") `);
    await queryRunner.query(
      `CREATE TABLE "room_product_type_mapping" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_id" uuid NOT NULL, "related_code" text NOT NULL, "channel" text NOT NULL, CONSTRAINT "PK_dbec76df0b51b321bf6d5b5f73a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29edcd6224ce0e47252d1e5bba" ON "room_product_type_mapping" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_8b5c6419d365765e27ef4edce9" ON "room_product_type_mapping" ("hotel_id") `);
    await queryRunner.query(
      `ALTER TABLE "hotel_retail_category_translation" ADD CONSTRAINT "FK_e3e7709a8e3117c5ae3c348b93d" FOREIGN KEY ("hotel_retail_category_id") REFERENCES "hotel_retail_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_unit_retail_feature" ADD CONSTRAINT "FK_9ab563534e241ec566e7e195143" FOREIGN KEY ("room_unit_id") REFERENCES "room_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_unit_retail_feature" ADD CONSTRAINT "FK_26f9d5d966699c3fa12a1f4582f" FOREIGN KEY ("retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_retail_feature_translation" ADD CONSTRAINT "FK_ef6197736df38c8a8d11ef72623" FOREIGN KEY ("hotel_retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_retail_feature" ADD CONSTRAINT "FK_aee1dc6d4e9ecd6a01a56ff04b0" FOREIGN KEY ("hotel_retail_category_id") REFERENCES "hotel_retail_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_retail_feature" ADD CONSTRAINT "FK_73ef18e60dce206c5323de417b6" FOREIGN KEY ("retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_retail_feature" ADD CONSTRAINT "FK_a2f7d1c21ccc69ce676cf1e2a22" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_unit_standard_feature" ADD CONSTRAINT "FK_b53ac13bc28ef6385a83317ee9d" FOREIGN KEY ("room_unit_id") REFERENCES "room_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_unit_standard_feature" ADD CONSTRAINT "FK_f10ffa6474c3be16a545aa04da8" FOREIGN KEY ("standard_feature_id") REFERENCES "hotel_standard_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_standard_feature_translation" ADD CONSTRAINT "FK_6703968c6d895021ad54ecceb81" FOREIGN KEY ("hotel_standard_feature_id") REFERENCES "hotel_standard_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_standard_feature" ADD CONSTRAINT "FK_4b8466555827e0e5910c8b04265" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_standard_feature" ADD CONSTRAINT "FK_4dae5b9cc65c92627a4494f3c72" FOREIGN KEY ("standard_feature_id") REFERENCES "hotel_standard_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_type_mapping" ADD CONSTRAINT "FK_fc74acb8ce5a605535dc65d15b2" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first (in reverse order of creation)
    await queryRunner.query(`ALTER TABLE "room_product_type_mapping" DROP CONSTRAINT "FK_fc74acb8ce5a605535dc65d15b2"`);
    await queryRunner.query(`ALTER TABLE "room_product_standard_feature" DROP CONSTRAINT "FK_4dae5b9cc65c92627a4494f3c72"`);
    await queryRunner.query(`ALTER TABLE "room_product_standard_feature" DROP CONSTRAINT "FK_4b8466555827e0e5910c8b04265"`);
    await queryRunner.query(`ALTER TABLE "hotel_standard_feature_translation" DROP CONSTRAINT "FK_6703968c6d895021ad54ecceb81"`);
    await queryRunner.query(`ALTER TABLE "room_unit_standard_feature" DROP CONSTRAINT "FK_f10ffa6474c3be16a545aa04da8"`);
    await queryRunner.query(`ALTER TABLE "room_unit_standard_feature" DROP CONSTRAINT "FK_b53ac13bc28ef6385a83317ee9d"`);
    await queryRunner.query(`ALTER TABLE "room_product_retail_feature" DROP CONSTRAINT "FK_a2f7d1c21ccc69ce676cf1e2a22"`);
    await queryRunner.query(`ALTER TABLE "room_product_retail_feature" DROP CONSTRAINT "FK_73ef18e60dce206c5323de417b6"`);
    await queryRunner.query(`ALTER TABLE "hotel_retail_feature" DROP CONSTRAINT "FK_aee1dc6d4e9ecd6a01a56ff04b0"`);
    await queryRunner.query(`ALTER TABLE "hotel_retail_feature_translation" DROP CONSTRAINT "FK_ef6197736df38c8a8d11ef72623"`);
    await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" DROP CONSTRAINT "FK_26f9d5d966699c3fa12a1f4582f"`);
    await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" DROP CONSTRAINT "FK_9ab563534e241ec566e7e195143"`);
    await queryRunner.query(`ALTER TABLE "hotel_retail_category_translation" DROP CONSTRAINT "FK_e3e7709a8e3117c5ae3c348b93d"`);

    // Drop indexes (in reverse order of creation)
    await queryRunner.query(`DROP INDEX "public"."IDX_8b5c6419d365765e27ef4edce9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_29edcd6224ce0e47252d1e5bba"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c93321f29eb354bf2b8264e1fb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_33b8cc9a56eec3fb126c54a076"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6040d6cdcf8b883fde815a3883"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e7a69906d16a42dbaee392dcc5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d1f5446aef17e07ce56928e15c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dc9dcb5cdaac84f9494663cb0b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_518e791e5ee73a1f2046ede9ed"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_86eb05c812fb96070909c03da2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4a7db9bcf10c0d957cf6250d5f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4e1541e2275c04abe58d812c69"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_04b0a8214b0830250c0d75ea2f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_aee1dc6d4e9ecd6a01a56ff04b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2f8bd58ca00c725cdddfdd1a52"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_055e6ac7c922988f7650bd2c02"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b1bd55bbf8e22989e46f44fd90"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1440d928138855e190d98caa24"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b47c106cd5df3a464302ba02f6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fc24100cb97a00daa984f51e2d"`);

    // Drop tables (in reverse order of creation)
    await queryRunner.query(`DROP TABLE "room_product_type_mapping"`);
    await queryRunner.query(`DROP TABLE "room_product_standard_feature"`);
    await queryRunner.query(`DROP TABLE "hotel_standard_feature"`);
    await queryRunner.query(`DROP TABLE "hotel_standard_feature_translation"`);
    await queryRunner.query(`DROP TABLE "room_unit_standard_feature"`);
    await queryRunner.query(`DROP TABLE "room_product_retail_feature"`);
    await queryRunner.query(`DROP TABLE "hotel_retail_feature"`);
    await queryRunner.query(`DROP TABLE "hotel_retail_feature_translation"`);
    await queryRunner.query(`DROP TABLE "room_unit_retail_feature"`);
    await queryRunner.query(`DROP TABLE "hotel_retail_category"`);
    await queryRunner.query(`DROP TABLE "hotel_retail_category_translation"`);
  }
}