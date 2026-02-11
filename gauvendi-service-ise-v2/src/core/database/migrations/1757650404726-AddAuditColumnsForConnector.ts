import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditColumnsForConnector1757650404726 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add audit columns to connector table
        await queryRunner.query(`
            ALTER TABLE "connector" 
            ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS "created_by" TEXT,
            ADD COLUMN IF NOT EXISTS "updated_by" TEXT
        `);

        // Update existing records to have proper timestamps
        await queryRunner.query(`
            UPDATE "connector" 
            SET "created_at" = NOW(), "updated_at" = NOW() 
            WHERE "created_at" IS NULL OR "updated_at" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove audit columns from connector table
        await queryRunner.query(`
            ALTER TABLE "connector" 
            DROP COLUMN IF EXISTS "created_at",
            DROP COLUMN IF EXISTS "updated_at",
            DROP COLUMN IF EXISTS "created_by",
            DROP COLUMN IF EXISTS "updated_by"
        `);
    }

}
