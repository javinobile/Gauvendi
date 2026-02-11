import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1756269033599 implements MigrationInterface {
    name = 'Init1756269033599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "room_product_restriction_automate_setting" DROP CONSTRAINT "FK_room_product_restriction_automate_setting_room_product"`);
        await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" DROP CONSTRAINT "FK_26f9d5d966699c3fa12a1f4582f"`);
        await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" DROP CONSTRAINT "FK_9ab563534e241ec566e7e195143"`);
        await queryRunner.query(`ALTER TABLE "hotel_standard_feature_translation" DROP CONSTRAINT "FK_6703968c6d895021ad54ecceb81"`);
        await queryRunner.query(`ALTER TABLE "room_product_standard_feature" DROP CONSTRAINT "FK_4dae5b9cc65c92627a4494f3c72"`);
        await queryRunner.query(`ALTER TABLE "room_product_standard_feature" DROP CONSTRAINT "FK_4b8466555827e0e5910c8b04265"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b1bd55bbf8e22989e46f44fd90"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_055e6ac7c922988f7650bd2c02"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f8bd58ca00c725cdddfdd1a52"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6040d6cdcf8b883fde815a3883"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_33b8cc9a56eec3fb126c54a076"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c93321f29eb354bf2b8264e1fb"`);
        await queryRunner.query(`ALTER TABLE "restriction" DROP CONSTRAINT "check_min_max_length"`);
        await queryRunner.query(`ALTER TABLE "restriction" DROP CONSTRAINT "check_min_max_adv"`);
        await queryRunner.query(`ALTER TABLE "restriction" DROP CONSTRAINT "check_positive_values"`);
        await queryRunner.query(`ALTER TABLE "restriction" DROP CONSTRAINT "check_date_range"`);
        await queryRunner.query(`CREATE TABLE "rate_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hotel_id" character varying NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "hotel_cxl_policy_code" character varying NOT NULL, "payment_term_code" character varying NOT NULL, "pay_at_hotel" integer NOT NULL, "pay_on_confirmation" integer NOT NULL, "hour_prior" integer NOT NULL, "display_unit" character varying NOT NULL, "cancellation_fee_value" integer NOT NULL, "cancellation_fee_unit" character varying NOT NULL, "description" character varying NOT NULL, "rounding_mode" character varying NOT NULL, "status" character varying NOT NULL, "promo_code" character varying NOT NULL, "mapping_rate_plan_code" character varying NOT NULL, "type" character varying NOT NULL, "is_sellable" boolean NOT NULL, "mrfc_positioning_mode" boolean NOT NULL, "rfc_attribute_mode" boolean NOT NULL, "hotel_extras_code_list" character varying NOT NULL, "adjustment_value" integer NOT NULL, "adjustment_unit" character varying NOT NULL, "is_primary" boolean NOT NULL, "pricing_methodology" character varying NOT NULL, "distribution_channel" character varying NOT NULL, "selling_strategy_type" character varying NOT NULL, "market_segment_id" character varying NOT NULL, "soft_delete" boolean NOT NULL, CONSTRAINT "PK_acdb1c7dcd4a8195e835309cd94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rfc_rate_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rfc_id" character varying NOT NULL, "hotel_id" character varying NOT NULL, "derived_rate_plan_id" character varying NOT NULL, "rate_plan_id" uuid NOT NULL, "derived_value" integer NOT NULL, "derived_unit" character varying NOT NULL, "name" character varying NOT NULL, "code" character varying NOT NULL, "guarantee_type" character varying NOT NULL, "cancellation_type" character varying NOT NULL, "mapping_rate_plan_code" character varying NOT NULL, "total_base_rate" integer NOT NULL, "is_automate_pricing" boolean NOT NULL, "virtual_base_rate" integer NOT NULL, "is_sellable" boolean NOT NULL, "soft_delete" boolean NOT NULL, CONSTRAINT "PK_a5486542da0dfba079d77d90911" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hotel_service_setting" ("hotel_id" character varying NOT NULL, "service_id" character varying NOT NULL, "enterprise_id" character varying NOT NULL, "timezone" character varying NOT NULL, CONSTRAINT "PK_ef0fa66e1eae003aa0c540d15b7" PRIMARY KEY ("hotel_id"))`);
        await queryRunner.query(`ALTER TABLE "room_product_mapping_pms" DROP CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_933574ddcad8acad7b8a274c73"`);
        await queryRunner.query(`ALTER TABLE "room_product_mapping_pms" ALTER COLUMN "room_product_id" SET NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d428747c13df97866e0f8a2c5"`);
        await queryRunner.query(`ALTER TABLE "room_product_restriction_automate_setting" ADD CONSTRAINT "UQ_642ee73060b6b55b01c2e8196e3" UNIQUE ("room_product_id")`);
        await queryRunner.query(`ALTER TABLE "room_product_type_mapping" DROP CONSTRAINT "FK_fc74acb8ce5a605535dc65d15b2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29edcd6224ce0e47252d1e5bba"`);
        await queryRunner.query(`ALTER TABLE "room_product_type_mapping" ADD CONSTRAINT "UQ_fc74acb8ce5a605535dc65d15b2" UNIQUE ("room_product_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_933574ddcad8acad7b8a274c73" ON "room_product_mapping_pms" ("hotel_id", "room_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1d428747c13df97866e0f8a2c5" ON "room_product_restriction_automate_setting" ("room_product_id", "hotel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e3e7709a8e3117c5ae3c348b93" ON "hotel_retail_category_translation" ("hotel_retail_category_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d11739d837129a5583e8ea98b1" ON "room_unit_retail_feature" ("hotel_id", "retail_feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6d1b436c0ec790b5300ee5b119" ON "room_unit_retail_feature" ("hotel_id", "room_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e4c0948945d5308eed037aa920" ON "room_unit_retail_feature" ("hotel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ef6197736df38c8a8d11ef7262" ON "hotel_retail_feature_translation" ("hotel_retail_feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6703968c6d895021ad54ecceb8" ON "hotel_standard_feature_translation" ("hotel_standard_feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_23f938462cb2ccf1237c6f3f62" ON "room_product_standard_feature" ("hotel_id", "standard_feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9911eb5e8d0bda6323c1ad2fd7" ON "room_product_standard_feature" ("hotel_id", "room_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d122a786d7a15976c7172cd804" ON "room_product_standard_feature" ("hotel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_29edcd6224ce0e47252d1e5bba" ON "room_product_type_mapping" ("hotel_id", "room_product_id") `);
        await queryRunner.query(`ALTER TABLE "room_product_mapping_pms" ADD CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_product_restriction_automate_setting" ADD CONSTRAINT "FK_642ee73060b6b55b01c2e8196e3" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" ADD CONSTRAINT "FK_2206d38c3b77af96a635fd53f7c" FOREIGN KEY ("room_unit_id") REFERENCES "room_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" ADD CONSTRAINT "FK_a94d191c5e9ce191719431b04df" FOREIGN KEY ("retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hotel_standard_feature_translation" ADD CONSTRAINT "FK_6703968c6d895021ad54ecceb81" FOREIGN KEY ("hotel_standard_feature_id") REFERENCES "hotel_standard_feature"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_product_standard_feature" ADD CONSTRAINT "FK_c0161f12fa933939715f3e40941" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_product_standard_feature" ADD CONSTRAINT "FK_651e87645bb8a7908329c0b5c27" FOREIGN KEY ("standard_feature_id") REFERENCES "hotel_standard_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_product_type_mapping" ADD CONSTRAINT "FK_fc74acb8ce5a605535dc65d15b2" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rfc_rate_plan" ADD CONSTRAINT "FK_9f1b8bd4d2d3bd48a9e55df005c" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfc_rate_plan" DROP CONSTRAINT "FK_9f1b8bd4d2d3bd48a9e55df005c"`);
        await queryRunner.query(`ALTER TABLE "room_product_type_mapping" DROP CONSTRAINT "FK_fc74acb8ce5a605535dc65d15b2"`);
        await queryRunner.query(`ALTER TABLE "room_product_standard_feature" DROP CONSTRAINT "FK_651e87645bb8a7908329c0b5c27"`);
        await queryRunner.query(`ALTER TABLE "room_product_standard_feature" DROP CONSTRAINT "FK_c0161f12fa933939715f3e40941"`);
        await queryRunner.query(`ALTER TABLE "hotel_standard_feature_translation" DROP CONSTRAINT "FK_6703968c6d895021ad54ecceb81"`);
        await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" DROP CONSTRAINT "FK_a94d191c5e9ce191719431b04df"`);
        await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" DROP CONSTRAINT "FK_2206d38c3b77af96a635fd53f7c"`);
        await queryRunner.query(`ALTER TABLE "room_product_restriction_automate_setting" DROP CONSTRAINT "FK_642ee73060b6b55b01c2e8196e3"`);
        await queryRunner.query(`ALTER TABLE "room_product_mapping_pms" DROP CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29edcd6224ce0e47252d1e5bba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d122a786d7a15976c7172cd804"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9911eb5e8d0bda6323c1ad2fd7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23f938462cb2ccf1237c6f3f62"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6703968c6d895021ad54ecceb8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef6197736df38c8a8d11ef7262"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e4c0948945d5308eed037aa920"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d1b436c0ec790b5300ee5b119"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d11739d837129a5583e8ea98b1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e3e7709a8e3117c5ae3c348b93"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d428747c13df97866e0f8a2c5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_933574ddcad8acad7b8a274c73"`);
        await queryRunner.query(`ALTER TABLE "room_product_type_mapping" DROP CONSTRAINT "UQ_fc74acb8ce5a605535dc65d15b2"`);
        await queryRunner.query(`CREATE INDEX "IDX_29edcd6224ce0e47252d1e5bba" ON "room_product_type_mapping" ("hotel_id", "room_product_id") `);
        await queryRunner.query(`ALTER TABLE "room_product_type_mapping" ADD CONSTRAINT "FK_fc74acb8ce5a605535dc65d15b2" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_product_restriction_automate_setting" DROP CONSTRAINT "UQ_642ee73060b6b55b01c2e8196e3"`);
        await queryRunner.query(`CREATE INDEX "IDX_1d428747c13df97866e0f8a2c5" ON "room_product_restriction_automate_setting" ("room_product_id", "hotel_id") `);
        await queryRunner.query(`ALTER TABLE "room_product_mapping_pms" ALTER COLUMN "room_product_id" DROP NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_933574ddcad8acad7b8a274c73" ON "room_product_mapping_pms" ("room_product_id", "hotel_id") `);
        await queryRunner.query(`ALTER TABLE "room_product_mapping_pms" ADD CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP TABLE "hotel_service_setting"`);
        await queryRunner.query(`DROP TABLE "rfc_rate_plan"`);
        await queryRunner.query(`DROP TABLE "rate_plan"`);
        await queryRunner.query(`ALTER TABLE "restriction" ADD CONSTRAINT "check_date_range" CHECK ((from_date <= to_date))`);
        await queryRunner.query(`ALTER TABLE "restriction" ADD CONSTRAINT "check_positive_values" CHECK ((((min_length IS NULL) OR (min_length > 0)) AND ((max_length IS NULL) OR (max_length > 0)) AND ((min_adv IS NULL) OR (min_adv >= 0)) AND ((max_adv IS NULL) OR (max_adv >= 0)) AND ((min_los_through IS NULL) OR (min_los_through >= 0)) AND ((max_reservation_count IS NULL) OR (max_reservation_count > 0))))`);
        await queryRunner.query(`ALTER TABLE "restriction" ADD CONSTRAINT "check_min_max_adv" CHECK (((min_adv IS NULL) OR (max_adv IS NULL) OR (min_adv <= max_adv)))`);
        await queryRunner.query(`ALTER TABLE "restriction" ADD CONSTRAINT "check_min_max_length" CHECK (((min_length IS NULL) OR (max_length IS NULL) OR (min_length <= max_length)))`);
        await queryRunner.query(`CREATE INDEX "IDX_c93321f29eb354bf2b8264e1fb" ON "room_product_standard_feature" ("hotel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_33b8cc9a56eec3fb126c54a076" ON "room_product_standard_feature" ("hotel_id", "room_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6040d6cdcf8b883fde815a3883" ON "room_product_standard_feature" ("hotel_id", "standard_feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2f8bd58ca00c725cdddfdd1a52" ON "room_unit_retail_feature" ("hotel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_055e6ac7c922988f7650bd2c02" ON "room_unit_retail_feature" ("hotel_id", "room_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b1bd55bbf8e22989e46f44fd90" ON "room_unit_retail_feature" ("hotel_id", "retail_feature_id") `);
        await queryRunner.query(`ALTER TABLE "room_product_standard_feature" ADD CONSTRAINT "FK_4b8466555827e0e5910c8b04265" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_product_standard_feature" ADD CONSTRAINT "FK_4dae5b9cc65c92627a4494f3c72" FOREIGN KEY ("standard_feature_id") REFERENCES "hotel_standard_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hotel_standard_feature_translation" ADD CONSTRAINT "FK_6703968c6d895021ad54ecceb81" FOREIGN KEY ("hotel_standard_feature_id") REFERENCES "hotel_standard_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" ADD CONSTRAINT "FK_9ab563534e241ec566e7e195143" FOREIGN KEY ("room_unit_id") REFERENCES "room_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_unit_retail_feature" ADD CONSTRAINT "FK_26f9d5d966699c3fa12a1f4582f" FOREIGN KEY ("retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_product_restriction_automate_setting" ADD CONSTRAINT "FK_room_product_restriction_automate_setting_room_product" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
