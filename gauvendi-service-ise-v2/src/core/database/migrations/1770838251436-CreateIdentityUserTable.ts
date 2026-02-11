
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIdentityUserTable1770838251436 implements MigrationInterface {
    name = 'CreateIdentityUserTable1770838251436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "identity_user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" text,
                "updated_by" text,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "organisation_id" uuid,
                "username" character varying(255),
                "hotel_id" uuid,
                "email_address" character varying(255),
                "first_name" character varying(255),
                "last_name" character varying(255),
                "status" character varying(60),
                "last_login_activity" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_identity_user_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_identity_user_organisation_id" ON "identity_user" ("organisation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_identity_user_hotel_id" ON "identity_user" ("hotel_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_identity_user_hotel_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_identity_user_organisation_id"`);
        await queryRunner.query(`DROP TABLE "identity_user"`);
    }

}
