import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingMetaTrackingTableSafe1767797104000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Idempotent - won't fail if table already exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "booking_meta_tracking" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" UUID NOT NULL,
        "user_agent" VARCHAR(1000),
        "browser_ip" VARCHAR(100),
        "fbp" VARCHAR(255),
        "fbc" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_by" TEXT NOT NULL DEFAULT 'SYSTEM',
        "updated_by" TEXT NOT NULL DEFAULT 'SYSTEM',
        CONSTRAINT "pk_booking_meta_tracking" PRIMARY KEY ("id"),
        CONSTRAINT "fk_booking_meta_tracking_booking" FOREIGN KEY ("booking_id")
          REFERENCES "booking" ("id") ON DELETE CASCADE,
        CONSTRAINT "uq_booking_meta_tracking_booking_id" UNIQUE ("booking_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_booking_meta_tracking_booking_id"
      ON "booking_meta_tracking" ("booking_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_booking_meta_tracking_booking_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "booking_meta_tracking"`);
  }
}
