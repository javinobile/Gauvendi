import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePricingModule1756977317000 implements MigrationInterface {
  name = ' CreatePricingModule1756977317000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "room_product_extra_occupancy_rate" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "hotel_id" character varying(36) NOT NULL, "extra_people" integer NULL, "extra_rate" numeric(26,4) NULL, CONSTRAINT "PK_7f3b2b04bafe3e7a28eefcdeac6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0775bee087b634c4709b89ab46" ON "room_product_extra_occupancy_rate" ("room_product_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_6fd851f8ffbed21b275f45e52a" ON "room_product_extra_occupancy_rate" ("hotel_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_d842b20877ea25265861924345" ON "room_product_extra_occupancy_rate" ("hotel_id", "room_product_id", "extra_people", "extra_rate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd6e36537b931dbf7b22a6d0b5" ON "room_product_extra_occupancy_rate" ("hotel_id", "extra_people") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d96b756d865b9835b2d156fd4" ON "room_product_extra_occupancy_rate" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b9d9696d383555299b75eb3a09" ON "room_product_extra_occupancy_rate" ("hotel_id", "room_product_id", "extra_people") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_cxl_policy_daily" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "cxl_policy_code" text NULL, CONSTRAINT "PK_bf480594e745d2e74ab8d384c78" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_2c2a2ee0326e10737bd4b9b55e" ON "rate_plan_cxl_policy_daily" ("hotel_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_bcc8e5d59d5b146433e41c67a7" ON "rate_plan_cxl_policy_daily" ("hotel_id", "rate_plan_id", "date", "cxl_policy_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_470ea47457db499f914b91779f" ON "rate_plan_cxl_policy_daily" ("hotel_id", "date") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_a2ca0e9b1fe9f98f9dd36acf93" ON "rate_plan_cxl_policy_daily" ("rate_plan_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9fa8fc2dbfdefbe053c7beb372" ON "rate_plan_cxl_policy_daily" ("hotel_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_daily_adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "adjustment_value" numeric(26,4), "adjustment_type" text DEFAULT 'FIXED', "day_of_week" text array DEFAULT '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}', CONSTRAINT "PK_26a0b5f6c30fd92f3ae028ee47e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_0d6495e0977334c4d1c28abbe5" ON "rate_plan_daily_adjustment" ("hotel_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_88467d040abd37e025a28f17bf" ON "rate_plan_daily_adjustment" ("hotel_id", "rate_plan_id", "date", "day_of_week") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_553612cadbc5aeb0bd8f829746" ON "rate_plan_daily_adjustment" ("hotel_id", "date") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_347d16480ac7b7713353a871b9" ON "rate_plan_daily_adjustment" ("rate_plan_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1facd0fde06685f780c2758828" ON "rate_plan_daily_adjustment" ("hotel_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_daily_extra_service" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "extra_service_code_list" text array NOT NULL, "date" text NOT NULL, "rate_plan_id" uuid NOT NULL, CONSTRAINT "PK_c59cd74e607d59db1474900c5f1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_6578699b29ba131a3b14613f20" ON "rate_plan_daily_extra_service" ("hotel_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_51368910e1c8d4f423d0725ccb" ON "rate_plan_daily_extra_service" ("hotel_id", "rate_plan_id", "date", "extra_service_code_list") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ed8a846946282f36725c4c89f" ON "rate_plan_daily_extra_service" ("hotel_id", "date") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_8bc2e51c42119f7b547efdfd13" ON "rate_plan_daily_extra_service" ("rate_plan_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_94c036b555cce04f701424b1c5" ON "rate_plan_daily_extra_service" ("hotel_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_daily_payment_term" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "payment_term_code" text NOT NULL, "date" text NOT NULL, "rate_plan_id" uuid NOT NULL, CONSTRAINT "PK_3ce8dbcadf14ffc9a587021a71b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_20fa3dc9b8235fa26f9b189709" ON "rate_plan_daily_payment_term" ("hotel_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_694d7585cb6830d8f1ede345c9" ON "rate_plan_daily_payment_term" ("hotel_id", "rate_plan_id", "date", "payment_term_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a96f143fbaa2b5194a1ea3f9e5" ON "rate_plan_daily_payment_term" ("hotel_id", "date") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_524fbdadbafbc44717cd5867fe" ON "rate_plan_daily_payment_term" ("rate_plan_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0372a023eda48d4ed7c0de81fe" ON "rate_plan_daily_payment_term" ("hotel_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_daily_sellability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "rate_plan_id" uuid NOT NULL, "distribution_channel" text NOT NULL, "is_sellable" boolean NOT NULL, "date" text NOT NULL, CONSTRAINT "PK_44171bedfdad1746e6c154a250f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_84288073e3df2bf91700513228" ON "rate_plan_daily_sellability" ("hotel_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_e1bcc4ceb5e442452187175b17" ON "rate_plan_daily_sellability" ("hotel_id", "rate_plan_id", "date", "distribution_channel") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20d3e36fbcfd21f3abb2b8a033" ON "rate_plan_daily_sellability" ("hotel_id", "date") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_cd7b0cb71db9c3391518e2d2a1" ON "rate_plan_daily_sellability" ("rate_plan_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a6e55d2f017b91225ab56cf915" ON "rate_plan_daily_sellability" ("hotel_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_derived_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "rate_plan_id" uuid NOT NULL, "derived_rate_plan_id" uuid NOT NULL, "follow_daily_payment_term" boolean NOT NULL DEFAULT false, "follow_daily_cxl_policy" boolean NOT NULL DEFAULT false, "follow_daily_included_amenity" boolean NOT NULL DEFAULT false, "follow_daily_room_product_availability" boolean NOT NULL DEFAULT false, "follow_daily_restriction" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_932029839f4fccb92d3ee2a6d4b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3b852e505cc20032696c4fd635" ON "rate_plan_derived_setting" ("hotel_id", "derived_rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_01beeadedebb419d7ecc49903c" ON "rate_plan_derived_setting" ("hotel_id", "rate_plan_id", "derived_rate_plan_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_76cf0e6c1d2a7bce3a4e980430" ON "rate_plan_derived_setting" ("hotel_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_89c9ed76312fed9fad9f5f0df9" ON "rate_plan_derived_setting" ("rate_plan_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_2a90bbc9221736f02c59e3a78b" ON "rate_plan_derived_setting" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_extra_service" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "rate_plan_id" uuid NOT NULL, "extras_id" character varying(36), "hotel_id" character varying(36), "type" text, CONSTRAINT "PK_f7fcfe1ec65447e459d49265c09" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8dc2a2750b6e201dd0c1bfd7f2" ON "rate_plan_extra_service" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_31439f41f37214c84164d32263" ON "rate_plan_extra_service" ("hotel_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_c3f7becaf7d2a38b6817d3caba" ON "rate_plan_extra_service" ("rate_plan_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ea5b2b782bbef2751db9905bd8" ON "rate_plan_extra_service" ("hotel_id", "rate_plan_id", "type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_payment_settlement_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "rate_plan_id" uuid NOT NULL, "mode" text NOT NULL, CONSTRAINT "PK_2904da32d4fb34afc295f914bb7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41f6644e44d6078a0697ec2429" ON "rate_plan_payment_settlement_setting" ("hotel_id", "mode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f34cca675904f5844de71c928" ON "rate_plan_payment_settlement_setting" ("hotel_id", "rate_plan_id", "mode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9191ef65bf5cffaf2ca999d86a" ON "rate_plan_payment_settlement_setting" ("hotel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5e6fe528c7733a8848079072d" ON "rate_plan_payment_settlement_setting" ("rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9a8ecd30d674494ae852d2939d" ON "rate_plan_payment_settlement_setting" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_payment_term_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "rate_plan_id" uuid NOT NULL, "hotel_payment_term_id" character varying(36) NOT NULL, "supported_payment_method_codes" text array, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_963c0934603859f8e4bccf82f5b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_564804f6650fd41e719446a4ce" ON "rate_plan_payment_term_setting" ("hotel_id", "supported_payment_method_codes") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2f28eb0ead299b6f9e45b16a9" ON "rate_plan_payment_term_setting" ("hotel_id", "rate_plan_id", "hotel_payment_term_id", "supported_payment_method_codes") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_30599e3a91e9c9dca6f4352640" ON "rate_plan_payment_term_setting" ("hotel_id", "hotel_payment_term_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dcd5a5de6b8b292761a4559787" ON "rate_plan_payment_term_setting" ("hotel_id", "rate_plan_id", "hotel_payment_term_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_5bb60b7b97301777b6eaa8b6b7" ON "rate_plan_payment_term_setting" ("hotel_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_cc13c4e50407b8861f5eac5f72" ON "rate_plan_payment_term_setting" ("rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c19fa6e65f749598a499d8bcd3" ON "rate_plan_payment_term_setting" ("hotel_id", "rate_plan_id", "is_default") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e13a7620d56aeb1419a039f2a4" ON "rate_plan_payment_term_setting" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_sellability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "rate_plan_id" uuid NOT NULL, "distribution_channel" text NOT NULL, "is_sellable" boolean NOT NULL, CONSTRAINT "PK_8bd29cf77410b2eb6b2687e7eff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_9a7f7290ad56626b34e27880e9" ON "rate_plan_sellability" ("hotel_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ae1a5fc367265c2db3d8ed1fc4" ON "rate_plan_sellability" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70f0157b27a88c506d5fe7eaea" ON "rate_plan_sellability" ("hotel_id", "rate_plan_id", "distribution_channel", "is_sellable") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7c586f1c9ff36c934be5df344" ON "rate_plan_sellability" ("hotel_id", "rate_plan_id", "distribution_channel") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "rate_plan_id" uuid NOT NULL, "hotel_id" character varying(36) NOT NULL, "language_code" text NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "PK_c2b86c2aa665da77568035838f7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c139d22de77e61887898220909" ON "rate_plan_translation" ("hotel_id", "language_code") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_950d382a62656aac2bcb203672" ON "rate_plan_translation" ("hotel_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_22b162fcc7c3d0ab3418fb5a93" ON "rate_plan_translation" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c57c620476e2f834dc85f1e6ef" ON "rate_plan_translation" ("hotel_id", "rate_plan_id", "language_code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_daily_base_price" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "feature_base_price" numeric(26,4) NOT NULL, "feature_price_adjustment" numeric(26,4) NOT NULL, "base_price" numeric(26,4) NOT NULL, CONSTRAINT "PK_3bcc4b72903ca63dfc4727f9918" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_1300d464eb8b042b6c11e43cc0" ON "room_product_daily_base_price" ("rate_plan_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_363c1a2da12bb063ddd047be88" ON "room_product_daily_base_price" ("room_product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73928e95be083faea567541679" ON "room_product_daily_base_price" ("hotel_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b43dd61beb17c18633470d2507" ON "room_product_daily_base_price" ("hotel_id", "room_product_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b098e66648cc7d5af57beba545" ON "room_product_daily_base_price" ("hotel_id", "room_product_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea4771448403c9c86cb4fb462a" ON "room_product_daily_base_price" ("hotel_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3885d55ee6f2335c153a63ff89" ON "room_product_daily_base_price" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8836abd7b333bae6bf394e597" ON "room_product_daily_base_price" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dec7a9de82d094d847e8a95394" ON "room_product_daily_base_price" ("hotel_id", "room_product_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_daily_selling_price" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "occupancy" integer NOT NULL DEFAULT '1', "base_price" numeric(26,4) NOT NULL, "feature_adjustments" numeric(26,4) NOT NULL DEFAULT '0', "rate_plan_adjustments" numeric(26,4) NOT NULL DEFAULT '0', "occupancy_surcharges" numeric(26,4) NOT NULL DEFAULT '0', "service_charges" numeric(26,4) NOT NULL DEFAULT '0', "net_price" numeric(26,4) NOT NULL, "gross_price" numeric(26,4) NOT NULL, "tax_rate" numeric(5,4) DEFAULT '0', "tax_amount" numeric(26,4) NOT NULL DEFAULT '0', "last_calculated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "is_stale" boolean NOT NULL DEFAULT false, "calculation_version" text, CONSTRAINT "PK_74609adc4c449f0cf416ac53afd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3dd410ab776dfe608d37c1588b" ON "room_product_daily_selling_price" ("last_calculated_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf336dd7776d817823f5cc5fb7" ON "room_product_daily_selling_price" ("rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a239a82c5698778e7e5a5bc92e" ON "room_product_daily_selling_price" ("room_product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0ed616b4c0e9fdaa5877657e8" ON "room_product_daily_selling_price" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_610eacd1ce5eea9304ccc0454d" ON "room_product_daily_selling_price" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8dc428efa848980f3da30d1ea9" ON "room_product_daily_selling_price" ("hotel_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21ed1faf38fbea882e6d5a5825" ON "room_product_daily_selling_price" ("hotel_id", "room_product_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_53fba24d4c54052e6fa0b5546c" ON "room_product_daily_selling_price" ("hotel_id", "room_product_id", "rate_plan_id", "date", "occupancy") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_pricing_method_detail" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "pricing_method" text NOT NULL, "pricing_method_adjustment_value" numeric(26,4) NULL, "pricing_method_adjustment_unit" text NULL, "mapping_room_product_id" uuid, "target_rate_plan_id" uuid, "target_room_product_id" uuid, "pms_rate_plan_code" text, CONSTRAINT "PK_94d5af5fabeaf98791067f4fa36" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d224b4df2ecdf56d438cbf563" ON "room_product_pricing_method_detail" ("rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4c3cfa85a14e8a1132dd38fb4" ON "room_product_pricing_method_detail" ("room_product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_712ff575d27a61deb0c21fc274" ON "room_product_pricing_method_detail" ("hotel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff0d898348f15f2215e620a015" ON "room_product_pricing_method_detail" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1e21259f3cf1c23c2d410dd8bc" ON "room_product_pricing_method_detail" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f3a638ea8b596181da3586b3ea" ON "room_product_pricing_method_detail" ("hotel_id", "room_product_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_feature_rate_adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_id" uuid NOT NULL, "feature_id" uuid NOT NULL, "room_product_rate_plan_id" uuid NOT NULL, "rate_adjustment" numeric(26,4) NOT NULL, "date" text NOT NULL, "rate_original" numeric(26,4) NOT NULL, CONSTRAINT "PK_0145186eaa6fbf86d521975f2e3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_609106eb9a329944d64d55276b" ON "room_product_feature_rate_adjustment" ("room_product_rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cdb0088e905f3e833e1e4b9de3" ON "room_product_feature_rate_adjustment" ("feature_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_389e832522ba0a76725f3ff76b" ON "room_product_feature_rate_adjustment" ("hotel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2d7a82d5cc423053cf6e49559" ON "room_product_feature_rate_adjustment" ("room_product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0955cecb5480cd68c7da0905f7" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7162cee4a2aa6575a2b77e21aa" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_id", "feature_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8049e5f2bb494f6747757d6a01" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_id", "feature_id", "room_product_rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de4db71aa3cdb5df120ed0dd30" ON "room_product_feature_rate_adjustment" ("hotel_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5cc961448cccf3e8657c255bf5" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_385bb3686a13828eeedbbfff3f" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_id", "feature_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_566673a6ae91af233f360ccde8" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_id", "feature_id", "room_product_rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_rate_plan_extra_occupancy_rate_adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_rate_plan_id" uuid NOT NULL, "extra_people" integer NOT NULL, "extra_rate" numeric(26,4) NOT NULL, "date" text NOT NULL, CONSTRAINT "PK_8c4ade5047cbd54a34369fb36ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4852ba262dcd91cd2c1bafeff" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21eb0dfe45d1fd44b8dc44aec2" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("extra_people") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d79a75c4405c7690fd112813a6" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("room_product_rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4ebf173c79405377cf2ce185ed" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "extra_people", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f51f155fc4dc3b5eb1c4f01fd6" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "room_product_rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fbb206c1c427d1d17fa03ed5c4" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "room_product_rate_plan_id", "extra_people") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2b05190e2e3135f6e4a14887d8" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7de0e87f8dd561cf29ea27c279" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "extra_people") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a2e7a185e07ac230f5ab323d6" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "room_product_rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8b0d93777050fa31558cabe004" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "room_product_rate_plan_id", "extra_people", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_rate_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "rate_plan_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "name" text NOT NULL, "code" character varying NOT NULL, "guarantee_type" text NOT NULL DEFAULT 'CREDIT_CARD', "cancellation_type" text NOT NULL DEFAULT 'FLEXIBLE', "total_base_rate" numeric(26,4), CONSTRAINT "PK_3264ab7ac9a8d5e20697544d801" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_2a5fb21eec0d495abd24aae1e9" ON "room_product_rate_plan" ("rate_plan_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_391fd73aaad1de7a77076c18c9" ON "room_product_rate_plan" ("room_product_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_2271360f67fd324dc215225f96" ON "room_product_rate_plan" ("hotel_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_4ecf837d11cd84a19d83019a5f" ON "room_product_rate_plan" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4cf360b40751175f820cf2b216" ON "room_product_rate_plan" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6fb58555db31a26747d959fd49" ON "room_product_rate_plan" ("hotel_id", "room_product_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_rate_plan_availability_adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_rate_plan_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "is_sellable" boolean NOT NULL, CONSTRAINT "PK_1c2ae37e65af1d0fae3fab3ee9f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_641a1c16b14d9dfe6e49390e90" ON "room_product_rate_plan_availability_adjustment" ("hotel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1cdb038333773cfc57765b0fb4" ON "room_product_rate_plan_availability_adjustment" ("rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb471aedcdb446f71ef9ded3b6" ON "room_product_rate_plan_availability_adjustment" ("room_product_rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6f81e2da6923492dc7acf5784" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_caf1cc9a78a0cfbd12931b8deb" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "room_product_rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ac972a1c7647be8638e8dd54c" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "room_product_rate_plan_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_325fd996a5c4bc0a0ac8dea072" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7b269e189b0fa7076dcc52c37" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_079845f882dda8ef731ade9786" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "room_product_rate_plan_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7eaf5c9f32f21ce72882cd01af" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "room_product_rate_plan_id", "rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_feature_daily_rate" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "rate_plan_id" uuid NOT NULL, "feature_id" uuid NOT NULL, "rate" numeric(26,4) NOT NULL, "date" text NOT NULL, CONSTRAINT "PK_cfb0bef72c14d9b35f982525a61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8745debfe6a51661391796e46e" ON "rate_plan_feature_daily_rate" ("rate_plan_id", "feature_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_8724c985e6489230d39925a7b6" ON "rate_plan_feature_daily_rate" ("feature_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_1d952ccbb689843f42dc38a17b" ON "rate_plan_feature_daily_rate" ("rate_plan_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d2600667c53853920efafd4ef0" ON "rate_plan_feature_daily_rate" ("rate_plan_id", "date", "feature_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_3240a3840f5ca17da4453fc847" ON "rate_plan_feature_daily_rate" ("date") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_2819ae635d83f6f4a5f79e88c2" ON "rate_plan_feature_daily_rate" ("rate_plan_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_base_price_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" character varying(36) NOT NULL, "room_product_id" uuid NOT NULL, "mode" text NOT NULL DEFAULT 'FEATURE_BASED', CONSTRAINT "PK_381ce0ae9e474b41a62bbe6da95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ac1759f36cc44c3fd4a522d89" ON "room_product_base_price_setting" ("hotel_id", "mode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5249a34a891a7d5af59135e970" ON "room_product_base_price_setting" ("hotel_id", "room_product_id", "mode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5d36d5fdb299bd40151a50ea0" ON "room_product_base_price_setting" ("room_product_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_17b7019c6d452e1f5ce1c966dd" ON "room_product_base_price_setting" ("hotel_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7857d2442d9bc409f75416ecd3" ON "room_product_base_price_setting" ("hotel_id", "room_product_id") `,
    );
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "soft_delete"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "promo_code"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "mapping_rate_plan_code"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "is_sellable"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "created_by" text`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "updated_by" text`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "pms_mapping_rate_plan_code" text`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "promo_codes" text array`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "hotel_id"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "hotel_id" character varying(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "name" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "code"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "code" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "pricing_methodology"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "pricing_methodology" text DEFAULT 'FEATURE_BASED_PRICING'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "hour_prior" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "hour_prior" SET DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "display_unit"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "display_unit" text DEFAULT 'DAY'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "cancellation_fee_value"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "cancellation_fee_value" numeric(26,4)`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "cancellation_fee_unit"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "cancellation_fee_unit" text DEFAULT 'PERCENTAGE'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "hotel_cxl_policy_code"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "hotel_cxl_policy_code" text`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "payment_term_code"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "payment_term_code" text`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "pay_at_hotel"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "pay_at_hotel" numeric(26,4)`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "pay_on_confirmation"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "pay_on_confirmation" numeric(26,4)`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "rounding_mode"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "rounding_mode" text DEFAULT 'NO_ROUNDING'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "status" text DEFAULT 'ACTIVE'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "type" text DEFAULT 'PUBLIC'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "is_primary" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "is_primary" SET DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "distribution_channel"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "distribution_channel" text array DEFAULT '{GV_SALES_ENGINE,GV_VOICE}'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "rfc_attribute_mode" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "rfc_attribute_mode" SET DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "mrfc_positioning_mode" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "mrfc_positioning_mode" SET DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "hotel_extras_code_list"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "hotel_extras_code_list" text`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "adjustment_value"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "adjustment_value" numeric(26,4)`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "adjustment_unit"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "adjustment_unit" text DEFAULT 'FIXED'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "selling_strategy_type"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "selling_strategy_type" text DEFAULT 'DEFAULT'`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "market_segment_id"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "market_segment_id" text`);
    await queryRunner.query(`CREATE INDEX "IDX_99e5a4bafa8698bfebf4f99eef" ON "rate_plan" ("hotel_id", "type") `);
    await queryRunner.query(`CREATE INDEX "IDX_25f449d5fd8c1764f9d74d9295" ON "rate_plan" ("hotel_id", "distribution_channel") `);
    await queryRunner.query(`CREATE INDEX "IDX_c1207cd2eafa6fbe35773cc815" ON "rate_plan" ("hotel_id", "status") `);
    await queryRunner.query(`CREATE INDEX "IDX_1675421cf163a792b608ac5a9c" ON "rate_plan" ("hotel_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_da9a96d1b21dba2c14090e8029" ON "rate_plan" ("hotel_id", "code") `);
    await queryRunner.query(
      `ALTER TABLE "room_product_extra_occupancy_rate" ADD CONSTRAINT "FK_0775bee087b634c4709b89ab46d" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_cxl_policy_daily" ADD CONSTRAINT "FK_a2ca0e9b1fe9f98f9dd36acf936" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_adjustment" ADD CONSTRAINT "FK_347d16480ac7b7713353a871b98" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_extra_service" ADD CONSTRAINT "FK_8bc2e51c42119f7b547efdfd133" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_payment_term" ADD CONSTRAINT "FK_524fbdadbafbc44717cd5867fe2" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_sellability" ADD CONSTRAINT "FK_cd7b0cb71db9c3391518e2d2a17" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_derived_setting" ADD CONSTRAINT "FK_2e6419a2ca9d71bfc81284bfc78" FOREIGN KEY ("derived_rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_derived_setting" ADD CONSTRAINT "FK_89c9ed76312fed9fad9f5f0df9e" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_extra_service" ADD CONSTRAINT "FK_c3f7becaf7d2a38b6817d3caba3" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_payment_settlement_setting" ADD CONSTRAINT "FK_e5e6fe528c7733a8848079072da" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_payment_term_setting" ADD CONSTRAINT "FK_cc13c4e50407b8861f5eac5f72c" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_sellability" ADD CONSTRAINT "FK_b7a88abc60ea19aa79402c69bcd" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_translation" ADD CONSTRAINT "FK_02c2fd8a13904b9be2c5343461c" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_base_price" ADD CONSTRAINT "FK_363c1a2da12bb063ddd047be88d" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_base_price" ADD CONSTRAINT "FK_1300d464eb8b042b6c11e43cc07" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_selling_price" ADD CONSTRAINT "FK_a239a82c5698778e7e5a5bc92e8" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_selling_price" ADD CONSTRAINT "FK_bf336dd7776d817823f5cc5fb7a" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_pricing_method_detail" ADD CONSTRAINT "FK_e4c3cfa85a14e8a1132dd38fb4a" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_pricing_method_detail" ADD CONSTRAINT "FK_2d224b4df2ecdf56d438cbf563d" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" ADD CONSTRAINT "FK_c2d7a82d5cc423053cf6e495591" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" ADD CONSTRAINT "FK_609106eb9a329944d64d55276bb" FOREIGN KEY ("room_product_rate_plan_id") REFERENCES "room_product_rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" ADD CONSTRAINT "FK_cdb0088e905f3e833e1e4b9de3a" FOREIGN KEY ("feature_id") REFERENCES "room_product_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_extra_occupancy_rate_adjustment" ADD CONSTRAINT "FK_d79a75c4405c7690fd112813a6c" FOREIGN KEY ("room_product_rate_plan_id") REFERENCES "room_product_rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan" ADD CONSTRAINT "FK_2a5fb21eec0d495abd24aae1e9e" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan" ADD CONSTRAINT "FK_391fd73aaad1de7a77076c18c9e" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_availability_adjustment" ADD CONSTRAINT "FK_bb471aedcdb446f71ef9ded3b6a" FOREIGN KEY ("room_product_rate_plan_id") REFERENCES "room_product_rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_availability_adjustment" ADD CONSTRAINT "FK_1cdb038333773cfc57765b0fb4b" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_feature_daily_rate" ADD CONSTRAINT "FK_1d952ccbb689843f42dc38a17b1" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_feature_daily_rate" ADD CONSTRAINT "FK_8724c985e6489230d39925a7b67" FOREIGN KEY ("feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_base_price_setting" ADD CONSTRAINT "FK_e5d36d5fdb299bd40151a50ea04" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_product_base_price_setting" DROP CONSTRAINT "FK_e5d36d5fdb299bd40151a50ea04"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_feature_daily_rate" DROP CONSTRAINT "FK_8724c985e6489230d39925a7b67"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_feature_daily_rate" DROP CONSTRAINT "FK_1d952ccbb689843f42dc38a17b1"`);
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_availability_adjustment" DROP CONSTRAINT "FK_1cdb038333773cfc57765b0fb4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_availability_adjustment" DROP CONSTRAINT "FK_bb471aedcdb446f71ef9ded3b6a"`,
    );
    await queryRunner.query(`ALTER TABLE "room_product_rate_plan" DROP CONSTRAINT "FK_391fd73aaad1de7a77076c18c9e"`);
    await queryRunner.query(`ALTER TABLE "room_product_rate_plan" DROP CONSTRAINT "FK_2a5fb21eec0d495abd24aae1e9e"`);
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_extra_occupancy_rate_adjustment" DROP CONSTRAINT "FK_d79a75c4405c7690fd112813a6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" DROP CONSTRAINT "FK_cdb0088e905f3e833e1e4b9de3a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" DROP CONSTRAINT "FK_609106eb9a329944d64d55276bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" DROP CONSTRAINT "FK_c2d7a82d5cc423053cf6e495591"`,
    );
    await queryRunner.query(`ALTER TABLE "room_product_pricing_method_detail" DROP CONSTRAINT "FK_2d224b4df2ecdf56d438cbf563d"`);
    await queryRunner.query(`ALTER TABLE "room_product_pricing_method_detail" DROP CONSTRAINT "FK_e4c3cfa85a14e8a1132dd38fb4a"`);
    await queryRunner.query(`ALTER TABLE "room_product_daily_selling_price" DROP CONSTRAINT "FK_bf336dd7776d817823f5cc5fb7a"`);
    await queryRunner.query(`ALTER TABLE "room_product_daily_selling_price" DROP CONSTRAINT "FK_a239a82c5698778e7e5a5bc92e8"`);
    await queryRunner.query(`ALTER TABLE "room_product_daily_base_price" DROP CONSTRAINT "FK_1300d464eb8b042b6c11e43cc07"`);
    await queryRunner.query(`ALTER TABLE "room_product_daily_base_price" DROP CONSTRAINT "FK_363c1a2da12bb063ddd047be88d"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_translation" DROP CONSTRAINT "FK_02c2fd8a13904b9be2c5343461c"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_sellability" DROP CONSTRAINT "FK_b7a88abc60ea19aa79402c69bcd"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_payment_term_setting" DROP CONSTRAINT "FK_cc13c4e50407b8861f5eac5f72c"`);
    await queryRunner.query(
      `ALTER TABLE "rate_plan_payment_settlement_setting" DROP CONSTRAINT "FK_e5e6fe528c7733a8848079072da"`,
    );
    await queryRunner.query(`ALTER TABLE "rate_plan_extra_service" DROP CONSTRAINT "FK_c3f7becaf7d2a38b6817d3caba3"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_derived_setting" DROP CONSTRAINT "FK_89c9ed76312fed9fad9f5f0df9e"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_derived_setting" DROP CONSTRAINT "FK_2e6419a2ca9d71bfc81284bfc78"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_daily_sellability" DROP CONSTRAINT "FK_cd7b0cb71db9c3391518e2d2a17"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_daily_payment_term" DROP CONSTRAINT "FK_524fbdadbafbc44717cd5867fe2"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_daily_extra_service" DROP CONSTRAINT "FK_8bc2e51c42119f7b547efdfd133"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_daily_adjustment" DROP CONSTRAINT "FK_347d16480ac7b7713353a871b98"`);
    await queryRunner.query(`ALTER TABLE "rate_plan_cxl_policy_daily" DROP CONSTRAINT "FK_a2ca0e9b1fe9f98f9dd36acf936"`);
    await queryRunner.query(`ALTER TABLE "room_product_extra_occupancy_rate" DROP CONSTRAINT "FK_0775bee087b634c4709b89ab46d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_da9a96d1b21dba2c14090e8029"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1675421cf163a792b608ac5a9c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c1207cd2eafa6fbe35773cc815"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_25f449d5fd8c1764f9d74d9295"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_99e5a4bafa8698bfebf4f99eef"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "market_segment_id"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "market_segment_id" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "selling_strategy_type"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "selling_strategy_type" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "adjustment_unit"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "adjustment_unit" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "adjustment_value"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "adjustment_value" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "hotel_extras_code_list"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "hotel_extras_code_list" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "mrfc_positioning_mode" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "mrfc_positioning_mode" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "rfc_attribute_mode" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "rfc_attribute_mode" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "distribution_channel"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "distribution_channel" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "is_primary" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "is_primary" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "type" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "status" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "rounding_mode"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "rounding_mode" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "description" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "pay_on_confirmation"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "pay_on_confirmation" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "pay_at_hotel"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "pay_at_hotel" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "payment_term_code"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "payment_term_code" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "hotel_cxl_policy_code"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "hotel_cxl_policy_code" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "cancellation_fee_unit"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "cancellation_fee_unit" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "cancellation_fee_value"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "cancellation_fee_value" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "display_unit"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "display_unit" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "hour_prior" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ALTER COLUMN "hour_prior" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "pricing_methodology"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "pricing_methodology" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "code"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "code" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "name" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "hotel_id"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "hotel_id" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "promo_codes"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "pms_mapping_rate_plan_code"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "updated_by"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "is_sellable" boolean NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "mapping_rate_plan_code" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "promo_code" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "rate_plan" ADD "soft_delete" boolean NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7857d2442d9bc409f75416ecd3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17b7019c6d452e1f5ce1c966dd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e5d36d5fdb299bd40151a50ea0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5249a34a891a7d5af59135e970"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2ac1759f36cc44c3fd4a522d89"`);
    await queryRunner.query(`DROP TABLE "room_product_base_price_setting"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2819ae635d83f6f4a5f79e88c2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3240a3840f5ca17da4453fc847"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d2600667c53853920efafd4ef0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1d952ccbb689843f42dc38a17b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8724c985e6489230d39925a7b6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8745debfe6a51661391796e46e"`);
    await queryRunner.query(`DROP TABLE "rate_plan_feature_daily_rate"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7eaf5c9f32f21ce72882cd01af"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_079845f882dda8ef731ade9786"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f7b269e189b0fa7076dcc52c37"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_325fd996a5c4bc0a0ac8dea072"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5ac972a1c7647be8638e8dd54c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_caf1cc9a78a0cfbd12931b8deb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a6f81e2da6923492dc7acf5784"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bb471aedcdb446f71ef9ded3b6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1cdb038333773cfc57765b0fb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_641a1c16b14d9dfe6e49390e90"`);
    await queryRunner.query(`DROP TABLE "room_product_rate_plan_availability_adjustment"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6fb58555db31a26747d959fd49"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4cf360b40751175f820cf2b216"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4ecf837d11cd84a19d83019a5f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2271360f67fd324dc215225f96"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_391fd73aaad1de7a77076c18c9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2a5fb21eec0d495abd24aae1e9"`);
    await queryRunner.query(`DROP TABLE "room_product_rate_plan"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8b0d93777050fa31558cabe004"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4a2e7a185e07ac230f5ab323d6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7de0e87f8dd561cf29ea27c279"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2b05190e2e3135f6e4a14887d8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fbb206c1c427d1d17fa03ed5c4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f51f155fc4dc3b5eb1c4f01fd6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4ebf173c79405377cf2ce185ed"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d79a75c4405c7690fd112813a6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_21eb0dfe45d1fd44b8dc44aec2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f4852ba262dcd91cd2c1bafeff"`);
    await queryRunner.query(`DROP TABLE "room_product_rate_plan_extra_occupancy_rate_adjustment"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_566673a6ae91af233f360ccde8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_385bb3686a13828eeedbbfff3f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5cc961448cccf3e8657c255bf5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de4db71aa3cdb5df120ed0dd30"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8049e5f2bb494f6747757d6a01"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7162cee4a2aa6575a2b77e21aa"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0955cecb5480cd68c7da0905f7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c2d7a82d5cc423053cf6e49559"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_389e832522ba0a76725f3ff76b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cdb0088e905f3e833e1e4b9de3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_609106eb9a329944d64d55276b"`);
    await queryRunner.query(`DROP TABLE "room_product_feature_rate_adjustment"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f3a638ea8b596181da3586b3ea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1e21259f3cf1c23c2d410dd8bc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ff0d898348f15f2215e620a015"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_712ff575d27a61deb0c21fc274"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e4c3cfa85a14e8a1132dd38fb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2d224b4df2ecdf56d438cbf563"`);
    await queryRunner.query(`DROP TABLE "room_product_pricing_method_detail"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_53fba24d4c54052e6fa0b5546c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_21ed1faf38fbea882e6d5a5825"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8dc428efa848980f3da30d1ea9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_610eacd1ce5eea9304ccc0454d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f0ed616b4c0e9fdaa5877657e8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a239a82c5698778e7e5a5bc92e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bf336dd7776d817823f5cc5fb7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3dd410ab776dfe608d37c1588b"`);
    await queryRunner.query(`DROP TABLE "room_product_daily_selling_price"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dec7a9de82d094d847e8a95394"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a8836abd7b333bae6bf394e597"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3885d55ee6f2335c153a63ff89"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ea4771448403c9c86cb4fb462a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b098e66648cc7d5af57beba545"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b43dd61beb17c18633470d2507"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_73928e95be083faea567541679"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_363c1a2da12bb063ddd047be88"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1300d464eb8b042b6c11e43cc0"`);
    await queryRunner.query(`DROP TABLE "room_product_daily_base_price"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c57c620476e2f834dc85f1e6ef"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_22b162fcc7c3d0ab3418fb5a93"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_950d382a62656aac2bcb203672"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c139d22de77e61887898220909"`);
    await queryRunner.query(`DROP TABLE "rate_plan_translation"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a7c586f1c9ff36c934be5df344"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_70f0157b27a88c506d5fe7eaea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ae1a5fc367265c2db3d8ed1fc4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9a7f7290ad56626b34e27880e9"`);
    await queryRunner.query(`DROP TABLE "rate_plan_sellability"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e13a7620d56aeb1419a039f2a4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c19fa6e65f749598a499d8bcd3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cc13c4e50407b8861f5eac5f72"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5bb60b7b97301777b6eaa8b6b7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dcd5a5de6b8b292761a4559787"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_30599e3a91e9c9dca6f4352640"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e2f28eb0ead299b6f9e45b16a9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_564804f6650fd41e719446a4ce"`);
    await queryRunner.query(`DROP TABLE "rate_plan_payment_term_setting"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9a8ecd30d674494ae852d2939d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e5e6fe528c7733a8848079072d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9191ef65bf5cffaf2ca999d86a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9f34cca675904f5844de71c928"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_41f6644e44d6078a0697ec2429"`);
    await queryRunner.query(`DROP TABLE "rate_plan_payment_settlement_setting"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ea5b2b782bbef2751db9905bd8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c3f7becaf7d2a38b6817d3caba"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_31439f41f37214c84164d32263"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8dc2a2750b6e201dd0c1bfd7f2"`);
    await queryRunner.query(`DROP TABLE "rate_plan_extra_service"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_2a90bbc9221736f02c59e3a78b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_89c9ed76312fed9fad9f5f0df9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_76cf0e6c1d2a7bce3a4e980430"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_01beeadedebb419d7ecc49903c"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_3b852e505cc20032696c4fd635"`);
    await queryRunner.query(`DROP TABLE "rate_plan_derived_setting"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a6e55d2f017b91225ab56cf915"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cd7b0cb71db9c3391518e2d2a1"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_20d3e36fbcfd21f3abb2b8a033"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e1bcc4ceb5e442452187175b17"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_84288073e3df2bf91700513228"`);
    await queryRunner.query(`DROP TABLE "rate_plan_daily_sellability"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0372a023eda48d4ed7c0de81fe"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_524fbdadbafbc44717cd5867fe"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a96f143fbaa2b5194a1ea3f9e5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_694d7585cb6830d8f1ede345c9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_20fa3dc9b8235fa26f9b189709"`);
    await queryRunner.query(`DROP TABLE "rate_plan_daily_payment_term"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_94c036b555cce04f701424b1c5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8bc2e51c42119f7b547efdfd13"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0ed8a846946282f36725c4c89f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_51368910e1c8d4f423d0725ccb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6578699b29ba131a3b14613f20"`);
    await queryRunner.query(`DROP TABLE "rate_plan_daily_extra_service"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1facd0fde06685f780c2758828"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_347d16480ac7b7713353a871b9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_553612cadbc5aeb0bd8f829746"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_88467d040abd37e025a28f17bf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0d6495e0977334c4d1c28abbe5"`);
    await queryRunner.query(`DROP TABLE "rate_plan_daily_adjustment"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9fa8fc2dbfdefbe053c7beb372"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a2ca0e9b1fe9f98f9dd36acf93"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_470ea47457db499f914b91779f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bcc8e5d59d5b146433e41c67a7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2c2a2ee0326e10737bd4b9b55e"`);
    await queryRunner.query(`DROP TABLE "rate_plan_cxl_policy_daily"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b9d9696d383555299b75eb3a09"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7d96b756d865b9835b2d156fd4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cd6e36537b931dbf7b22a6d0b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d842b20877ea25265861924345"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6fd851f8ffbed21b275f45e52a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0775bee087b634c4709b89ab46"`);
    await queryRunner.query(`DROP TABLE "room_product_extra_occupancy_rate"`);
  }
}
