import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1763450089233 implements MigrationInterface {
  name = ' Init1763450089233';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "restriction_automation_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "type" text NOT NULL, "reference_id" uuid NOT NULL, "is_enabled" boolean NOT NULL DEFAULT true, "rules" jsonb, "settings" jsonb, CONSTRAINT "REL_d3a09f3e8c586212acd0ced75e" UNIQUE ("reference_id"), CONSTRAINT "PK_f4f8be7a93babb27b7ffb057d19" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "ras_reference_id_idx" ON "restriction_automation_setting" ("reference_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "ras_hotel_id_type_idx" ON "restriction_automation_setting" ("hotel_id", "type") `
    );
    await queryRunner.query(
      `CREATE INDEX "ras_hotel_id_idx" ON "restriction_automation_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ras_unique_idx" ON "restriction_automation_setting" ("hotel_id", "type", "reference_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_base_price_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "mode" text NOT NULL DEFAULT 'FEATURE_BASED', "fixed_price" numeric(26,4) DEFAULT '9999', CONSTRAINT "PK_381ce0ae9e474b41a62bbe6da95" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ac1759f36cc44c3fd4a522d89" ON "room_product_base_price_setting" ("hotel_id", "mode") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5249a34a891a7d5af59135e970" ON "room_product_base_price_setting" ("hotel_id", "room_product_id", "mode") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5d36d5fdb299bd40151a50ea0" ON "room_product_base_price_setting" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17b7019c6d452e1f5ce1c966dd" ON "room_product_base_price_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7857d2442d9bc409f75416ecd3" ON "room_product_base_price_setting" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_daily_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "room_product_id" uuid NOT NULL, "hotel_id" uuid, "date" text, "available" integer, "sold" integer, "sell_limit" integer, "adjustment" integer, CONSTRAINT "PK_a5bac6c6db639b9eb8e9f993a69" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a2481c471efa56df04e16662d" ON "room_product_daily_availability" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_36c62333a804768f70a35604bd" ON "room_product_daily_availability" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_89256677b62dd7f7e15629ca08" ON "room_product_daily_availability" ("hotel_id", "room_product_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_configuration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid, "config_value" jsonb, "config_type" character varying(60) NOT NULL, CONSTRAINT "PK_7128816ebf1688dddc9a0ec4f4e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_748c9dec2570a0524e9de6b8fe" ON "hotel_configuration" ("hotel_id", "config_type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8d65542b21ed1d23baf0d5e617" ON "hotel_configuration" ("config_type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e73fed024f8ac0cc26b772f46" ON "hotel_configuration" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "currency" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH  TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "name" character varying(255), "code" character varying(60), CONSTRAINT "PK_3cda65c731a6264f0e444cc9b91" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_723472e41cae44beb0763f4039" ON "currency" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "global_payment_method" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "deleted_at" TIMESTAMP WITH TIME ZONE, "code" character varying(60), "name" character varying(255), "description" text, "supported_payment_provider_codes" jsonb, CONSTRAINT "PK_b6daa67e692bd77eb727d523b3d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e93eea007a3e704573cccc5fd9" ON "global_payment_method" ("name") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_32919a5ab02055f5338e90becc" ON "global_payment_method" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "booking_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "booking_id" uuid, "currency_id" uuid, "payment_date" TIMESTAMP WITH TIME ZONE, "payment_mode" character varying, "reference_number" character varying(60), "transaction_number" character varying(60), "account_number" character varying(30), "account_holder" character varying(255), "expiry_month" character varying(60), "expiry_year" character varying(60), "card_type" character varying(60), "status" character varying(60), "total_amount" numeric(26,4), "payment_data" character varying(4000), "authentication_action_data" text, CONSTRAINT "PK_5b5c66747e977431761d4eb64b4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "booking_transaction_currency_id_index" ON "booking_transaction" ("currency_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "booking_transaction_booking_id_fk" ON "booking_transaction" ("booking_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "booking_proposal_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid NOT NULL, "booking_id" uuid NOT NULL, "trigger_at" TIMESTAMP WITH TIME ZONE NOT NULL, "valid_before" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "REL_e979705ca4be0d87cf822b05d5" UNIQUE ("booking_id"), CONSTRAINT "PK_399914d50ce7bd6fc4f0e301162" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b26c138bf061d8eba8f07d0732" ON "booking_proposal_setting" ("hotel_id", "booking_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e979705ca4be0d87cf822b05d5" ON "booking_proposal_setting" ("booking_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2818478cfb752906b8b27e02de" ON "booking_proposal_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "booking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid, "booking_number" character varying(60), "mapping_booking_code" character varying(4000), "mapping_channel_booking_code" character varying(100), "completed_date" TIMESTAMP WITH TIME ZONE, "hold_expired_date" TIMESTAMP WITH TIME ZONE, "booker_id" uuid, "special_request" character varying(4000), "accept_tnc" boolean DEFAULT false, "is_book_for_someone_else" boolean DEFAULT false, "is_confirmation_email_sent" boolean DEFAULT false, "metadata" text, CONSTRAINT "PK_49171efc69702ed84c812f33540" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4ee97cceb057d5cf2edc0f0ac0" ON "booking" ("booker_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_hotelId_bookingNumber" ON "booking" ("hotel_id", "booking_number") `
    );
    await queryRunner.query(`CREATE INDEX "idx_bookingNumber" ON "booking" ("booking_number") `);
    await queryRunner.query(
      `CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(1000), "tax_id" character varying(255), "email" character varying(255), "address" character varying(4000), "city" character varying(255), "country" character varying(255), "postal_code" character varying(255), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0e46a7d2226c6deb73fd26023" ON "company" ("tax_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "template_amenity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "icon_image_id" uuid, "name" character varying(255), "code" character varying(60), "description" character varying(500), "amenity_type" character varying(60), "pricing_unit" character varying(60), "availability" character varying(60), "post_next_day" boolean, "display_sequence" integer, CONSTRAINT "PK_5c83c37b33bb51cdc1bc0503a75" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a2feb46b60f406a364b436863" ON "template_amenity" ("display_sequence") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4948e2a61d344b3ac92c3bfddd" ON "template_amenity" ("availability") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fae5f8241e6ef84a9afa160255" ON "template_amenity" ("pricing_unit") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d9cd24f1778773153fa86d2f5" ON "template_amenity" ("amenity_type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2994531a0a3311a13d32a2520" ON "template_amenity" ("name") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1835eb435e618645e87f0c810c" ON "template_amenity" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_age_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid, "name" character varying(255), "code" character varying(60), "description" character varying(255), "from_age" integer, "to_age" integer, "is_include_extra_occupancy_rate" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_d8b846efd33d81415ceae911970" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_eb02d011bec0533ab4488b5634" ON "hotel_age_category" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1258f4eca603b37fdf2e78e83d" ON "hotel_age_category" ("to_age") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_621723d530987b8d57ddbd817a" ON "hotel_age_category" ("from_age") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b134b963878ec4209d0ec62d61" ON "hotel_age_category" ("code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac67645a950182263fea58fc64" ON "hotel_age_category" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_amenity_price" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_amenity_id" uuid NOT NULL, "hotel_age_category_id" uuid NOT NULL, "price" numeric, CONSTRAINT "PK_d2543ae9c21ad1955b6f57e4827" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dc32a945048bcd6adf1457b859" ON "hotel_amenity_price" ("price") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1b18b3eb11d1a2a7555044ff1b" ON "hotel_amenity_price" ("hotel_amenity_id", "hotel_age_category_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf1eada9bc406bb9fc591b9681" ON "hotel_amenity_price" ("hotel_age_category_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8572aa42516d4cc6fd491c240" ON "hotel_amenity_price" ("hotel_amenity_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_extra" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "extras_id" uuid, "hotel_id" uuid, "type" text, CONSTRAINT "PK_01bf84c4ffa0438cb14f47f133c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b9a81cc6b44958cacf8aac93df" ON "room_product_extra" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4920a88d7942a0ac15b09630ae" ON "room_product_extra" ("hotel_id", "room_product_id", "type") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_extra_service" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "rate_plan_id" uuid NOT NULL, "extras_id" uuid, "type" text, CONSTRAINT "PK_f7fcfe1ec65447e459d49265c09" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_75587f956c9f128f13ef841cff" ON "rate_plan_extra_service" ("extras_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c3f7becaf7d2a38b6817d3caba" ON "rate_plan_extra_service" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f1c28c97fc30dd76aff2e764e" ON "rate_plan_extra_service" ("rate_plan_id", "type") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_amenity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid, "icon_image_id" uuid, "icon_image_url" text, "template_amenity_id" uuid, "name" character varying(255), "description" character varying(500), "base_rate" numeric, "amenity_type" character varying(60), "pricing_unit" character varying(60), "ise_pricing_display_mode" character varying(16), "availability" character varying(60), "post_next_day" boolean, "display_sequence" integer, "mapping_hotel_amenity_code" character varying(60), "code" character varying(60), "status" character varying(60) DEFAULT 'ACTIVE', "is_included" boolean DEFAULT false, "distribution_channel" character varying array NOT NULL DEFAULT ARRAY['GV_SALES_ENGINE','GV_VOICE'], "selling_type" character varying(40) NOT NULL DEFAULT 'SINGLE', "linked_amenity_code" character varying(1000), CONSTRAINT "PK_3c028fa02715a28b8361eff863a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6fcbcddcb0719642fed11b1be9" ON "hotel_amenity" ("code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_580e37607c5a78f975c9d3944a" ON "hotel_amenity" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b7a77eca4e9fa9096cce7c148c" ON "hotel_amenity" ("amenity_type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5b59d68ceccea6e079ff5dc0c" ON "hotel_amenity" ("template_amenity_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8632206e127227fa2c75abb020" ON "hotel_amenity" ("icon_image_url") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4585bedf24786a47d1ee691c05" ON "hotel_amenity" ("icon_image_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20f36b266666e1391a4c280df4" ON "hotel_amenity" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "reservation_amenity_date" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "reservation_amenity_id" uuid, "count" integer, "date_of_amenity" bigint, "total_base_amount" numeric(26,4), "total_gross_amount" numeric(26,4), "tax_amount" numeric(26,4), "service_charge_amount" numeric(26,4), "date" date, CONSTRAINT "PK_88225803f7d1e5e508ca2e20543" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd02fb89f5a4ed2014d04b94ae" ON "reservation_amenity_date" ("reservation_amenity_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "reservation_amenity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "reservation_id" uuid, "hotel_amenity_id" uuid, "extra_service_type" character varying(60), "master_hotel_amenity_id" uuid, "total_base_amount" numeric(26,4), "total_gross_amount" numeric(26,4), "tax_amount" numeric(26,4), "service_charge_amount" numeric(26,4), "age_category_code" character varying(60), CONSTRAINT "PK_ca710b8127d9739a4d49be1ae5e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6f8e481725aefb002e570a68b" ON "reservation_amenity" ("master_hotel_amenity_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_888c31129a59ad05a4b5942074" ON "reservation_amenity" ("hotel_amenity_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73cc3fef5f959bfb6296ebbb51" ON "reservation_amenity" ("reservation_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "reservation_room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "reservation_id" uuid, "room_id" uuid, CONSTRAINT "PK_0a64603514894d54c75c0a43157" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd70d5c3410683aca226f3aeaf" ON "reservation_room" ("reservation_id", "room_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_207d01f70600a3b5817a95b690" ON "reservation_room" ("room_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2af62c299d3061019238249bbe" ON "reservation_room" ("reservation_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "reservation_time_slice" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "room_id" uuid, "reservation_id" uuid, "room_product_id" uuid, "millisec_from_time" bigint, "millisec_to_time" bigint, "total_base_amount" numeric(26,4), "total_gross_amount" numeric(26,4), "tax_amount" numeric(26,4), "service_charge_amount" numeric(26,4), "is_locked" boolean DEFAULT false, "from_time" TIMESTAMP WITH TIME ZONE, "to_time" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_29e37f395bbe4672f2b7e35b05d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54d460a7e9fb617103c3efec11" ON "reservation_time_slice" ("reservation_id", "room_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39e825da1b11d74f1eff669146" ON "reservation_time_slice" ("room_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41aa5877f81289cc1058158ffc" ON "reservation_time_slice" ("reservation_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_228611941a0a9a5d8e6f45372b" ON "reservation_time_slice" ("reservation_id", "room_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_325b71ac3a60ec3512aabcb3d6" ON "reservation_time_slice" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_14b376bc18d3e5f9931c023f15" ON "reservation_time_slice" ("room_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27b70912dc9c7e25dffc3c64a4" ON "reservation_time_slice" ("reservation_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "reservation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid, "booking_id" uuid, "reservation_number" character varying(60), "trip_purpose" character varying(255), "mapping_reservation_code" character varying(255), "mapping_channel_reservation_code" character varying(100), "arrival" TIMESTAMP WITH TIME ZONE, "departure" TIMESTAMP WITH TIME ZONE, "booking_flow" character varying(60), "channel" character varying(60), "source" text, "status" character varying(60) DEFAULT 'RESERVED', "booking_language" character varying(5), "rate_plan_id" uuid, "market_segment_id" uuid, "rate_plan_type" character varying(60), "room_product_id" uuid, "adults" integer, "children_ages" character varying(255), "pets" integer DEFAULT '0', "primary_guest_id" uuid, "additional_guests" text, "company_id" uuid, "total_base_amount" numeric(26,4), "tax_amount" numeric(26,4), "tax_details" jsonb, "city_tax_amount" numeric(26,4), "city_tax_details" jsonb, "service_charge_amount" numeric(26,4), "total_gross_amount" numeric(26,4), "pay_on_confirmation_amount" numeric(26,4), "pay_at_hotel_amount" numeric(26,4), "balance" numeric(26,4), "booking_date" TIMESTAMP WITH TIME ZONE, "released_date" TIMESTAMP WITH TIME ZONE, "cancelled_by" character varying(50), "cancelled_date" TIMESTAMP WITH TIME ZONE, "cancelled_reason" text, "cancellation_fee" numeric(26,4), "cxl_policy_code" character varying, "no_show_fee" numeric(26,4), "matched_feature" character varying(2000), "mismatched_feature" character varying(2000), "currency_code" character varying(16), "payment_term_code" character varying(50), "hotel_payment_mode_code" character varying(60), "promo_code" character varying(2000), "hour_prior" integer, "is_locked" boolean DEFAULT false, "note" text, "guest_note" character varying(4000), "pdf_url" character varying(255), CONSTRAINT "PK_48b1f9922368359ab88e8bfa525" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_hotelId_reservationNumber" ON "reservation" ("hotel_id", "reservation_number") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_mapping_reservation_code" ON "reservation" ("mapping_reservation_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payment_mode" ON "reservation" ("hotel_payment_mode_code") `
    );
    await queryRunner.query(`CREATE INDEX "idx_channel" ON "reservation" ("channel") `);
    await queryRunner.query(
      `CREATE INDEX "idx_hotelId_status_arrival_departure" ON "reservation" ("hotel_id", "status", "arrival", "departure") `
    );
    await queryRunner.query(
      `CREATE INDEX "index_reservation_hotel_id" ON "reservation" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "reservation_soft_delete_status_booking_id_reservation_id" ON "reservation" ("deleted_at", "status", "booking_id", "id") `
    );
    await queryRunner.query(
      `CREATE INDEX "index_reservation_departure" ON "reservation" ("departure") `
    );
    await queryRunner.query(
      `CREATE INDEX "index_reservation_arrival" ON "reservation" ("arrival") `
    );
    await queryRunner.query(
      `CREATE INDEX "reservation_reservation_number_index" ON "reservation" ("reservation_number") `
    );
    await queryRunner.query(
      `CREATE INDEX "reservation_booking_id_fk" ON "reservation" ("booking_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "guest" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "country_id" uuid, "first_name" character varying(255), "last_name" character varying(255), "email_address" character varying(255), "address" character varying(512), "city" character varying(255), "state" character varying(50), "postal_code" character varying(20), "phone_number" character varying(255), "country_number" character varying(20), "company_postal_code" character varying(255), "company_country" character varying(255), "company_city" character varying(255), "company_address" character varying(4000), "company_email" character varying(255), "company_name" character varying(1000), "company_tax_id" character varying(255), "is_main_guest" boolean DEFAULT false, "is_booker" boolean DEFAULT false, "is_returning_guest" boolean DEFAULT false, "hotel_id" uuid, "preferred_language" character varying, CONSTRAINT "REL_ccee49c448c6efb0e0d65041d6" UNIQUE ("hotel_id"), CONSTRAINT "PK_57689d19445de01737dbc458857" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac28d3d5ca8c031eac15c7ab68" ON "guest" ("country_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "country" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "flag_image_id" uuid, "name" character varying(255), "code" character varying(60), "phone_code" character varying(20), CONSTRAINT "PK_bf6e37c231c4f4ea56dcd887269" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_8ff4c23dc9a3f3856555bd8618" ON "country" ("code") `);
    await queryRunner.query(
      `CREATE TABLE "file_library" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "original_name" character varying(255), "content_type" character varying(40), "url" character varying(255), "file_size" bigint, CONSTRAINT "PK_06295547a9e88621cd39418f6e6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_tax" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid, "code" character varying(60) NOT NULL, "name" character varying(255) NOT NULL, "rate" numeric(26,4) NOT NULL, "valid_from" date, "valid_to" date, "description" character varying(1000), "mapping_pms_tax_code" character varying(100), "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_ed8e7e4064504744029aeb09f09" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6a289696f145e4fe3af36e5218" ON "hotel_tax" ("mapping_pms_tax_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b9f5c711161636067016c77288" ON "hotel_tax" ("valid_to") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_62cf1dbb258545f619d3452137" ON "hotel_tax" ("valid_from") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1bee37dba99d88f23809c331f0" ON "hotel_tax" ("is_default") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c1058b4a3ef72c9a94efa1c046" ON "hotel_tax" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5867bfeb7fa59b4243bfc6d904" ON "hotel_tax" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_tax_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid, "service_code" character varying(60) NOT NULL, "service_type" character varying(255) NOT NULL, "tax_code" character varying NOT NULL, "description" character varying(1000), CONSTRAINT "PK_377084a2ba2e374c08c61d3ad5f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b605e29a467b40cfde5448d71" ON "hotel_tax_setting" ("hotel_id", "service_type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1e1f9d33f4eea631c05c9484ee" ON "hotel_tax_setting" ("hotel_id", "service_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2f8700121ad6a0d94411f7cd53" ON "hotel_tax_setting" ("tax_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de1626a3bec00dac0eb2e6c894" ON "hotel_tax_setting" ("service_type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_34b622295ad0ecdebd9b57f8d1" ON "hotel_tax_setting" ("service_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f45593cb0d2d6b78dda25033d7" ON "hotel_tax_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "identity_role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255), "code" character varying(255), "permissions" jsonb, "group" character varying(60), CONSTRAINT "PK_2c5540cddf06606b3fb9b02d9f2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "identity_access_control" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "role_id" uuid, "organisation_id" uuid, "hotel_id" uuid, "permissions" character varying array, CONSTRAINT "PK_e202c1e1124fcba9128e8ea89c5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5018d22d587cb852324b8111c3" ON "identity_access_control" ("role_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organisationId_hotelId" ON "identity_access_control" ("organisation_id", "hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "identity_user_access_control" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid, "access_control_id" uuid, CONSTRAINT "PK_da1fb5d1b0f7893bf3ebb84df08" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3702991c7b2217487725255acc" ON "identity_user_access_control" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07b9a4b42b80b1ae7c32dad072" ON "identity_user_access_control" ("access_control_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "identity_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "organisation_id" uuid, "username" character varying(255), "hotel_id" uuid, "email_address" character varying(255), "first_name" character varying(255), "last_name" character varying(255), "status" character varying(60), "last_login_activity" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_1aa7aacaaeb9809730733c98acc" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6fadcae95c42cb16e57d99729e" ON "identity_user" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7b888514aeefc3152f5951e03b" ON "identity_user" ("organisation_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "brand_id" uuid, "icon_image_id" uuid, "email_image_id" uuid, "organisation_id" uuid, "base_currency_id" uuid, "icon_symbol_image_id" uuid, "custom_theme_image_id" uuid, "background_category_image_id" uuid, "name" character varying(255), "code" character varying(60), "status" character varying(61) DEFAULT 'ACTIVE', "email_address" character varying array, "signature" character varying(1000), "sender_name" character varying(100), "sender_email" character varying(100), "time_zone" character varying(60), "tax_setting" character varying(60) DEFAULT 'INCLUSIVE', "service_charge_setting" character varying(60) DEFAULT 'INCLUSIVE', "is_city_tax_included_selling_price" boolean NOT NULL DEFAULT false, "stay_option_background_image_id" uuid, "customize_stay_option_background_image_id" uuid, "stay_option_suggestion_image_id" uuid, "signature_background_image_id" uuid, "country_id" uuid, "lowest_price_image_id" uuid, "preferred_language_code" character varying(10), "initial_setup" boolean DEFAULT false, "phone_code" character varying(15), "phone_number" character varying(60), "room_number" integer, "city" character varying(255), "state" character varying(255), "postal_code" character varying(60), "address" character varying(1000), "address_display" text, "latitude" character varying(255), "longitude" character varying(255), "description" text, "phone" character varying(60), "measure_metric" character varying(60), CONSTRAINT "PK_3a62ac86b369b36c1a297e9ab26" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_4e1924aa31055bed085a00a60b" ON "hotel" ("name") `);
    await queryRunner.query(`CREATE INDEX "IDX_2f91b9aa7761020e0d4e0a9189" ON "hotel" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_43c60de2a6f8d12dd24fe2c17f" ON "hotel" ("code") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_5784dab6b99190f2132c49792a" ON "hotel" ("icon_symbol_image_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b955f96081ce93d1419c885a4" ON "hotel" ("base_currency_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0488d14ba6c73cb2ac2380237c" ON "hotel" ("organisation_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9beaf75bc49ee1bf39969d8013" ON "hotel" ("icon_image_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c99d82207134461ec06c10bc8" ON "hotel" ("brand_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_cancellation_policy" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid, "code" character varying(255), "name" character varying(255), "cancellation_type" character varying(60), "hour_prior" integer, "display_unit" character varying(60), "cancellation_fee_value" numeric(26,4), "cancellation_fee_unit" character varying(60) DEFAULT 'PERCENTAGE', "description" character varying(4000), "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_a58574c7f640d7f4ecb7375848a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e7b4bd9abc75afd37831fdec3a" ON "hotel_cancellation_policy" ("hour_prior") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_25b5c8f5c74c006ab3f165394e" ON "hotel_cancellation_policy" ("is_default") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_139fb0273b73b53e975afb93b9" ON "hotel_cancellation_policy" ("cancellation_type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1fa4f037c44804e2724ee18eae" ON "hotel_cancellation_policy" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_678bc822716e90bde66d9044c2" ON "hotel_cancellation_policy" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_payment_term" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid, "name" character varying(255), "code" character varying(60), "description" character varying(4000), "pay_at_hotel" numeric(26,4), "pay_at_hotel_description" character varying(4000), "pay_on_confirmation" numeric(26,4), "pay_on_confirmation_description" character varying(4000), "is_default" boolean NOT NULL DEFAULT false, "supported_payment_method_codes" text array, CONSTRAINT "PK_f35d2fab39a03ec8ffcc4b0fed5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_335fce84cb8b746608fbdef435" ON "hotel_payment_term" ("hotel_id", "is_default") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ddf276961bfc95f222d5bf507b" ON "hotel_payment_term" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_003efd91a9e23cb846fcc12295" ON "hotel_payment_term" ("is_default") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f0e5138cba783b019234817fd5" ON "hotel_payment_term" ("hotel_id", "code")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b437e8bea2994281f59f61db70" ON "hotel_payment_term" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_cxl_policy_daily" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "cxl_policy_code" text, CONSTRAINT "PK_bf480594e745d2e74ab8d384c78" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c2a2ee0326e10737bd4b9b55e" ON "rate_plan_cxl_policy_daily" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bcc8e5d59d5b146433e41c67a7" ON "rate_plan_cxl_policy_daily" ("hotel_id", "rate_plan_id", "date", "cxl_policy_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_470ea47457db499f914b91779f" ON "rate_plan_cxl_policy_daily" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2ca0e9b1fe9f98f9dd36acf93" ON "rate_plan_cxl_policy_daily" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9fa8fc2dbfdefbe053c7beb372" ON "rate_plan_cxl_policy_daily" ("hotel_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_daily_extra_service" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "extra_service_code_list" text array NOT NULL, "date" text NOT NULL, "rate_plan_id" uuid NOT NULL, CONSTRAINT "PK_c59cd74e607d59db1474900c5f1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6578699b29ba131a3b14613f20" ON "rate_plan_daily_extra_service" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_51368910e1c8d4f423d0725ccb" ON "rate_plan_daily_extra_service" ("hotel_id", "rate_plan_id", "date", "extra_service_code_list") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ed8a846946282f36725c4c89f" ON "rate_plan_daily_extra_service" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8bc2e51c42119f7b547efdfd13" ON "rate_plan_daily_extra_service" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_94c036b555cce04f701424b1c5" ON "rate_plan_daily_extra_service" ("hotel_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_daily_payment_term" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "payment_term_code" text NOT NULL, "date" text NOT NULL, "rate_plan_id" uuid NOT NULL, CONSTRAINT "PK_3ce8dbcadf14ffc9a587021a71b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20fa3dc9b8235fa26f9b189709" ON "rate_plan_daily_payment_term" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_694d7585cb6830d8f1ede345c9" ON "rate_plan_daily_payment_term" ("hotel_id", "rate_plan_id", "date", "payment_term_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a96f143fbaa2b5194a1ea3f9e5" ON "rate_plan_daily_payment_term" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_524fbdadbafbc44717cd5867fe" ON "rate_plan_daily_payment_term" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0372a023eda48d4ed7c0de81fe" ON "rate_plan_daily_payment_term" ("hotel_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_daily_selling_price" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "base_price" numeric(26,4) NOT NULL, "feature_adjustments" numeric(26,4) NOT NULL DEFAULT '0', "rate_plan_adjustments" numeric(26,4) NOT NULL DEFAULT '0', "net_price" numeric(26,4) NOT NULL, "gross_price" numeric(26,4) NOT NULL, "tax_amount" numeric(26,4) NOT NULL DEFAULT '0', "metadata" jsonb, CONSTRAINT "PK_74609adc4c449f0cf416ac53afd" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4ce36b305f6e7125fd32a7944" ON "room_product_daily_selling_price" ("rate_plan_id", "hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf336dd7776d817823f5cc5fb7" ON "room_product_daily_selling_price" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a239a82c5698778e7e5a5bc92e" ON "room_product_daily_selling_price" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0ed616b4c0e9fdaa5877657e8" ON "room_product_daily_selling_price" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_610eacd1ce5eea9304ccc0454d" ON "room_product_daily_selling_price" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8dc428efa848980f3da30d1ea9" ON "room_product_daily_selling_price" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_21ed1faf38fbea882e6d5a5825" ON "room_product_daily_selling_price" ("hotel_id", "room_product_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_pricing_method_detail" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "pricing_method" text NOT NULL, "pricing_method_adjustment_value" numeric(26,4), "pricing_method_adjustment_unit" text, "mapping_room_product_id" text, "target_rate_plan_id" uuid, "target_room_product_id" uuid, "pms_rate_plan_code" text, CONSTRAINT "PK_94d5af5fabeaf98791067f4fa36" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d224b4df2ecdf56d438cbf563" ON "room_product_pricing_method_detail" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4c3cfa85a14e8a1132dd38fb4" ON "room_product_pricing_method_detail" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_712ff575d27a61deb0c21fc274" ON "room_product_pricing_method_detail" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff0d898348f15f2215e620a015" ON "room_product_pricing_method_detail" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1e21259f3cf1c23c2d410dd8bc" ON "room_product_pricing_method_detail" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f3a638ea8b596181da3586b3ea" ON "room_product_pricing_method_detail" ("hotel_id", "room_product_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_retail_category_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_retail_category_id" uuid NOT NULL, "language_code" text NOT NULL, "name" text NOT NULL, CONSTRAINT "PK_f192c4707f28d75281fdb8be9c2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3e7709a8e3117c5ae3c348b93" ON "hotel_retail_category_translation" ("hotel_retail_category_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_retail_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid NOT NULL, "image_url" text, "code" text NOT NULL, "name" text NOT NULL, "category_type" text, "display_sequence" integer, "price_weight" integer, CONSTRAINT "PK_e9f1fea190c9e9398b95820bde6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc24100cb97a00daa984f51e2d" ON "hotel_retail_category" ("hotel_id", "category_type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b47c106cd5df3a464302ba02f6" ON "hotel_retail_category" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1440d928138855e190d98caa24" ON "hotel_retail_category" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_retail_feature_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_retail_feature_id" uuid NOT NULL, "language_code" text NOT NULL, "name" text, "description" text, "measurement_unit" text, CONSTRAINT "PK_d0f7bbaab1e7e9bee4ee10bcb07" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_17ed681d41fd83ec7738a8c9fb" ON "hotel_retail_feature_translation" ("hotel_retail_feature_id", "language_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef6197736df38c8a8d11ef7262" ON "hotel_retail_feature_translation" ("hotel_retail_feature_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_feature_daily_rate" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "rate_plan_id" uuid NOT NULL, "feature_id" uuid NOT NULL, "rate" numeric(26,4) NOT NULL, "date" text NOT NULL, CONSTRAINT "PK_cfb0bef72c14d9b35f982525a61" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8745debfe6a51661391796e46e" ON "rate_plan_feature_daily_rate" ("rate_plan_id", "feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8724c985e6489230d39925a7b6" ON "rate_plan_feature_daily_rate" ("feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1d952ccbb689843f42dc38a17b" ON "rate_plan_feature_daily_rate" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d2600667c53853920efafd4ef0" ON "rate_plan_feature_daily_rate" ("rate_plan_id", "date", "feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3240a3840f5ca17da4453fc847" ON "rate_plan_feature_daily_rate" ("date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2819ae635d83f6f4a5f79e88c2" ON "rate_plan_feature_daily_rate" ("rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_unit_retail_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_unit_id" uuid NOT NULL, "retail_feature_id" uuid NOT NULL, "quantity" integer, CONSTRAINT "PK_db06f061378648dd17119978645" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a94d191c5e9ce191719431b04d" ON "room_unit_retail_feature" ("retail_feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2206d38c3b77af96a635fd53f7" ON "room_unit_retail_feature" ("room_unit_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d11739d837129a5583e8ea98b1" ON "room_unit_retail_feature" ("hotel_id", "retail_feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d1b436c0ec790b5300ee5b119" ON "room_unit_retail_feature" ("hotel_id", "room_unit_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4c0948945d5308eed037aa920" ON "room_unit_retail_feature" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "event_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "image_id" uuid, "name" character varying(255), CONSTRAINT "PK_697909a55bde1b28a90560f3ae2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d2c138089f45f7c3fa916ffb68" ON "event_category" ("name") `
    );
    await queryRunner.query(
      `CREATE TABLE "event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid NOT NULL, "category_id" uuid NOT NULL, "labels" jsonb, "name" character varying(255) NOT NULL, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "location" character varying(255), "note" text, "is_visible" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c69e7e727e0915c693bd131e70" ON "event" ("is_visible") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fb931d7d954ab53421bbd19ad3" ON "event" ("end_date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d225d2181fcfcebdfd7ac5365" ON "event" ("start_date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_697909a55bde1b28a90560f3ae" ON "event" ("category_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4b233dc2113aad9361eb41800" ON "event" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "event_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "event_id" uuid, "hotel_retail_feature_id" uuid, CONSTRAINT "PK_ee15cf47f87f90ec495e8dff270" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6fa5717e71fa6c79fd335cd99d" ON "event_feature" ("hotel_retail_feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_da4f31b4a66052e22a42b1fc31" ON "event_feature" ("event_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_retail_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "base_rate" numeric(10,2), "base_weight" double precision, "children_suitability" boolean, "adults_suitability" text, "description" text, "short_description" text, "display_sequence" integer, "mapping_feature_code" character varying, "is_visible" boolean DEFAULT true, "status" text DEFAULT 'ACTIVE', "type" text, "travel_tag" text array, "occasion" text array, "is_multi_bedroom" boolean, "is_suggested_price" boolean, "measurement_unit" character varying, "image_url" text, "hotel_retail_category_id" uuid NOT NULL, CONSTRAINT "PK_e9cb67fa81a960851e0ced6bccf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aee1dc6d4e9ecd6a01a56ff04b" ON "hotel_retail_feature" ("hotel_retail_category_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_retail_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "quantity" integer, "retail_feature_id" uuid NOT NULL, CONSTRAINT "PK_df1a7a5aa5fff448338754e844b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73ef18e60dce206c5323de417b" ON "room_product_retail_feature" ("retail_feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2f7d1c21ccc69ce676cf1e2a2" ON "room_product_retail_feature" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e1541e2275c04abe58d812c69" ON "room_product_retail_feature" ("hotel_id", "retail_feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04b0a8214b0830250c0d75ea2f" ON "room_product_retail_feature" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a7db9bcf10c0d957cf6250d5f" ON "room_product_retail_feature" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_feature_rate_adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "feature_id" uuid NOT NULL, "room_product_rate_plan_id" uuid NOT NULL, "rate_adjustment" numeric(26,4) NOT NULL, "date" text NOT NULL, "rate_original" numeric(26,4) NOT NULL, CONSTRAINT "PK_0145186eaa6fbf86d521975f2e3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d3b8990a314fd25da88ee693f" ON "room_product_feature_rate_adjustment" ("feature_id", "room_product_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_609106eb9a329944d64d55276b" ON "room_product_feature_rate_adjustment" ("room_product_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cdb0088e905f3e833e1e4b9de3" ON "room_product_feature_rate_adjustment" ("feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_389e832522ba0a76725f3ff76b" ON "room_product_feature_rate_adjustment" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2d7a82d5cc423053cf6e49559" ON "room_product_feature_rate_adjustment" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0955cecb5480cd68c7da0905f7" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7162cee4a2aa6575a2b77e21aa" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_id", "feature_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8049e5f2bb494f6747757d6a01" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_id", "feature_id", "room_product_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de4db71aa3cdb5df120ed0dd30" ON "room_product_feature_rate_adjustment" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5cc961448cccf3e8657c255bf5" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_385bb3686a13828eeedbbfff3f" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_id", "feature_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_566673a6ae91af233f360ccde8" ON "room_product_feature_rate_adjustment" ("hotel_id", "room_product_id", "feature_id", "room_product_rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_rate_plan_extra_occupancy_rate_adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_rate_plan_id" uuid NOT NULL, "extra_people" integer NOT NULL, "extra_rate" numeric(26,4) NOT NULL, "date" text NOT NULL, CONSTRAINT "PK_8c4ade5047cbd54a34369fb36ef" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4852ba262dcd91cd2c1bafeff" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21eb0dfe45d1fd44b8dc44aec2" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("extra_people") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d79a75c4405c7690fd112813a6" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("room_product_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4ebf173c79405377cf2ce185ed" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "extra_people", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f51f155fc4dc3b5eb1c4f01fd6" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "room_product_rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fbb206c1c427d1d17fa03ed5c4" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "room_product_rate_plan_id", "extra_people") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2b05190e2e3135f6e4a14887d8" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7de0e87f8dd561cf29ea27c279" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "extra_people") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a2e7a185e07ac230f5ab323d6" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "room_product_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8b0d93777050fa31558cabe004" ON "room_product_rate_plan_extra_occupancy_rate_adjustment" ("hotel_id", "room_product_rate_plan_id", "extra_people", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_rate_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "name" text NOT NULL, "code" character varying NOT NULL, "guarantee_type" text NOT NULL DEFAULT 'CREDIT_CARD', "cancellation_type" text NOT NULL DEFAULT 'FLEXIBLE', "total_base_rate" numeric(26,4), "is_sellable" boolean NOT NULL DEFAULT true, "configurator_setting" jsonb, CONSTRAINT "PK_3264ab7ac9a8d5e20697544d801" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a5fb21eec0d495abd24aae1e9" ON "room_product_rate_plan" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_391fd73aaad1de7a77076c18c9" ON "room_product_rate_plan" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2271360f67fd324dc215225f96" ON "room_product_rate_plan" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4ecf837d11cd84a19d83019a5f" ON "room_product_rate_plan" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4cf360b40751175f820cf2b216" ON "room_product_rate_plan" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6fb58555db31a26747d959fd49" ON "room_product_rate_plan" ("hotel_id", "room_product_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_rate_plan_availability_adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_rate_plan_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "is_sellable" boolean NOT NULL, CONSTRAINT "PK_1c2ae37e65af1d0fae3fab3ee9f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_641a1c16b14d9dfe6e49390e90" ON "room_product_rate_plan_availability_adjustment" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1cdb038333773cfc57765b0fb4" ON "room_product_rate_plan_availability_adjustment" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb471aedcdb446f71ef9ded3b6" ON "room_product_rate_plan_availability_adjustment" ("room_product_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6f81e2da6923492dc7acf5784" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_caf1cc9a78a0cfbd12931b8deb" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "room_product_rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ac972a1c7647be8638e8dd54c" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "room_product_rate_plan_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_325fd996a5c4bc0a0ac8dea072" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7b269e189b0fa7076dcc52c37" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_079845f882dda8ef731ade9786" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "room_product_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7eaf5c9f32f21ce72882cd01af" ON "room_product_rate_plan_availability_adjustment" ("hotel_id", "room_product_rate_plan_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_daily_adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "adjustment_value" numeric(26,4), "adjustment_type" text DEFAULT 'FIXED', "day_of_week" text array DEFAULT '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}', CONSTRAINT "PK_26a0b5f6c30fd92f3ae028ee47e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d6495e0977334c4d1c28abbe5" ON "rate_plan_daily_adjustment" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88467d040abd37e025a28f17bf" ON "rate_plan_daily_adjustment" ("hotel_id", "rate_plan_id", "date", "day_of_week") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_553612cadbc5aeb0bd8f829746" ON "rate_plan_daily_adjustment" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_347d16480ac7b7713353a871b9" ON "rate_plan_daily_adjustment" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1facd0fde06685f780c2758828" ON "rate_plan_daily_adjustment" ("hotel_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_daily_sellability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "distribution_channel" text NOT NULL, "is_sellable" boolean NOT NULL, "date" text NOT NULL, CONSTRAINT "PK_44171bedfdad1746e6c154a250f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_84288073e3df2bf91700513228" ON "rate_plan_daily_sellability" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e1bcc4ceb5e442452187175b17" ON "rate_plan_daily_sellability" ("hotel_id", "rate_plan_id", "date", "distribution_channel") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20d3e36fbcfd21f3abb2b8a033" ON "rate_plan_daily_sellability" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd7b0cb71db9c3391518e2d2a1" ON "rate_plan_daily_sellability" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6e55d2f017b91225ab56cf915" ON "rate_plan_daily_sellability" ("hotel_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(`CREATE TABLE "rate_plan_derived_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "derived_rate_plan_id" uuid NOT NULL, "follow_daily_payment_term" boolean NOT NULL DEFAULT false, "follow_daily_cxl_policy" boolean NOT NULL DEFAULT false, "follow_daily_included_amenity" boolean NOT NULL DEFAULT false, "follow_daily_room_product_availability" boolean NOT NULL DEFAULT false, "follow_daily_restriction" boolean NOT NULL DEFAULT false, "inherited_restriction_fields" character varying array DEFAULT ARRAY[
      'minLength',
      'maxLength',
      'minAdv',
      'maxAdv',
      'minLosThrough',
      'maxReservationCount'
    ]::varchar[], CONSTRAINT "REL_89c9ed76312fed9fad9f5f0df9" UNIQUE ("rate_plan_id"), CONSTRAINT "PK_932029839f4fccb92d3ee2a6d4b" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE INDEX "IDX_3b852e505cc20032696c4fd635" ON "rate_plan_derived_setting" ("hotel_id", "derived_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_01beeadedebb419d7ecc49903c" ON "rate_plan_derived_setting" ("hotel_id", "rate_plan_id", "derived_rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_76cf0e6c1d2a7bce3a4e980430" ON "rate_plan_derived_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_89c9ed76312fed9fad9f5f0df9" ON "rate_plan_derived_setting" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a90bbc9221736f02c59e3a78b" ON "rate_plan_derived_setting" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_payment_settlement_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "mode" text NOT NULL, CONSTRAINT "PK_2904da32d4fb34afc295f914bb7" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41f6644e44d6078a0697ec2429" ON "rate_plan_payment_settlement_setting" ("hotel_id", "mode") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f34cca675904f5844de71c928" ON "rate_plan_payment_settlement_setting" ("hotel_id", "rate_plan_id", "mode") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9191ef65bf5cffaf2ca999d86a" ON "rate_plan_payment_settlement_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5e6fe528c7733a8848079072d" ON "rate_plan_payment_settlement_setting" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9a8ecd30d674494ae852d2939d" ON "rate_plan_payment_settlement_setting" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_payment_term_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "hotel_payment_term_id" character varying(36) NOT NULL, "supported_payment_method_codes" text array, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_963c0934603859f8e4bccf82f5b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_564804f6650fd41e719446a4ce" ON "rate_plan_payment_term_setting" ("hotel_id", "supported_payment_method_codes") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2f28eb0ead299b6f9e45b16a9" ON "rate_plan_payment_term_setting" ("hotel_id", "rate_plan_id", "hotel_payment_term_id", "supported_payment_method_codes") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_30599e3a91e9c9dca6f4352640" ON "rate_plan_payment_term_setting" ("hotel_id", "hotel_payment_term_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dcd5a5de6b8b292761a4559787" ON "rate_plan_payment_term_setting" ("hotel_id", "rate_plan_id", "hotel_payment_term_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5bb60b7b97301777b6eaa8b6b7" ON "rate_plan_payment_term_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc13c4e50407b8861f5eac5f72" ON "rate_plan_payment_term_setting" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c19fa6e65f749598a499d8bcd3" ON "rate_plan_payment_term_setting" ("hotel_id", "rate_plan_id", "is_default") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e13a7620d56aeb1419a039f2a4" ON "rate_plan_payment_term_setting" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_sellability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "distribution_channel" text array DEFAULT '{GV_SALES_ENGINE,GV_VOICE}', CONSTRAINT "PK_8bd29cf77410b2eb6b2687e7eff" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a7f7290ad56626b34e27880e9" ON "rate_plan_sellability" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ae1a5fc367265c2db3d8ed1fc4" ON "rate_plan_sellability" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7c586f1c9ff36c934be5df344" ON "rate_plan_sellability" ("hotel_id", "rate_plan_id", "distribution_channel") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "rate_plan_id" uuid NOT NULL, "hotel_id" uuid NOT NULL, "language_code" text NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "PK_c2b86c2aa665da77568035838f7" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c139d22de77e61887898220909" ON "rate_plan_translation" ("hotel_id", "language_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_950d382a62656aac2bcb203672" ON "rate_plan_translation" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_22b162fcc7c3d0ab3418fb5a93" ON "rate_plan_translation" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c57c620476e2f834dc85f1e6ef" ON "rate_plan_translation" ("hotel_id", "rate_plan_id", "language_code") `
    );
    await queryRunner.query(
      `CREATE TABLE "rate_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid NOT NULL, "name" text NOT NULL, "code" text NOT NULL, "pricing_methodology" text DEFAULT 'FEATURE_BASED_PRICING', "hour_prior" integer DEFAULT '0', "display_unit" text DEFAULT 'DAY', "cancellation_fee_value" numeric(26,4), "cancellation_fee_unit" text DEFAULT 'PERCENTAGE', "hotel_cxl_policy_code" character varying, "payment_term_code" character varying, "pay_at_hotel" numeric(26,4), "pay_on_confirmation" numeric(26,4), "description" text, "rounding_mode" text DEFAULT 'NO_ROUNDING', "status" text DEFAULT 'ACTIVE', "pms_mapping_rate_plan_code" text, "type" text DEFAULT 'PUBLIC', "promo_codes" text array, "is_primary" boolean DEFAULT false, "distribution_channel" text array DEFAULT '{GV_SALES_ENGINE,GV_VOICE}', "rfc_attribute_mode" boolean DEFAULT false, "mrfc_positioning_mode" boolean DEFAULT false, "hotel_extras_code_list" text, "adjustment_value" numeric(26,4), "adjustment_unit" text DEFAULT 'FIXED', "selling_strategy_type" text DEFAULT 'DEFAULT', "market_segment_id" text, CONSTRAINT "UQ_da9a96d1b21dba2c14090e80296" UNIQUE ("hotel_id", "code"), CONSTRAINT "PK_acdb1c7dcd4a8195e835309cd94" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_99e5a4bafa8698bfebf4f99eef" ON "rate_plan" ("hotel_id", "type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_25f449d5fd8c1764f9d74d9295" ON "rate_plan" ("hotel_id", "distribution_channel") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1207cd2eafa6fbe35773cc815" ON "rate_plan" ("hotel_id", "status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1675421cf163a792b608ac5a9c" ON "rate_plan" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_da9a96d1b21dba2c14090e8029" ON "rate_plan" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_daily_base_price" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "rate_plan_id" uuid NOT NULL, "date" text NOT NULL, "feature_base_price" numeric(26,4) NOT NULL, "feature_price_adjustment" numeric(26,4) NOT NULL, "base_price" numeric(26,4) NOT NULL, CONSTRAINT "PK_3bcc4b72903ca63dfc4727f9918" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1300d464eb8b042b6c11e43cc0" ON "room_product_daily_base_price" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_363c1a2da12bb063ddd047be88" ON "room_product_daily_base_price" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73928e95be083faea567541679" ON "room_product_daily_base_price" ("hotel_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b43dd61beb17c18633470d2507" ON "room_product_daily_base_price" ("hotel_id", "room_product_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b098e66648cc7d5af57beba545" ON "room_product_daily_base_price" ("hotel_id", "room_product_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea4771448403c9c86cb4fb462a" ON "room_product_daily_base_price" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3885d55ee6f2335c153a63ff89" ON "room_product_daily_base_price" ("hotel_id", "rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8836abd7b333bae6bf394e597" ON "room_product_daily_base_price" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dec7a9de82d094d847e8a95394" ON "room_product_daily_base_price" ("hotel_id", "room_product_id", "rate_plan_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_extra_occupancy_rate" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "hotel_id" uuid NOT NULL, "extra_people" integer, "extra_rate" numeric(26,4), CONSTRAINT "PK_7f3b2b04bafe3e7a28eefcdeac6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0775bee087b634c4709b89ab46" ON "room_product_extra_occupancy_rate" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6fd851f8ffbed21b275f45e52a" ON "room_product_extra_occupancy_rate" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d842b20877ea25265861924345" ON "room_product_extra_occupancy_rate" ("hotel_id", "room_product_id", "extra_people", "extra_rate") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd6e36537b931dbf7b22a6d0b5" ON "room_product_extra_occupancy_rate" ("hotel_id", "extra_people") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d96b756d865b9835b2d156fd4" ON "room_product_extra_occupancy_rate" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b9d9696d383555299b75eb3a09" ON "room_product_extra_occupancy_rate" ("hotel_id", "room_product_id", "extra_people") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "hotel_id" uuid, "description" text, "image_url" text, "sequence" integer, CONSTRAINT "PK_cab23f7ddc241fcd46579b4df48" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_31006b232152c4af6470b1be8b" ON "room_product_image" ("room_product_id", "image_url") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_mapping_pms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "hotel_id" uuid NOT NULL, "room_product_mapping_pms_code" character varying, CONSTRAINT "PK_5c70781795f6fca67a2e60e6a13" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ab2847d1f1262d30871ead02b" ON "room_product_mapping_pms" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_933574ddcad8acad7b8a274c73" ON "room_product_mapping_pms" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_mapping" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "related_room_product_id" uuid NOT NULL, CONSTRAINT "PK_c5c3f941e75abbbd26ffd6baabf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_544b2a40ef151b2b0133b872e9" ON "room_product_mapping" ("related_room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d77ec7ca3ab31b89103a1e6ad0" ON "room_product_mapping" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b877db53c31c3182c0951993f" ON "room_product_mapping" ("hotel_id", "related_room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de846e5721e188c809392284bb" ON "room_product_mapping" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_standard_feature_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_standard_feature_id" uuid NOT NULL, "language_code" text NOT NULL, "name" text, "description" text, CONSTRAINT "PK_fd2f008aa1f5a7531f8622b72d9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b6a0d8a1d50ececde31ff69b05" ON "hotel_standard_feature_translation" ("hotel_standard_feature_id", "language_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6703968c6d895021ad54ecceb8" ON "hotel_standard_feature_translation" ("hotel_standard_feature_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_standard_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid NOT NULL, "code" text NOT NULL, "name" text NOT NULL, "description" text, "short_description" text, "mapping_feature_code" text, "display_sequence" integer, "image_url" text, CONSTRAINT "PK_d1a764409d6f5404f3a2b6579b8" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1f5446aef17e07ce56928e15c" ON "hotel_standard_feature" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e7a69906d16a42dbaee392dcc5" ON "hotel_standard_feature" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_standard_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "standard_feature_id" uuid NOT NULL, CONSTRAINT "PK_1b0503b8385a2b387a43cb842d1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_651e87645bb8a7908329c0b5c2" ON "room_product_standard_feature" ("standard_feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0161f12fa933939715f3e4094" ON "room_product_standard_feature" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23f938462cb2ccf1237c6f3f62" ON "room_product_standard_feature" ("hotel_id", "standard_feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9911eb5e8d0bda6323c1ad2fd7" ON "room_product_standard_feature" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d122a786d7a15976c7172cd804" ON "room_product_standard_feature" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_type_mapping" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "room_product_id" uuid NOT NULL, "related_code" text NOT NULL, "channel" text NOT NULL, CONSTRAINT "PK_dbec76df0b51b321bf6d5b5f73a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc74acb8ce5a605535dc65d15b" ON "room_product_type_mapping" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29edcd6224ce0e47252d1e5bba" ON "room_product_type_mapping" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b5c6419d365765e27ef4edce9" ON "room_product_type_mapping" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "deleted_at" TIMESTAMP WITH TIME ZONE, "name" text NOT NULL, "description" text, "hotel_id" uuid, "code" text NOT NULL, "rfc_allocation_setting" text, "status" text, "number_of_bedrooms" integer, "type" text, "extra_adult" integer, "extra_children" integer, "space" numeric, "feature_string" text, "capacity_default" integer, "maximum_adult" integer, "maximum_kid" integer, "maximum_pet" integer, "capacity_extra" integer, "extra_bed_adult" integer, "extra_bed_kid" integer, "travel_tag" text array, "occasion" text array, "is_sellable" boolean, "distribution_channel" text array, "base_price_mode" text, "is_locked_unit" boolean DEFAULT false, CONSTRAINT "PK_fe956f8460185e95126c49d941b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90db9b15a693fbfebab1629e6e" ON "room_product" ("hotel_id", "type", "status", "maximum_adult", "maximum_kid", "maximum_pet") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e038dcd2cfb656f2e3c71609af" ON "room_product" ("hotel_id", "type", "status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_51da11badc4d52edef9908b169" ON "room_product" ("hotel_id", "distribution_channel") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_46025be46b58eefe5244460fb7" ON "room_product" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_product_assigned_unit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_product_id" uuid NOT NULL, "room_unit_id" uuid NOT NULL, CONSTRAINT "PK_93969e0dde7f80a169f69b831ef" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_038af49e8c2dea0d2b9f05a09a" ON "room_product_assigned_unit" ("room_unit_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_119bdfdc44326900a07fdd9ddb" ON "room_product_assigned_unit" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_097319570a5335d02a206bb989" ON "room_product_assigned_unit" ("room_product_id", "room_unit_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_unit_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "room_unit_id" uuid NOT NULL, "hotel_id" uuid, "date" text, "status" text, CONSTRAINT "PK_5b1752a07caf302d825844db38e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_358e5fbbd1b98a4af83acf4620" ON "room_unit_availability" ("room_unit_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b9c38d6b61694f650a7083a7c" ON "room_unit_availability" ("hotel_id", "room_unit_id", "date", "status") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6756aa034f100ba3be14559fc6" ON "room_unit_availability" ("hotel_id", "room_unit_id", "date") `
    );
    await queryRunner.query(
      `CREATE TABLE "room_unit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "room_number" text, "hotel_id" uuid, "mapping_pms_code" text, "capacity_default" integer, "maximum_adult" integer, "maximum_kid" integer, "capacity_extra" integer, "extra_bed_adult" integer, "extra_bed_kid" integer, "room_floor" text, "text" text, "connecting_room_id" uuid, "number_of_bedrooms" text, "space" numeric, "feature_string" text, "status" text, "is_changed" boolean, CONSTRAINT "PK_3ecf12c3d733b3a99b8db9b42ad" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b3f9963255297d945532880ec6" ON "room_unit" ("hotel_id", "status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_690e396e6484e45b98797203c7" ON "room_unit" ("hotel_id", "mapping_pms_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_02098761a77d8888f65405c792" ON "room_unit" ("hotel_id", "room_number") `
    );
    await queryRunner.query(
      `CREATE TABLE "restriction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "type" text NOT NULL, "from_date" TIMESTAMP WITH TIME ZONE, "to_date" TIMESTAMP WITH TIME ZONE, "weekdays" jsonb, "room_product_ids" uuid array, "rate_plan_ids" text array, "min_length" integer, "max_length" integer, "min_adv" integer, "max_adv" integer, "min_los_through" integer, "max_reservation_count" integer, "metadata" jsonb, "restriction_source" jsonb, CONSTRAINT "PK_3d1ba426bdc66915417ad4ee65e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0baf16153be9a576ce24198949" ON "restriction" ("hotel_id", "type", "from_date", "to_date", "room_product_ids", "rate_plan_ids") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b568a48cf0c03707ed7559791" ON "restriction" ("hotel_id", "type", "from_date", "to_date", "rate_plan_ids") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48794cc99f154a352f716dc8ea" ON "restriction" ("hotel_id", "type", "from_date", "to_date", "room_product_ids") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4496fc35c4b12dc79c5d98b08f" ON "restriction" ("hotel_id", "type", "from_date", "to_date", "weekdays") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6cdb93dd7c4fb79b10f7827e66" ON "restriction" ("hotel_id", "type", "from_date", "to_date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a18a60e2eb043357043ac7ebfc" ON "restriction" ("hotel_id", "from_date", "to_date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bca1eb33761d931204909083d6" ON "restriction" ("hotel_id", "type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d2904c89354d613f61719d9ff" ON "restriction" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_restriction_integration_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid, "room_product_id" uuid, "pms_mapping_code" text NOT NULL, "restriction_entity" text NOT NULL, "restriction_code" text NOT NULL, "mode" text NOT NULL DEFAULT 'NEUTRAL', CONSTRAINT "PK_7f8377fbac32497d13b2720c388" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5a3c20523757e94a3bf69550e" ON "hotel_restriction_integration_setting" ("hotel_id", "rate_plan_id", "room_product_id", "pms_mapping_code", "restriction_entity", "restriction_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_01448a55dd6720088f436a4997" ON "hotel_restriction_integration_setting" ("hotel_id", "room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2998743bba301379b2fca2ad00" ON "hotel_restriction_integration_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2d0a06d98963a2589181175942" ON "hotel_restriction_integration_setting" ("hotel_id", "rate_plan_id", "room_product_id", "pms_mapping_code") `
    );
    await queryRunner.query(
      `CREATE TABLE "translation_i18n_locale" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(500) NOT NULL, "code" character varying(50) NOT NULL, CONSTRAINT "UQ_24798accab6ec79342ec9d4779e" UNIQUE ("code"), CONSTRAINT "PK_2b07585f2a454f1506267477e08" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_locale_code" ON "translation_i18n_locale" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "translation_hotel_language_bundle" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid NOT NULL, "i18n_locale_id" uuid NOT NULL, "paid" boolean DEFAULT false, "is_active" boolean DEFAULT true, CONSTRAINT "PK_644a1ccf1ca02caecb9ecfac88a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_hotel_locale" ON "translation_hotel_language_bundle" ("hotel_id", "i18n_locale_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "fk_locale_id" ON "translation_hotel_language_bundle" ("i18n_locale_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "translation_dynamic_content" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "entity_id" uuid NOT NULL, "hlb_id" uuid NOT NULL, "etc_id" uuid NOT NULL, "attribute" jsonb, CONSTRAINT "PK_90b4bed59e706bff423ddc815ea" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_hlb_etc_entity" ON "translation_dynamic_content" ("hlb_id", "etc_id", "entity_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_hlb_etc" ON "translation_dynamic_content" ("hlb_id", "etc_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "fk_dct_etc_id" ON "translation_dynamic_content" ("etc_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "translation_entity_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(500) NOT NULL, "is_static" boolean DEFAULT false, "code" character varying(255) NOT NULL, "available_attribute_key" text NOT NULL, CONSTRAINT "UQ_eeea55cac0f384c15b7db495976" UNIQUE ("code"), CONSTRAINT "PK_50ad2e9492d21d7c92420e9cd72" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_etc_code" ON "translation_entity_config" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "translation_static_content" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "i18n_locale_id" uuid NOT NULL, "etc_id" uuid NOT NULL, "attribute" jsonb, CONSTRAINT "PK_7211f843a762a25d9455a16e70f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_i18n_locale" ON "translation_static_content" ("i18n_locale_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_i18n_locale_etc" ON "translation_static_content" ("i18n_locale_id", "etc_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "fk_sct_etc_id" ON "translation_static_content" ("etc_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_restriction_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "restriction_entity" text NOT NULL, "restriction_code" text NOT NULL, "mode" text NOT NULL DEFAULT 'NEUTRAL', CONSTRAINT "PK_4bc209f7b4208ce11e8c271845b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a79399683a0589dba3f78e4c95" ON "hotel_restriction_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_34fda2f73b0e7550232b2c688f" ON "hotel_restriction_setting" ("hotel_id", "restriction_entity", "restriction_code") `
    );
    await queryRunner.query(
      `CREATE TABLE "background_job" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(500) NOT NULL, "status" character varying(50) NOT NULL, "input" text, "result" text, "trigger_at" TIMESTAMP WITH TIME ZONE, "stop_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_fed82f6367edf1165d86b784041" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "occ_reference" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "occ_rate" double precision DEFAULT '0', CONSTRAINT "PK_f9a817eb5fedb92ef3acee7d395" PRIMARY KEY ("id", "hotel_id", "date"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a5bde18df75cf57a5a95759ae2" ON "occ_reference" ("hotel_id", "date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_891f46f674ff057ba81ad49728" ON "occ_reference" ("date") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_34b6ee11bc0942c94b68bba1f0" ON "occ_reference" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "mapping_rfc_dynamic_pricing" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid, "rate_plan_id" uuid, "room_product_id" uuid, "mapping_pms_rate_plan_code" character varying(60), CONSTRAINT "PK_33b60ef0238157e766f35cf13c6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c19c8e1b6e7c1dda2ea9c9852" ON "mapping_rfc_dynamic_pricing" ("room_product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2614bd19d6d7e68b7c2baa2602" ON "mapping_rfc_dynamic_pricing" ("rate_plan_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_208bfb79d52efdcaef86120231" ON "mapping_rfc_dynamic_pricing" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "mews_service_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "service_id" character varying NOT NULL, "enterprise_id" character varying NOT NULL, "service_type" character varying NOT NULL, "timezone" character varying NOT NULL, "property_pricing_setting" character varying NOT NULL, CONSTRAINT "PK_cb9a87952cd8861bd2ce1d55c32" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "identity_permission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying, "code" character varying(255), CONSTRAINT "PK_0a2a7f2ce901464d734fef244cc" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "identity_auth0_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid, "auth0_user_id" character varying(255), CONSTRAINT "PK_7d8e40a0e256b5242f911772e92" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cda98165f1d81447afdba0b50c" ON "identity_auth0_user" ("auth0_user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_61f7e57d89d41cdc6e4c1aa9fc" ON "identity_auth0_user" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "organisation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "code" character varying(60), "phoneCode" character varying(15), "phoneNumber" character varying(15), "email_address" jsonb, "city" character varying(60), "state" character varying(60), "country" character varying(60), "postal_code" character varying(60), "address" character varying(250), "initial_setup" boolean, "name" character varying(255), CONSTRAINT "PK_c725ae234ef1b74cce43d2d00c1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d9428f9c8e3052d6617e3aab0e" ON "organisation" ("name") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6a3122daf3cb06cb4f1f87ae64" ON "organisation" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "organisation_widget_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "code" character varying(100) NOT NULL, "organisation_id" uuid NOT NULL, "property_id" uuid NOT NULL, "name" character varying(255), "attribute" character varying(255) NOT NULL, "value" character varying(2000) NOT NULL, CONSTRAINT "PK_a22831f3fc9f2557218a2766ac1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c9a285192813473199c0efc740" ON "organisation_widget_config" ("organisation_id", "property_id", "code", "attribute") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_51861fc7f98a193ba46ed095cb" ON "organisation_widget_config" ("property_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a984ee31a3af07214074a4430" ON "organisation_widget_config" ("organisation_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d18d3ca2b6f79d9fa4304a7339" ON "organisation_widget_config" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "mapping_retail_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_retail_feature_id" uuid, "mapping_retail_feature_code" character varying(255), CONSTRAINT "PK_d1280c7630dd39b64c8adfe168b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1ddd207fe318c38960c15db9ad" ON "mapping_retail_feature" ("hotel_retail_feature_id", "mapping_retail_feature_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_829e3a152b5759f946bfec00cf" ON "mapping_retail_feature" ("mapping_retail_feature_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38ae9466536231be8e30ae429d" ON "mapping_retail_feature" ("hotel_retail_feature_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "mapping_standard_feature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_standard_feature_id" uuid, "mapping_standard_feature_code" character varying(255), CONSTRAINT "PK_97bf475a355b03a10ba271ff306" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a15736374c1e4c546689a1b95e" ON "mapping_standard_feature" ("hotel_standard_feature_id", "mapping_standard_feature_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bee52329b7c82e9a846ad1ed86" ON "mapping_standard_feature" ("mapping_standard_feature_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee50d591b0c7cfeb5fed2e668f" ON "mapping_standard_feature" ("hotel_standard_feature_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "connector" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "organisation_id" uuid NOT NULL, "hotel_id" uuid, "refresh_token" text, "connector_type" character varying(50) NOT NULL, "metadata" jsonb, "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "account_id" character varying(10), CONSTRAINT "PK_6c5a19153f8f3074f2836a2b082" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef85c1d8cd74bda7eb1803b3bc" ON "connector" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ab4ad3877d6740860ffa3103a" ON "connector" ("connector_type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe73168c9ff01a8b66a88fde59" ON "connector" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f73543ec4fbaca6074bfd83b3" ON "connector" ("organisation_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "mapping_pms_hotel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid, "mapping_hotel_code" character varying(60), "connector_id" uuid, CONSTRAINT "PK_3eeb9e9436e755a924965e82378" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_049d569de932c639d33ad1169c" ON "mapping_pms_hotel" ("hotel_id", "connector_id", "mapping_hotel_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_35903cc2c38449deba0ba1926c" ON "mapping_pms_hotel" ("connector_id", "mapping_hotel_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_778a0decf3e30163366a230c68" ON "mapping_pms_hotel" ("hotel_id", "mapping_hotel_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e21db383b99af09661aeb7a432" ON "mapping_pms_hotel" ("hotel_id", "connector_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7fd7ce8ba9392cd0f15747ae66" ON "mapping_pms_hotel" ("mapping_hotel_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e1aa3b6f8f6359f9d7fa7beb1" ON "mapping_pms_hotel" ("connector_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f151dc92eef40956a4d9880929" ON "mapping_pms_hotel" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_template_email" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "code" character varying(60) NOT NULL, "name" character varying(100), "language_code" character varying(60), "template_id" character varying(60) NOT NULL, "opening_section" text, "opening_section_for_returning_guest" text, "closing_section" text, "signature" text, "is_default" boolean DEFAULT false, "title" text, "is_enable" boolean DEFAULT true, CONSTRAINT "PK_d4bdefb0ca72c8135952c7a21fa" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ef9474f9d3534f904ca0930681" ON "hotel_template_email" ("hotel_id", "code", "language_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7df39267db17529bbbf46be7d8" ON "hotel_template_email" ("hotel_id", "language_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4badcf7a22ea89ef211bcb1907" ON "hotel_template_email" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a54484f412c59d9713a83548b" ON "hotel_template_email" ("is_enable") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e31c10f6f40e97d041fc7d96ff" ON "hotel_template_email" ("is_default") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d2ee7c57eff93a47ed8c4eed7b" ON "hotel_template_email" ("template_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9add8d810a37af0a9f5576eb6b" ON "hotel_template_email" ("language_code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ce41e1617066084ffcf09b3a77" ON "hotel_template_email" ("code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f6f1a591523b349490897c8ec4" ON "hotel_template_email" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_payment_mode" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "code" character varying(60) NOT NULL, "name" character varying(100), "description" text, CONSTRAINT "PK_214c1a32bff62e43960429da242" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cc2229f2dd91199af930c0d374" ON "hotel_payment_mode" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b369836b49309eb6f694603be9" ON "hotel_payment_mode" ("code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_598fc4de3fffd31b9e142efc2a" ON "hotel_payment_mode" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_payment_method_setting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid, "global_payment_method_id" uuid, "global_payment_provider_id" uuid, "metadata" jsonb, "status" character varying(60), CONSTRAINT "PK_bb81933e958ee74ca73dcac24af" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8bcd36f44d11ac990f0771a037" ON "hotel_payment_method_setting" ("global_payment_provider_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32ab18f5fe328d55b61e66ea4f" ON "hotel_payment_method_setting" ("global_payment_method_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70b662da34c076f611873f663f" ON "hotel_payment_method_setting" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_payment_account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid, "payment_id" character varying(255), "origin" character varying(60), "payment_api_key" character varying(1000), "merchant" character varying(255), "live_endpoint_url_prefix" character varying(255), "environment" character varying(40), "type" character varying(60), "sub_merchant_id" character varying(60), "fee_fixed_amount" numeric(26,4), "fee_percentage" numeric(26,4), CONSTRAINT "PK_5eed78107240daa4225ce6cf67e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a1a335bf91669136d15fb7b0b0" ON "hotel_payment_account" ("hotel_id", "origin") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1846ada735c3ae36695393cb62" ON "hotel_payment_account" ("hotel_id", "type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97ecb3c611733b07ecc474a45a" ON "hotel_payment_account" ("sub_merchant_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad4e8dc1db08dab04aa7129098" ON "hotel_payment_account" ("environment") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_15816a7536b74302e1646419b0" ON "hotel_payment_account" ("type") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27a8bafcabd2cf32cd133507bc" ON "hotel_payment_account" ("origin") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23b032347d7ca43ae443a779a3" ON "hotel_payment_account" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_market_segment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(30) NOT NULL, "description" character varying(40), "status" character varying(10) NOT NULL DEFAULT 'INACTIVE', CONSTRAINT "PK_e0b262c1d73a3e85aea717139ba" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b998197132531d817828ba5697" ON "hotel_market_segment" ("hotel_id", "code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_df1c77500fbfc37047221cca5b" ON "hotel_market_segment" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a2a14695c8f05f752507c128d" ON "hotel_market_segment" ("code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13c54a2e7001c1a796dd7caacd" ON "hotel_market_segment" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_city_tax_age_group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid, "hotel_city_tax_id" uuid, "from_age" integer, "to_age" integer, "value" numeric, CONSTRAINT "PK_808fe8bd00859315d570c089485" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7dc236ba8f5a7121fa61dc8336" ON "hotel_city_tax_age_group" ("hotel_city_tax_id", "from_age", "to_age") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2eb5dc8ebf8fcd031b70443c1" ON "hotel_city_tax_age_group" ("to_age") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d18c3dbcb2b3d98be7d56069e7" ON "hotel_city_tax_age_group" ("from_age") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6778b1c98bafb068ab38c631e1" ON "hotel_city_tax_age_group" ("hotel_city_tax_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_848a397353c065d4074630dd62" ON "hotel_city_tax_age_group" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "hotel_city_tax" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "translations" jsonb NOT NULL DEFAULT '[]', "hotel_id" uuid, "code" character varying(60), "name" character varying(255), "unit" character varying(60), "value" numeric, "charge_method" character varying(100), "valid_from" date, "valid_to" date, "status" character varying(60), "description" character varying(1000), "mapping_pms_city_tax_code" character varying(100), CONSTRAINT "PK_54faacfee0be3d125a535d59266" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_815b7c4383423766e18549103c" ON "hotel_city_tax" ("hotel_id", "status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe1cc633576c649cdc3fe10203" ON "hotel_city_tax" ("valid_to") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_974b5d084b02a053b242c2e163" ON "hotel_city_tax" ("valid_from") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb28a5f854991a87e97a35fa0d" ON "hotel_city_tax" ("charge_method") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1dc40f414b37d22ff81891874" ON "hotel_city_tax" ("unit") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90f562d06d8ce917a69b046893" ON "hotel_city_tax" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee414fed590040c42b159e4096" ON "hotel_city_tax" ("code") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4502df59cfba6093a33477fd16" ON "hotel_city_tax" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "global_payment_provider" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "code" character varying(60), "name" character varying(255), "description" text, "image_url" text, CONSTRAINT "PK_e1d2893a7a6a47e1f5639d92aa9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9c1bda1595fe2ba9bf8997d7d4" ON "global_payment_provider" ("name") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b43b1782073d0ef158be83b58" ON "global_payment_provider" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "flyway_schema_history" ("installed_rank" integer NOT NULL, "version" integer, "description" character varying(200) NOT NULL, "type" character varying(20) NOT NULL, "script" character varying(1000) NOT NULL, "checksum" integer, "installed_by" character varying(100) NOT NULL, "installed_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "execution_time" integer NOT NULL, "success" boolean NOT NULL, CONSTRAINT "PK_b944906822a82b6fa0134d09980" PRIMARY KEY ("installed_rank"))`
    );
    await queryRunner.query(
      `CREATE TABLE "event_label" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "name" character varying(255) NOT NULL, CONSTRAINT "PK_b951570b91c509f6a494fe068d0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "brand" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "name" character varying(255) NOT NULL, CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "currency_rate" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "base_currency_id" uuid, "exchange_currency_id" uuid, "rate" numeric, CONSTRAINT "PK_a92517ae58f0f116bc0f792f878" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7ce6c081433053e4fdbe24205" ON "currency_rate" ("exchange_currency_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09d3d2a7fb25844ef480485f0e" ON "currency_rate" ("base_currency_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "supported_reservation_source" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "PK_89e5dc762aa6ed47afb4c9a1472" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "reservation_related_mrfc" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid NOT NULL, "reservation_id" uuid NOT NULL, "mrfc_id" uuid NOT NULL, "mrfc_base_amount" numeric(26,4), "mrfc_gross_amount" numeric(26,4), "reservation_gross_amount" numeric(26,4) DEFAULT '0.0000', "reservation_gross_accommodation_amount" numeric(26,4) DEFAULT '0.0000', "reservation_gross_included_service_amount" numeric(26,4) DEFAULT '0.0000', "reservation_gross_service_amount" numeric(26,4) DEFAULT '0.0000', "mrfc_gross_accommodation_amount" numeric(26,4) DEFAULT '0.0000', CONSTRAINT "PK_be7429face9ad19f663c8b46db4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1feb1c2e5cc41b8691c330a654" ON "reservation_related_mrfc" ("hotel_id", "reservation_id", "mrfc_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d0b90ee63435f1b0e8f94b4d0" ON "reservation_related_mrfc" ("hotel_id", "mrfc_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67d53524b9143f8f32f28fb320" ON "reservation_related_mrfc" ("hotel_id", "reservation_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41a30b479acc4391493d808d73" ON "reservation_related_mrfc" ("hotel_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2b0d8573d9696b22b0856b2e89" ON "reservation_related_mrfc" ("mrfc_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d2350de2114ace0b38b2233b7" ON "reservation_related_mrfc" ("reservation_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "customer_payment_gateway" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "internal_customer_id" uuid, "ref_payment_customer_id" uuid, "ref_payment_method_id" character varying(255), "payment_provider" character varying(60), CONSTRAINT "PK_fdfc54bcdb099d716459d275e10" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "booking_upsell_information" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "deleted_at" TIMESTAMP WITH TIME ZONE, "hotel_id" uuid, "booking_id" uuid, "lowest_price_option_list" text, "lowest_price_total_base_amount" numeric(26,4), "lowest_price_total_tax_amount" numeric(26,4), "lowest_price_total_gross_amount" numeric(26,4), "lowest_price_accommodation_base_amount" numeric(26,4), "lowest_price_accommodation_tax_amount" numeric(26,4), "lowest_price_accommodation_gross_amount" numeric(26,4), "lowest_price_included_service_base_amount" numeric(26,4), "lowest_price_included_service_tax_amount" numeric(26,4), "lowest_price_included_service_gross_amount" numeric(26,4), "lowest_price_service_base_amount" numeric(26,4), "lowest_price_service_tax_amount" numeric(26,4), "lowest_price_service_gross_amount" numeric(26,4), "book_total_base_amount" numeric(26,4), "book_total_tax_amount" numeric(26,4), "book_total_gross_amount" numeric(26,4), "book_accommodation_base_amount" numeric(26,4), "book_accommodation_tax_amount" numeric(26,4), "book_accommodation_gross_amount" numeric(26,4), "book_included_service_base_amount" numeric(26,4), "book_included_service_tax_amount" numeric(26,4), "book_included_service_gross_amount" numeric(26,4), "book_service_base_amount" numeric(26,4), "book_service_tax_amount" numeric(26,4), "book_service_gross_amount" numeric(26,4), "city_tax_amount" numeric(26,4), CONSTRAINT "PK_18e986ea406a05e4e1599dd4c63" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_booking_id" ON "booking_upsell_information" ("booking_id", "deleted_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "apaleo_rate_plan_pms_mapping" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" text, "updated_by" text, "hotel_id" uuid NOT NULL, "rate_plan_id" uuid, "room_product_id" uuid, "mapping_rate_plan_code" character varying(60), CONSTRAINT "PK_7eaaa3bc5b3be946d9f49d77736" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_base_price_setting" ADD CONSTRAINT "FK_e5d36d5fdb299bd40151a50ea04" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" ADD CONSTRAINT "FK_36c62333a804768f70a35604bd5" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_configuration" ADD CONSTRAINT "FK_8e73fed024f8ac0cc26b772f46c" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_transaction" ADD CONSTRAINT "FK_738af3b4cecf067d96346b16d9b" FOREIGN KEY ("currency_id") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_transaction" ADD CONSTRAINT "FK_8ccbe8a0c7faa10fc37e0f12b67" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_transaction" ADD CONSTRAINT "FK_fd5fb0fcb54e87ff08c36664b8e" FOREIGN KEY ("payment_mode") REFERENCES "global_payment_method"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_proposal_setting" ADD CONSTRAINT "FK_e979705ca4be0d87cf822b05d5e" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "booking" ADD CONSTRAINT "FK_4ee97cceb057d5cf2edc0f0ac08" FOREIGN KEY ("booker_id") REFERENCES "guest"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_age_category" ADD CONSTRAINT "FK_ac67645a950182263fea58fc64d" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_amenity_price" ADD CONSTRAINT "FK_e8572aa42516d4cc6fd491c2404" FOREIGN KEY ("hotel_amenity_id") REFERENCES "hotel_amenity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_amenity_price" ADD CONSTRAINT "FK_bf1eada9bc406bb9fc591b96816" FOREIGN KEY ("hotel_age_category_id") REFERENCES "hotel_age_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_extra" ADD CONSTRAINT "FK_b9a81cc6b44958cacf8aac93df2" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_extra" ADD CONSTRAINT "FK_bbaa4075013531bb9a11f276d42" FOREIGN KEY ("extras_id") REFERENCES "hotel_amenity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_extra_service" ADD CONSTRAINT "FK_c3f7becaf7d2a38b6817d3caba3" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_extra_service" ADD CONSTRAINT "FK_66c319caf65484a683308951283" FOREIGN KEY ("extras_id") REFERENCES "hotel_amenity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_amenity" ADD CONSTRAINT "FK_20f36b266666e1391a4c280df48" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_amenity" ADD CONSTRAINT "FK_d5b59d68ceccea6e079ff5dc0c6" FOREIGN KEY ("template_amenity_id") REFERENCES "template_amenity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_amenity_date" ADD CONSTRAINT "FK_cd02fb89f5a4ed2014d04b94aef" FOREIGN KEY ("reservation_amenity_id") REFERENCES "reservation_amenity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_amenity" ADD CONSTRAINT "FK_73cc3fef5f959bfb6296ebbb51a" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_amenity" ADD CONSTRAINT "FK_888c31129a59ad05a4b5942074a" FOREIGN KEY ("hotel_amenity_id") REFERENCES "hotel_amenity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_room" ADD CONSTRAINT "FK_2af62c299d3061019238249bbe4" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_time_slice" ADD CONSTRAINT "FK_27b70912dc9c7e25dffc3c64a4e" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD CONSTRAINT "FK_088d6b9559ef8f981b2d59f1ef2" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD CONSTRAINT "FK_0ff06e6651c1f5773d73d5508be" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD CONSTRAINT "FK_8707374810e5682b6b63165537b" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD CONSTRAINT "FK_faa429ef53db1e6cd4e66b4d4d9" FOREIGN KEY ("primary_guest_id") REFERENCES "guest"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD CONSTRAINT "FK_363ebb59727da92a21a41c73638" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD CONSTRAINT "FK_d0fd5612ba0badf1ecaa03e1f3f" FOREIGN KEY ("hotel_id", "cxl_policy_code") REFERENCES "hotel_cancellation_policy"("hotel_id", "code") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" ADD CONSTRAINT "FK_778aabb1b42cff8c3f766e6a50a" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "guest" ADD CONSTRAINT "FK_ac28d3d5ca8c031eac15c7ab682" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "guest" ADD CONSTRAINT "FK_ccee49c448c6efb0e0d65041d6c" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_tax" ADD CONSTRAINT "FK_5867bfeb7fa59b4243bfc6d9047" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_tax_setting" ADD CONSTRAINT "FK_f45593cb0d2d6b78dda25033d76" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_tax_setting" ADD CONSTRAINT "FK_2f8700121ad6a0d94411f7cd53f" FOREIGN KEY ("hotel_id", "tax_code") REFERENCES "hotel_tax"("hotel_id", "code") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "identity_access_control" ADD CONSTRAINT "FK_5018d22d587cb852324b8111c30" FOREIGN KEY ("role_id") REFERENCES "identity_role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "identity_access_control" ADD CONSTRAINT "FK_0a90203a42870861c647623a953" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "identity_user_access_control" ADD CONSTRAINT "FK_3702991c7b2217487725255acc9" FOREIGN KEY ("user_id") REFERENCES "identity_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "identity_user_access_control" ADD CONSTRAINT "FK_07b9a4b42b80b1ae7c32dad0728" FOREIGN KEY ("access_control_id") REFERENCES "identity_access_control"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "identity_user" ADD CONSTRAINT "FK_6fadcae95c42cb16e57d99729e6" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel" ADD CONSTRAINT "FK_1e6f00a4705b2e9f564d165bf3f" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel" ADD CONSTRAINT "FK_0b955f96081ce93d1419c885a46" FOREIGN KEY ("base_currency_id") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel" ADD CONSTRAINT "FK_9beaf75bc49ee1bf39969d80138" FOREIGN KEY ("icon_image_id") REFERENCES "file_library"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel" ADD CONSTRAINT "FK_49f60fa23861e5e5d77efdb7857" FOREIGN KEY ("email_image_id") REFERENCES "file_library"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_cancellation_policy" ADD CONSTRAINT "FK_1fa4f037c44804e2724ee18eaea" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_payment_term" ADD CONSTRAINT "FK_b437e8bea2994281f59f61db70d" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_cxl_policy_daily" ADD CONSTRAINT "FK_a2ca0e9b1fe9f98f9dd36acf936" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_extra_service" ADD CONSTRAINT "FK_8bc2e51c42119f7b547efdfd133" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_payment_term" ADD CONSTRAINT "FK_524fbdadbafbc44717cd5867fe2" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_selling_price" ADD CONSTRAINT "FK_a239a82c5698778e7e5a5bc92e8" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_selling_price" ADD CONSTRAINT "FK_bf336dd7776d817823f5cc5fb7a" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_pricing_method_detail" ADD CONSTRAINT "FK_e4c3cfa85a14e8a1132dd38fb4a" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_pricing_method_detail" ADD CONSTRAINT "FK_2d224b4df2ecdf56d438cbf563d" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_pricing_method_detail" ADD CONSTRAINT "FK_def6e8b10badbe9b6954a23c78b" FOREIGN KEY ("target_room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_retail_category_translation" ADD CONSTRAINT "FK_e3e7709a8e3117c5ae3c348b93d" FOREIGN KEY ("hotel_retail_category_id") REFERENCES "hotel_retail_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_retail_feature_translation" ADD CONSTRAINT "FK_ef6197736df38c8a8d11ef72623" FOREIGN KEY ("hotel_retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_feature_daily_rate" ADD CONSTRAINT "FK_1d952ccbb689843f42dc38a17b1" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_feature_daily_rate" ADD CONSTRAINT "FK_8724c985e6489230d39925a7b67" FOREIGN KEY ("feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_unit_retail_feature" ADD CONSTRAINT "FK_2206d38c3b77af96a635fd53f7c" FOREIGN KEY ("room_unit_id") REFERENCES "room_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_unit_retail_feature" ADD CONSTRAINT "FK_a94d191c5e9ce191719431b04df" FOREIGN KEY ("retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD CONSTRAINT "FK_e4b233dc2113aad9361eb418003" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD CONSTRAINT "FK_697909a55bde1b28a90560f3ae2" FOREIGN KEY ("category_id") REFERENCES "event_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "event_feature" ADD CONSTRAINT "FK_da4f31b4a66052e22a42b1fc31e" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "event_feature" ADD CONSTRAINT "FK_6fa5717e71fa6c79fd335cd99dc" FOREIGN KEY ("hotel_retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_retail_feature" ADD CONSTRAINT "FK_aee1dc6d4e9ecd6a01a56ff04b0" FOREIGN KEY ("hotel_retail_category_id") REFERENCES "hotel_retail_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_retail_feature" ADD CONSTRAINT "FK_a2f7d1c21ccc69ce676cf1e2a22" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_retail_feature" ADD CONSTRAINT "FK_73ef18e60dce206c5323de417b6" FOREIGN KEY ("retail_feature_id") REFERENCES "hotel_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" ADD CONSTRAINT "FK_c2d7a82d5cc423053cf6e495591" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" ADD CONSTRAINT "FK_609106eb9a329944d64d55276bb" FOREIGN KEY ("room_product_rate_plan_id") REFERENCES "room_product_rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" ADD CONSTRAINT "FK_cdb0088e905f3e833e1e4b9de3a" FOREIGN KEY ("feature_id") REFERENCES "room_product_retail_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_extra_occupancy_rate_adjustment" ADD CONSTRAINT "FK_d79a75c4405c7690fd112813a6c" FOREIGN KEY ("room_product_rate_plan_id") REFERENCES "room_product_rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan" ADD CONSTRAINT "FK_2a5fb21eec0d495abd24aae1e9e" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan" ADD CONSTRAINT "FK_391fd73aaad1de7a77076c18c9e" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_availability_adjustment" ADD CONSTRAINT "FK_bb471aedcdb446f71ef9ded3b6a" FOREIGN KEY ("room_product_rate_plan_id") REFERENCES "room_product_rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_availability_adjustment" ADD CONSTRAINT "FK_1cdb038333773cfc57765b0fb4b" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_adjustment" ADD CONSTRAINT "FK_347d16480ac7b7713353a871b98" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_sellability" ADD CONSTRAINT "FK_cd7b0cb71db9c3391518e2d2a17" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_derived_setting" ADD CONSTRAINT "FK_2e6419a2ca9d71bfc81284bfc78" FOREIGN KEY ("derived_rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_derived_setting" ADD CONSTRAINT "FK_89c9ed76312fed9fad9f5f0df9e" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_payment_settlement_setting" ADD CONSTRAINT "FK_e5e6fe528c7733a8848079072da" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_payment_term_setting" ADD CONSTRAINT "FK_cc13c4e50407b8861f5eac5f72c" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_sellability" ADD CONSTRAINT "FK_b7a88abc60ea19aa79402c69bcd" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_translation" ADD CONSTRAINT "FK_02c2fd8a13904b9be2c5343461c" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan" ADD CONSTRAINT "FK_e24fd35b330026e0a998c10f06c" FOREIGN KEY ("hotel_id", "hotel_cxl_policy_code") REFERENCES "hotel_cancellation_policy"("hotel_id", "code") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan" ADD CONSTRAINT "FK_99247752b796a4cf4bb9626f3a8" FOREIGN KEY ("hotel_id", "payment_term_code") REFERENCES "hotel_payment_term"("hotel_id", "code") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_base_price" ADD CONSTRAINT "FK_363c1a2da12bb063ddd047be88d" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_base_price" ADD CONSTRAINT "FK_1300d464eb8b042b6c11e43cc07" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_extra_occupancy_rate" ADD CONSTRAINT "FK_0775bee087b634c4709b89ab46d" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_image" ADD CONSTRAINT "FK_1a3a34489e095fb57ad642a7a76" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping_pms" ADD CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping" ADD CONSTRAINT "FK_d77ec7ca3ab31b89103a1e6ad06" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping" ADD CONSTRAINT "FK_544b2a40ef151b2b0133b872e93" FOREIGN KEY ("related_room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_standard_feature_translation" ADD CONSTRAINT "FK_6703968c6d895021ad54ecceb81" FOREIGN KEY ("hotel_standard_feature_id") REFERENCES "hotel_standard_feature"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_standard_feature" ADD CONSTRAINT "FK_c0161f12fa933939715f3e40941" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_standard_feature" ADD CONSTRAINT "FK_651e87645bb8a7908329c0b5c27" FOREIGN KEY ("standard_feature_id") REFERENCES "hotel_standard_feature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_type_mapping" ADD CONSTRAINT "FK_fc74acb8ce5a605535dc65d15b2" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_assigned_unit" ADD CONSTRAINT "FK_119bdfdc44326900a07fdd9ddb9" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_assigned_unit" ADD CONSTRAINT "FK_038af49e8c2dea0d2b9f05a09a9" FOREIGN KEY ("room_unit_id") REFERENCES "room_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "room_unit_availability" ADD CONSTRAINT "FK_358e5fbbd1b98a4af83acf46207" FOREIGN KEY ("room_unit_id") REFERENCES "room_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_hotel_language_bundle" ADD CONSTRAINT "FK_a4f91933890de1352ba6bf072b1" FOREIGN KEY ("i18n_locale_id") REFERENCES "translation_i18n_locale"("id") ON DELETE RESTRICT ON UPDATE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_dynamic_content" ADD CONSTRAINT "FK_c0ae0514c9a5f8f9e33ca3efeb0" FOREIGN KEY ("etc_id") REFERENCES "translation_entity_config"("id") ON DELETE RESTRICT ON UPDATE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_dynamic_content" ADD CONSTRAINT "FK_2cb04208779138ec6869538bc0f" FOREIGN KEY ("hlb_id") REFERENCES "translation_hotel_language_bundle"("id") ON DELETE RESTRICT ON UPDATE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_static_content" ADD CONSTRAINT "FK_6fd222e858233cb71c879e9bbe6" FOREIGN KEY ("etc_id") REFERENCES "translation_entity_config"("id") ON DELETE RESTRICT ON UPDATE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_static_content" ADD CONSTRAINT "FK_23295c45eceaaa626f2bda77744" FOREIGN KEY ("i18n_locale_id") REFERENCES "translation_i18n_locale"("id") ON DELETE RESTRICT ON UPDATE RESTRICT`
    );
    await queryRunner.query(
      `ALTER TABLE "mapping_rfc_dynamic_pricing" ADD CONSTRAINT "FK_208bfb79d52efdcaef86120231e" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "mapping_rfc_dynamic_pricing" ADD CONSTRAINT "FK_2614bd19d6d7e68b7c2baa26029" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "mapping_rfc_dynamic_pricing" ADD CONSTRAINT "FK_5c19c8e1b6e7c1dda2ea9c9852d" FOREIGN KEY ("room_product_id") REFERENCES "room_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "connector" ADD CONSTRAINT "FK_3f73543ec4fbaca6074bfd83b37" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "connector" ADD CONSTRAINT "FK_fe73168c9ff01a8b66a88fde592" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "mapping_pms_hotel" ADD CONSTRAINT "FK_5e1aa3b6f8f6359f9d7fa7beb18" FOREIGN KEY ("connector_id") REFERENCES "connector"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_payment_mode" ADD CONSTRAINT "FK_598fc4de3fffd31b9e142efc2a1" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_payment_account" ADD CONSTRAINT "FK_23b032347d7ca43ae443a779a33" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_market_segment" ADD CONSTRAINT "FK_13c54a2e7001c1a796dd7caacde" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_city_tax_age_group" ADD CONSTRAINT "FK_848a397353c065d4074630dd627" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_city_tax_age_group" ADD CONSTRAINT "FK_6778b1c98bafb068ab38c631e14" FOREIGN KEY ("hotel_city_tax_id") REFERENCES "hotel_city_tax"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_city_tax" ADD CONSTRAINT "FK_4502df59cfba6093a33477fd165" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rate" ADD CONSTRAINT "FK_09d3d2a7fb25844ef480485f0ec" FOREIGN KEY ("base_currency_id") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rate" ADD CONSTRAINT "FK_a7ce6c081433053e4fdbe24205a" FOREIGN KEY ("exchange_currency_id") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "customer_payment_gateway" ADD CONSTRAINT "FK_49758d612b2e33ca1259bc941d3" FOREIGN KEY ("internal_customer_id") REFERENCES "guest"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_payment_gateway" DROP CONSTRAINT "FK_49758d612b2e33ca1259bc941d3"`
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rate" DROP CONSTRAINT "FK_a7ce6c081433053e4fdbe24205a"`
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rate" DROP CONSTRAINT "FK_09d3d2a7fb25844ef480485f0ec"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_city_tax" DROP CONSTRAINT "FK_4502df59cfba6093a33477fd165"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_city_tax_age_group" DROP CONSTRAINT "FK_6778b1c98bafb068ab38c631e14"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_city_tax_age_group" DROP CONSTRAINT "FK_848a397353c065d4074630dd627"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_market_segment" DROP CONSTRAINT "FK_13c54a2e7001c1a796dd7caacde"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_payment_account" DROP CONSTRAINT "FK_23b032347d7ca43ae443a779a33"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_payment_mode" DROP CONSTRAINT "FK_598fc4de3fffd31b9e142efc2a1"`
    );
    await queryRunner.query(
      `ALTER TABLE "mapping_pms_hotel" DROP CONSTRAINT "FK_5e1aa3b6f8f6359f9d7fa7beb18"`
    );
    await queryRunner.query(
      `ALTER TABLE "connector" DROP CONSTRAINT "FK_fe73168c9ff01a8b66a88fde592"`
    );
    await queryRunner.query(
      `ALTER TABLE "connector" DROP CONSTRAINT "FK_3f73543ec4fbaca6074bfd83b37"`
    );
    await queryRunner.query(
      `ALTER TABLE "mapping_rfc_dynamic_pricing" DROP CONSTRAINT "FK_5c19c8e1b6e7c1dda2ea9c9852d"`
    );
    await queryRunner.query(
      `ALTER TABLE "mapping_rfc_dynamic_pricing" DROP CONSTRAINT "FK_2614bd19d6d7e68b7c2baa26029"`
    );
    await queryRunner.query(
      `ALTER TABLE "mapping_rfc_dynamic_pricing" DROP CONSTRAINT "FK_208bfb79d52efdcaef86120231e"`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_static_content" DROP CONSTRAINT "FK_23295c45eceaaa626f2bda77744"`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_static_content" DROP CONSTRAINT "FK_6fd222e858233cb71c879e9bbe6"`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_dynamic_content" DROP CONSTRAINT "FK_2cb04208779138ec6869538bc0f"`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_dynamic_content" DROP CONSTRAINT "FK_c0ae0514c9a5f8f9e33ca3efeb0"`
    );
    await queryRunner.query(
      `ALTER TABLE "translation_hotel_language_bundle" DROP CONSTRAINT "FK_a4f91933890de1352ba6bf072b1"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_unit_availability" DROP CONSTRAINT "FK_358e5fbbd1b98a4af83acf46207"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_assigned_unit" DROP CONSTRAINT "FK_038af49e8c2dea0d2b9f05a09a9"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_assigned_unit" DROP CONSTRAINT "FK_119bdfdc44326900a07fdd9ddb9"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_type_mapping" DROP CONSTRAINT "FK_fc74acb8ce5a605535dc65d15b2"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_standard_feature" DROP CONSTRAINT "FK_651e87645bb8a7908329c0b5c27"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_standard_feature" DROP CONSTRAINT "FK_c0161f12fa933939715f3e40941"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_standard_feature_translation" DROP CONSTRAINT "FK_6703968c6d895021ad54ecceb81"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping" DROP CONSTRAINT "FK_544b2a40ef151b2b0133b872e93"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping" DROP CONSTRAINT "FK_d77ec7ca3ab31b89103a1e6ad06"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_mapping_pms" DROP CONSTRAINT "FK_0ab2847d1f1262d30871ead02b0"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_image" DROP CONSTRAINT "FK_1a3a34489e095fb57ad642a7a76"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_extra_occupancy_rate" DROP CONSTRAINT "FK_0775bee087b634c4709b89ab46d"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_base_price" DROP CONSTRAINT "FK_1300d464eb8b042b6c11e43cc07"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_base_price" DROP CONSTRAINT "FK_363c1a2da12bb063ddd047be88d"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan" DROP CONSTRAINT "FK_99247752b796a4cf4bb9626f3a8"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan" DROP CONSTRAINT "FK_e24fd35b330026e0a998c10f06c"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_translation" DROP CONSTRAINT "FK_02c2fd8a13904b9be2c5343461c"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_sellability" DROP CONSTRAINT "FK_b7a88abc60ea19aa79402c69bcd"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_payment_term_setting" DROP CONSTRAINT "FK_cc13c4e50407b8861f5eac5f72c"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_payment_settlement_setting" DROP CONSTRAINT "FK_e5e6fe528c7733a8848079072da"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_derived_setting" DROP CONSTRAINT "FK_89c9ed76312fed9fad9f5f0df9e"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_derived_setting" DROP CONSTRAINT "FK_2e6419a2ca9d71bfc81284bfc78"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_sellability" DROP CONSTRAINT "FK_cd7b0cb71db9c3391518e2d2a17"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_adjustment" DROP CONSTRAINT "FK_347d16480ac7b7713353a871b98"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_availability_adjustment" DROP CONSTRAINT "FK_1cdb038333773cfc57765b0fb4b"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_availability_adjustment" DROP CONSTRAINT "FK_bb471aedcdb446f71ef9ded3b6a"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan" DROP CONSTRAINT "FK_391fd73aaad1de7a77076c18c9e"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan" DROP CONSTRAINT "FK_2a5fb21eec0d495abd24aae1e9e"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_rate_plan_extra_occupancy_rate_adjustment" DROP CONSTRAINT "FK_d79a75c4405c7690fd112813a6c"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" DROP CONSTRAINT "FK_cdb0088e905f3e833e1e4b9de3a"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" DROP CONSTRAINT "FK_609106eb9a329944d64d55276bb"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_feature_rate_adjustment" DROP CONSTRAINT "FK_c2d7a82d5cc423053cf6e495591"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_retail_feature" DROP CONSTRAINT "FK_73ef18e60dce206c5323de417b6"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_retail_feature" DROP CONSTRAINT "FK_a2f7d1c21ccc69ce676cf1e2a22"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_retail_feature" DROP CONSTRAINT "FK_aee1dc6d4e9ecd6a01a56ff04b0"`
    );
    await queryRunner.query(
      `ALTER TABLE "event_feature" DROP CONSTRAINT "FK_6fa5717e71fa6c79fd335cd99dc"`
    );
    await queryRunner.query(
      `ALTER TABLE "event_feature" DROP CONSTRAINT "FK_da4f31b4a66052e22a42b1fc31e"`
    );
    await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_697909a55bde1b28a90560f3ae2"`);
    await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_e4b233dc2113aad9361eb418003"`);
    await queryRunner.query(
      `ALTER TABLE "room_unit_retail_feature" DROP CONSTRAINT "FK_a94d191c5e9ce191719431b04df"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_unit_retail_feature" DROP CONSTRAINT "FK_2206d38c3b77af96a635fd53f7c"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_feature_daily_rate" DROP CONSTRAINT "FK_8724c985e6489230d39925a7b67"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_feature_daily_rate" DROP CONSTRAINT "FK_1d952ccbb689843f42dc38a17b1"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_retail_feature_translation" DROP CONSTRAINT "FK_ef6197736df38c8a8d11ef72623"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_retail_category_translation" DROP CONSTRAINT "FK_e3e7709a8e3117c5ae3c348b93d"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_pricing_method_detail" DROP CONSTRAINT "FK_def6e8b10badbe9b6954a23c78b"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_pricing_method_detail" DROP CONSTRAINT "FK_2d224b4df2ecdf56d438cbf563d"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_pricing_method_detail" DROP CONSTRAINT "FK_e4c3cfa85a14e8a1132dd38fb4a"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_selling_price" DROP CONSTRAINT "FK_bf336dd7776d817823f5cc5fb7a"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_selling_price" DROP CONSTRAINT "FK_a239a82c5698778e7e5a5bc92e8"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_payment_term" DROP CONSTRAINT "FK_524fbdadbafbc44717cd5867fe2"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_daily_extra_service" DROP CONSTRAINT "FK_8bc2e51c42119f7b547efdfd133"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_cxl_policy_daily" DROP CONSTRAINT "FK_a2ca0e9b1fe9f98f9dd36acf936"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_payment_term" DROP CONSTRAINT "FK_b437e8bea2994281f59f61db70d"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_cancellation_policy" DROP CONSTRAINT "FK_1fa4f037c44804e2724ee18eaea"`
    );
    await queryRunner.query(`ALTER TABLE "hotel" DROP CONSTRAINT "FK_49f60fa23861e5e5d77efdb7857"`);
    await queryRunner.query(`ALTER TABLE "hotel" DROP CONSTRAINT "FK_9beaf75bc49ee1bf39969d80138"`);
    await queryRunner.query(`ALTER TABLE "hotel" DROP CONSTRAINT "FK_0b955f96081ce93d1419c885a46"`);
    await queryRunner.query(`ALTER TABLE "hotel" DROP CONSTRAINT "FK_1e6f00a4705b2e9f564d165bf3f"`);
    await queryRunner.query(
      `ALTER TABLE "identity_user" DROP CONSTRAINT "FK_6fadcae95c42cb16e57d99729e6"`
    );
    await queryRunner.query(
      `ALTER TABLE "identity_user_access_control" DROP CONSTRAINT "FK_07b9a4b42b80b1ae7c32dad0728"`
    );
    await queryRunner.query(
      `ALTER TABLE "identity_user_access_control" DROP CONSTRAINT "FK_3702991c7b2217487725255acc9"`
    );
    await queryRunner.query(
      `ALTER TABLE "identity_access_control" DROP CONSTRAINT "FK_0a90203a42870861c647623a953"`
    );
    await queryRunner.query(
      `ALTER TABLE "identity_access_control" DROP CONSTRAINT "FK_5018d22d587cb852324b8111c30"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_tax_setting" DROP CONSTRAINT "FK_2f8700121ad6a0d94411f7cd53f"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_tax_setting" DROP CONSTRAINT "FK_f45593cb0d2d6b78dda25033d76"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_tax" DROP CONSTRAINT "FK_5867bfeb7fa59b4243bfc6d9047"`
    );
    await queryRunner.query(`ALTER TABLE "guest" DROP CONSTRAINT "FK_ccee49c448c6efb0e0d65041d6c"`);
    await queryRunner.query(`ALTER TABLE "guest" DROP CONSTRAINT "FK_ac28d3d5ca8c031eac15c7ab682"`);
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP CONSTRAINT "FK_778aabb1b42cff8c3f766e6a50a"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP CONSTRAINT "FK_d0fd5612ba0badf1ecaa03e1f3f"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP CONSTRAINT "FK_363ebb59727da92a21a41c73638"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP CONSTRAINT "FK_faa429ef53db1e6cd4e66b4d4d9"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP CONSTRAINT "FK_8707374810e5682b6b63165537b"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP CONSTRAINT "FK_0ff06e6651c1f5773d73d5508be"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation" DROP CONSTRAINT "FK_088d6b9559ef8f981b2d59f1ef2"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_time_slice" DROP CONSTRAINT "FK_27b70912dc9c7e25dffc3c64a4e"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_room" DROP CONSTRAINT "FK_2af62c299d3061019238249bbe4"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_amenity" DROP CONSTRAINT "FK_888c31129a59ad05a4b5942074a"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_amenity" DROP CONSTRAINT "FK_73cc3fef5f959bfb6296ebbb51a"`
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_amenity_date" DROP CONSTRAINT "FK_cd02fb89f5a4ed2014d04b94aef"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_amenity" DROP CONSTRAINT "FK_d5b59d68ceccea6e079ff5dc0c6"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_amenity" DROP CONSTRAINT "FK_20f36b266666e1391a4c280df48"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_extra_service" DROP CONSTRAINT "FK_66c319caf65484a683308951283"`
    );
    await queryRunner.query(
      `ALTER TABLE "rate_plan_extra_service" DROP CONSTRAINT "FK_c3f7becaf7d2a38b6817d3caba3"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_extra" DROP CONSTRAINT "FK_bbaa4075013531bb9a11f276d42"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_extra" DROP CONSTRAINT "FK_b9a81cc6b44958cacf8aac93df2"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_amenity_price" DROP CONSTRAINT "FK_bf1eada9bc406bb9fc591b96816"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_amenity_price" DROP CONSTRAINT "FK_e8572aa42516d4cc6fd491c2404"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_age_category" DROP CONSTRAINT "FK_ac67645a950182263fea58fc64d"`
    );
    await queryRunner.query(
      `ALTER TABLE "booking" DROP CONSTRAINT "FK_4ee97cceb057d5cf2edc0f0ac08"`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_proposal_setting" DROP CONSTRAINT "FK_e979705ca4be0d87cf822b05d5e"`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_transaction" DROP CONSTRAINT "FK_fd5fb0fcb54e87ff08c36664b8e"`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_transaction" DROP CONSTRAINT "FK_8ccbe8a0c7faa10fc37e0f12b67"`
    );
    await queryRunner.query(
      `ALTER TABLE "booking_transaction" DROP CONSTRAINT "FK_738af3b4cecf067d96346b16d9b"`
    );
    await queryRunner.query(
      `ALTER TABLE "hotel_configuration" DROP CONSTRAINT "FK_8e73fed024f8ac0cc26b772f46c"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_daily_availability" DROP CONSTRAINT "FK_36c62333a804768f70a35604bd5"`
    );
    await queryRunner.query(
      `ALTER TABLE "room_product_base_price_setting" DROP CONSTRAINT "FK_e5d36d5fdb299bd40151a50ea04"`
    );
    await queryRunner.query(
      `ALTER TABLE "restriction_automation_setting" DROP CONSTRAINT "FK_d3a09f3e8c586212acd0ced75e5"`
    );
    await queryRunner.query(`DROP TABLE "apaleo_rate_plan_pms_mapping"`);
    await queryRunner.query(`DROP INDEX "public"."idx_booking_id"`);
    await queryRunner.query(`DROP TABLE "booking_upsell_information"`);
    await queryRunner.query(`DROP TABLE "customer_payment_gateway"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4d2350de2114ace0b38b2233b7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2b0d8573d9696b22b0856b2e89"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_41a30b479acc4391493d808d73"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_67d53524b9143f8f32f28fb320"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4d0b90ee63435f1b0e8f94b4d0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1feb1c2e5cc41b8691c330a654"`);
    await queryRunner.query(`DROP TABLE "reservation_related_mrfc"`);
    await queryRunner.query(`DROP TABLE "supported_reservation_source"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_09d3d2a7fb25844ef480485f0e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a7ce6c081433053e4fdbe24205"`);
    await queryRunner.query(`DROP TABLE "currency_rate"`);
    await queryRunner.query(`DROP TABLE "brand"`);
    await queryRunner.query(`DROP TABLE "event_label"`);
    await queryRunner.query(`DROP TABLE "flyway_schema_history"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6b43b1782073d0ef158be83b58"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9c1bda1595fe2ba9bf8997d7d4"`);
    await queryRunner.query(`DROP TABLE "global_payment_provider"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4502df59cfba6093a33477fd16"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ee414fed590040c42b159e4096"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_90f562d06d8ce917a69b046893"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d1dc40f414b37d22ff81891874"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bb28a5f854991a87e97a35fa0d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_974b5d084b02a053b242c2e163"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fe1cc633576c649cdc3fe10203"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_815b7c4383423766e18549103c"`);
    await queryRunner.query(`DROP TABLE "hotel_city_tax"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_848a397353c065d4074630dd62"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6778b1c98bafb068ab38c631e1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d18c3dbcb2b3d98be7d56069e7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f2eb5dc8ebf8fcd031b70443c1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7dc236ba8f5a7121fa61dc8336"`);
    await queryRunner.query(`DROP TABLE "hotel_city_tax_age_group"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_13c54a2e7001c1a796dd7caacd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1a2a14695c8f05f752507c128d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_df1c77500fbfc37047221cca5b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b998197132531d817828ba5697"`);
    await queryRunner.query(`DROP TABLE "hotel_market_segment"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_23b032347d7ca43ae443a779a3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_27a8bafcabd2cf32cd133507bc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_15816a7536b74302e1646419b0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ad4e8dc1db08dab04aa7129098"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97ecb3c611733b07ecc474a45a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1846ada735c3ae36695393cb62"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a1a335bf91669136d15fb7b0b0"`);
    await queryRunner.query(`DROP TABLE "hotel_payment_account"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_70b662da34c076f611873f663f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_32ab18f5fe328d55b61e66ea4f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8bcd36f44d11ac990f0771a037"`);
    await queryRunner.query(`DROP TABLE "hotel_payment_method_setting"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_598fc4de3fffd31b9e142efc2a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b369836b49309eb6f694603be9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cc2229f2dd91199af930c0d374"`);
    await queryRunner.query(`DROP TABLE "hotel_payment_mode"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f6f1a591523b349490897c8ec4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ce41e1617066084ffcf09b3a77"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9add8d810a37af0a9f5576eb6b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d2ee7c57eff93a47ed8c4eed7b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e31c10f6f40e97d041fc7d96ff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2a54484f412c59d9713a83548b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4badcf7a22ea89ef211bcb1907"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7df39267db17529bbbf46be7d8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ef9474f9d3534f904ca0930681"`);
    await queryRunner.query(`DROP TABLE "hotel_template_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f151dc92eef40956a4d9880929"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5e1aa3b6f8f6359f9d7fa7beb1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7fd7ce8ba9392cd0f15747ae66"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e21db383b99af09661aeb7a432"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_778a0decf3e30163366a230c68"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_35903cc2c38449deba0ba1926c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_049d569de932c639d33ad1169c"`);
    await queryRunner.query(`DROP TABLE "mapping_pms_hotel"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3f73543ec4fbaca6074bfd83b3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fe73168c9ff01a8b66a88fde59"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0ab4ad3877d6740860ffa3103a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ef85c1d8cd74bda7eb1803b3bc"`);
    await queryRunner.query(`DROP TABLE "connector"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ee50d591b0c7cfeb5fed2e668f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bee52329b7c82e9a846ad1ed86"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a15736374c1e4c546689a1b95e"`);
    await queryRunner.query(`DROP TABLE "mapping_standard_feature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_38ae9466536231be8e30ae429d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_829e3a152b5759f946bfec00cf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1ddd207fe318c38960c15db9ad"`);
    await queryRunner.query(`DROP TABLE "mapping_retail_feature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d18d3ca2b6f79d9fa4304a7339"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3a984ee31a3af07214074a4430"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_51861fc7f98a193ba46ed095cb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c9a285192813473199c0efc740"`);
    await queryRunner.query(`DROP TABLE "organisation_widget_config"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6a3122daf3cb06cb4f1f87ae64"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d9428f9c8e3052d6617e3aab0e"`);
    await queryRunner.query(`DROP TABLE "organisation"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_61f7e57d89d41cdc6e4c1aa9fc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cda98165f1d81447afdba0b50c"`);
    await queryRunner.query(`DROP TABLE "identity_auth0_user"`);
    await queryRunner.query(`DROP TABLE "identity_permission"`);
    await queryRunner.query(`DROP TABLE "mews_service_settings"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_208bfb79d52efdcaef86120231"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2614bd19d6d7e68b7c2baa2602"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5c19c8e1b6e7c1dda2ea9c9852"`);
    await queryRunner.query(`DROP TABLE "mapping_rfc_dynamic_pricing"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_34b6ee11bc0942c94b68bba1f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_891f46f674ff057ba81ad49728"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a5bde18df75cf57a5a95759ae2"`);
    await queryRunner.query(`DROP TABLE "occ_reference"`);
    await queryRunner.query(`DROP TABLE "background_job"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_34fda2f73b0e7550232b2c688f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a79399683a0589dba3f78e4c95"`);
    await queryRunner.query(`DROP TABLE "hotel_restriction_setting"`);
    await queryRunner.query(`DROP INDEX "public"."fk_sct_etc_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_i18n_locale_etc"`);
    await queryRunner.query(`DROP INDEX "public"."idx_i18n_locale"`);
    await queryRunner.query(`DROP TABLE "translation_static_content"`);
    await queryRunner.query(`DROP INDEX "public"."unique_etc_code"`);
    await queryRunner.query(`DROP TABLE "translation_entity_config"`);
    await queryRunner.query(`DROP INDEX "public"."fk_dct_etc_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_hlb_etc"`);
    await queryRunner.query(`DROP INDEX "public"."idx_hlb_etc_entity"`);
    await queryRunner.query(`DROP TABLE "translation_dynamic_content"`);
    await queryRunner.query(`DROP INDEX "public"."fk_locale_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_hotel_locale"`);
    await queryRunner.query(`DROP TABLE "translation_hotel_language_bundle"`);
    await queryRunner.query(`DROP INDEX "public"."unique_locale_code"`);
    await queryRunner.query(`DROP TABLE "translation_i18n_locale"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2d0a06d98963a2589181175942"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2998743bba301379b2fca2ad00"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_01448a55dd6720088f436a4997"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d5a3c20523757e94a3bf69550e"`);
    await queryRunner.query(`DROP TABLE "hotel_restriction_integration_setting"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6d2904c89354d613f61719d9ff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bca1eb33761d931204909083d6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a18a60e2eb043357043ac7ebfc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6cdb93dd7c4fb79b10f7827e66"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4496fc35c4b12dc79c5d98b08f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_48794cc99f154a352f716dc8ea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6b568a48cf0c03707ed7559791"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0baf16153be9a576ce24198949"`);
    await queryRunner.query(`DROP TABLE "restriction"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_02098761a77d8888f65405c792"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_690e396e6484e45b98797203c7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b3f9963255297d945532880ec6"`);
    await queryRunner.query(`DROP TABLE "room_unit"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6756aa034f100ba3be14559fc6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0b9c38d6b61694f650a7083a7c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_358e5fbbd1b98a4af83acf4620"`);
    await queryRunner.query(`DROP TABLE "room_unit_availability"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_097319570a5335d02a206bb989"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_119bdfdc44326900a07fdd9ddb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_038af49e8c2dea0d2b9f05a09a"`);
    await queryRunner.query(`DROP TABLE "room_product_assigned_unit"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_46025be46b58eefe5244460fb7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_51da11badc4d52edef9908b169"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e038dcd2cfb656f2e3c71609af"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_90db9b15a693fbfebab1629e6e"`);
    await queryRunner.query(`DROP TABLE "room_product"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8b5c6419d365765e27ef4edce9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_29edcd6224ce0e47252d1e5bba"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fc74acb8ce5a605535dc65d15b"`);
    await queryRunner.query(`DROP TABLE "room_product_type_mapping"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d122a786d7a15976c7172cd804"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9911eb5e8d0bda6323c1ad2fd7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_23f938462cb2ccf1237c6f3f62"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0161f12fa933939715f3e4094"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_651e87645bb8a7908329c0b5c2"`);
    await queryRunner.query(`DROP TABLE "room_product_standard_feature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e7a69906d16a42dbaee392dcc5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d1f5446aef17e07ce56928e15c"`);
    await queryRunner.query(`DROP TABLE "hotel_standard_feature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6703968c6d895021ad54ecceb8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b6a0d8a1d50ececde31ff69b05"`);
    await queryRunner.query(`DROP TABLE "hotel_standard_feature_translation"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de846e5721e188c809392284bb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4b877db53c31c3182c0951993f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d77ec7ca3ab31b89103a1e6ad0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_544b2a40ef151b2b0133b872e9"`);
    await queryRunner.query(`DROP TABLE "room_product_mapping"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_933574ddcad8acad7b8a274c73"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0ab2847d1f1262d30871ead02b"`);
    await queryRunner.query(`DROP TABLE "room_product_mapping_pms"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_31006b232152c4af6470b1be8b"`);
    await queryRunner.query(`DROP TABLE "room_product_image"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b9d9696d383555299b75eb3a09"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7d96b756d865b9835b2d156fd4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cd6e36537b931dbf7b22a6d0b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d842b20877ea25265861924345"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6fd851f8ffbed21b275f45e52a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0775bee087b634c4709b89ab46"`);
    await queryRunner.query(`DROP TABLE "room_product_extra_occupancy_rate"`);
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
    await queryRunner.query(`DROP INDEX "public"."IDX_da9a96d1b21dba2c14090e8029"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1675421cf163a792b608ac5a9c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c1207cd2eafa6fbe35773cc815"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_25f449d5fd8c1764f9d74d9295"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_99e5a4bafa8698bfebf4f99eef"`);
    await queryRunner.query(`DROP TABLE "rate_plan"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c57c620476e2f834dc85f1e6ef"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_22b162fcc7c3d0ab3418fb5a93"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_950d382a62656aac2bcb203672"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c139d22de77e61887898220909"`);
    await queryRunner.query(`DROP TABLE "rate_plan_translation"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a7c586f1c9ff36c934be5df344"`);
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
    await queryRunner.query(`DROP INDEX "public"."IDX_2a90bbc9221736f02c59e3a78b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_89c9ed76312fed9fad9f5f0df9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_76cf0e6c1d2a7bce3a4e980430"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_01beeadedebb419d7ecc49903c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3b852e505cc20032696c4fd635"`);
    await queryRunner.query(`DROP TABLE "rate_plan_derived_setting"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a6e55d2f017b91225ab56cf915"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cd7b0cb71db9c3391518e2d2a1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_20d3e36fbcfd21f3abb2b8a033"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e1bcc4ceb5e442452187175b17"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_84288073e3df2bf91700513228"`);
    await queryRunner.query(`DROP TABLE "rate_plan_daily_sellability"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1facd0fde06685f780c2758828"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_347d16480ac7b7713353a871b9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_553612cadbc5aeb0bd8f829746"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_88467d040abd37e025a28f17bf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0d6495e0977334c4d1c28abbe5"`);
    await queryRunner.query(`DROP TABLE "rate_plan_daily_adjustment"`);
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
    await queryRunner.query(`DROP INDEX "public"."IDX_0d3b8990a314fd25da88ee693f"`);
    await queryRunner.query(`DROP TABLE "room_product_feature_rate_adjustment"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4a7db9bcf10c0d957cf6250d5f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_04b0a8214b0830250c0d75ea2f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4e1541e2275c04abe58d812c69"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a2f7d1c21ccc69ce676cf1e2a2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_73ef18e60dce206c5323de417b"`);
    await queryRunner.query(`DROP TABLE "room_product_retail_feature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_aee1dc6d4e9ecd6a01a56ff04b"`);
    await queryRunner.query(`DROP TABLE "hotel_retail_feature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_da4f31b4a66052e22a42b1fc31"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6fa5717e71fa6c79fd335cd99d"`);
    await queryRunner.query(`DROP TABLE "event_feature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e4b233dc2113aad9361eb41800"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_697909a55bde1b28a90560f3ae"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6d225d2181fcfcebdfd7ac5365"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fb931d7d954ab53421bbd19ad3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c69e7e727e0915c693bd131e70"`);
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d2c138089f45f7c3fa916ffb68"`);
    await queryRunner.query(`DROP TABLE "event_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e4c0948945d5308eed037aa920"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6d1b436c0ec790b5300ee5b119"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d11739d837129a5583e8ea98b1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2206d38c3b77af96a635fd53f7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a94d191c5e9ce191719431b04d"`);
    await queryRunner.query(`DROP TABLE "room_unit_retail_feature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2819ae635d83f6f4a5f79e88c2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3240a3840f5ca17da4453fc847"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d2600667c53853920efafd4ef0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1d952ccbb689843f42dc38a17b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8724c985e6489230d39925a7b6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8745debfe6a51661391796e46e"`);
    await queryRunner.query(`DROP TABLE "rate_plan_feature_daily_rate"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ef6197736df38c8a8d11ef7262"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17ed681d41fd83ec7738a8c9fb"`);
    await queryRunner.query(`DROP TABLE "hotel_retail_feature_translation"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1440d928138855e190d98caa24"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b47c106cd5df3a464302ba02f6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fc24100cb97a00daa984f51e2d"`);
    await queryRunner.query(`DROP TABLE "hotel_retail_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e3e7709a8e3117c5ae3c348b93"`);
    await queryRunner.query(`DROP TABLE "hotel_retail_category_translation"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f3a638ea8b596181da3586b3ea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1e21259f3cf1c23c2d410dd8bc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ff0d898348f15f2215e620a015"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_712ff575d27a61deb0c21fc274"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e4c3cfa85a14e8a1132dd38fb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2d224b4df2ecdf56d438cbf563"`);
    await queryRunner.query(`DROP TABLE "room_product_pricing_method_detail"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_21ed1faf38fbea882e6d5a5825"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8dc428efa848980f3da30d1ea9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_610eacd1ce5eea9304ccc0454d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f0ed616b4c0e9fdaa5877657e8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a239a82c5698778e7e5a5bc92e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bf336dd7776d817823f5cc5fb7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e4ce36b305f6e7125fd32a7944"`);
    await queryRunner.query(`DROP TABLE "room_product_daily_selling_price"`);
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
    await queryRunner.query(`DROP INDEX "public"."IDX_9fa8fc2dbfdefbe053c7beb372"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a2ca0e9b1fe9f98f9dd36acf93"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_470ea47457db499f914b91779f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bcc8e5d59d5b146433e41c67a7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2c2a2ee0326e10737bd4b9b55e"`);
    await queryRunner.query(`DROP TABLE "rate_plan_cxl_policy_daily"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b437e8bea2994281f59f61db70"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f0e5138cba783b019234817fd5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_003efd91a9e23cb846fcc12295"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ddf276961bfc95f222d5bf507b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_335fce84cb8b746608fbdef435"`);
    await queryRunner.query(`DROP TABLE "hotel_payment_term"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1fa4f037c44804e2724ee18eae"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_678bc822716e90bde66d9044c2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_139fb0273b73b53e975afb93b9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_25b5c8f5c74c006ab3f165394e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e7b4bd9abc75afd37831fdec3a"`);
    await queryRunner.query(`DROP TABLE "hotel_cancellation_policy"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5c99d82207134461ec06c10bc8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9beaf75bc49ee1bf39969d8013"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0488d14ba6c73cb2ac2380237c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0b955f96081ce93d1419c885a4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5784dab6b99190f2132c49792a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_43c60de2a6f8d12dd24fe2c17f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2f91b9aa7761020e0d4e0a9189"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4e1924aa31055bed085a00a60b"`);
    await queryRunner.query(`DROP TABLE "hotel"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7b888514aeefc3152f5951e03b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6fadcae95c42cb16e57d99729e"`);
    await queryRunner.query(`DROP TABLE "identity_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_07b9a4b42b80b1ae7c32dad072"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3702991c7b2217487725255acc"`);
    await queryRunner.query(`DROP TABLE "identity_user_access_control"`);
    await queryRunner.query(`DROP INDEX "public"."idx_organisationId_hotelId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5018d22d587cb852324b8111c3"`);
    await queryRunner.query(`DROP TABLE "identity_access_control"`);
    await queryRunner.query(`DROP TABLE "identity_role"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f45593cb0d2d6b78dda25033d7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_34b622295ad0ecdebd9b57f8d1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de1626a3bec00dac0eb2e6c894"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2f8700121ad6a0d94411f7cd53"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1e1f9d33f4eea631c05c9484ee"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8b605e29a467b40cfde5448d71"`);
    await queryRunner.query(`DROP TABLE "hotel_tax_setting"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5867bfeb7fa59b4243bfc6d904"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c1058b4a3ef72c9a94efa1c046"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1bee37dba99d88f23809c331f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_62cf1dbb258545f619d3452137"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b9f5c711161636067016c77288"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6a289696f145e4fe3af36e5218"`);
    await queryRunner.query(`DROP TABLE "hotel_tax"`);
    await queryRunner.query(`DROP TABLE "file_library"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8ff4c23dc9a3f3856555bd8618"`);
    await queryRunner.query(`DROP TABLE "country"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ac28d3d5ca8c031eac15c7ab68"`);
    await queryRunner.query(`DROP TABLE "guest"`);
    await queryRunner.query(`DROP INDEX "public"."reservation_booking_id_fk"`);
    await queryRunner.query(`DROP INDEX "public"."reservation_reservation_number_index"`);
    await queryRunner.query(`DROP INDEX "public"."index_reservation_arrival"`);
    await queryRunner.query(`DROP INDEX "public"."index_reservation_departure"`);
    await queryRunner.query(
      `DROP INDEX "public"."reservation_soft_delete_status_booking_id_reservation_id"`
    );
    await queryRunner.query(`DROP INDEX "public"."index_reservation_hotel_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_hotelId_status_arrival_departure"`);
    await queryRunner.query(`DROP INDEX "public"."idx_channel"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payment_mode"`);
    await queryRunner.query(`DROP INDEX "public"."idx_mapping_reservation_code"`);
    await queryRunner.query(`DROP INDEX "public"."idx_hotelId_reservationNumber"`);
    await queryRunner.query(`DROP TABLE "reservation"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_27b70912dc9c7e25dffc3c64a4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_14b376bc18d3e5f9931c023f15"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_325b71ac3a60ec3512aabcb3d6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_228611941a0a9a5d8e6f45372b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_41aa5877f81289cc1058158ffc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_39e825da1b11d74f1eff669146"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_54d460a7e9fb617103c3efec11"`);
    await queryRunner.query(`DROP TABLE "reservation_time_slice"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2af62c299d3061019238249bbe"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_207d01f70600a3b5817a95b690"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fd70d5c3410683aca226f3aeaf"`);
    await queryRunner.query(`DROP TABLE "reservation_room"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_73cc3fef5f959bfb6296ebbb51"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_888c31129a59ad05a4b5942074"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c6f8e481725aefb002e570a68b"`);
    await queryRunner.query(`DROP TABLE "reservation_amenity"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cd02fb89f5a4ed2014d04b94ae"`);
    await queryRunner.query(`DROP TABLE "reservation_amenity_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_20f36b266666e1391a4c280df4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4585bedf24786a47d1ee691c05"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8632206e127227fa2c75abb020"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d5b59d68ceccea6e079ff5dc0c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b7a77eca4e9fa9096cce7c148c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_580e37607c5a78f975c9d3944a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6fcbcddcb0719642fed11b1be9"`);
    await queryRunner.query(`DROP TABLE "hotel_amenity"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8f1c28c97fc30dd76aff2e764e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c3f7becaf7d2a38b6817d3caba"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_75587f956c9f128f13ef841cff"`);
    await queryRunner.query(`DROP TABLE "rate_plan_extra_service"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4920a88d7942a0ac15b09630ae"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b9a81cc6b44958cacf8aac93df"`);
    await queryRunner.query(`DROP TABLE "room_product_extra"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e8572aa42516d4cc6fd491c240"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bf1eada9bc406bb9fc591b9681"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1b18b3eb11d1a2a7555044ff1b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dc32a945048bcd6adf1457b859"`);
    await queryRunner.query(`DROP TABLE "hotel_amenity_price"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ac67645a950182263fea58fc64"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b134b963878ec4209d0ec62d61"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_621723d530987b8d57ddbd817a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1258f4eca603b37fdf2e78e83d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_eb02d011bec0533ab4488b5634"`);
    await queryRunner.query(`DROP TABLE "hotel_age_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1835eb435e618645e87f0c810c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b2994531a0a3311a13d32a2520"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3d9cd24f1778773153fa86d2f5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fae5f8241e6ef84a9afa160255"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4948e2a61d344b3ac92c3bfddd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3a2feb46b60f406a364b436863"`);
    await queryRunner.query(`DROP TABLE "template_amenity"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a0e46a7d2226c6deb73fd26023"`);
    await queryRunner.query(`DROP TABLE "company"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookingNumber"`);
    await queryRunner.query(`DROP INDEX "public"."idx_hotelId_bookingNumber"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4ee97cceb057d5cf2edc0f0ac0"`);
    await queryRunner.query(`DROP TABLE "booking"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2818478cfb752906b8b27e02de"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e979705ca4be0d87cf822b05d5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b26c138bf061d8eba8f07d0732"`);
    await queryRunner.query(`DROP TABLE "booking_proposal_setting"`);
    await queryRunner.query(`DROP INDEX "public"."booking_transaction_booking_id_fk"`);
    await queryRunner.query(`DROP INDEX "public"."booking_transaction_currency_id_index"`);
    await queryRunner.query(`DROP TABLE "booking_transaction"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_32919a5ab02055f5338e90becc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e93eea007a3e704573cccc5fd9"`);
    await queryRunner.query(`DROP TABLE "global_payment_method"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_723472e41cae44beb0763f4039"`);
    await queryRunner.query(`DROP TABLE "currency"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8e73fed024f8ac0cc26b772f46"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8d65542b21ed1d23baf0d5e617"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_748c9dec2570a0524e9de6b8fe"`);
    await queryRunner.query(`DROP TABLE "hotel_configuration"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_89256677b62dd7f7e15629ca08"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_36c62333a804768f70a35604bd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4a2481c471efa56df04e16662d"`);
    await queryRunner.query(`DROP TABLE "room_product_daily_availability"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7857d2442d9bc409f75416ecd3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17b7019c6d452e1f5ce1c966dd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e5d36d5fdb299bd40151a50ea0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5249a34a891a7d5af59135e970"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2ac1759f36cc44c3fd4a522d89"`);
    await queryRunner.query(`DROP TABLE "room_product_base_price_setting"`);
    await queryRunner.query(`DROP INDEX "public"."ras_unique_idx"`);
    await queryRunner.query(`DROP INDEX "public"."ras_hotel_id_idx"`);
    await queryRunner.query(`DROP INDEX "public"."ras_hotel_id_type_idx"`);
    await queryRunner.query(`DROP INDEX "public"."ras_reference_id_idx"`);
    await queryRunner.query(`DROP TABLE "restriction_automation_setting"`);
  }
}
