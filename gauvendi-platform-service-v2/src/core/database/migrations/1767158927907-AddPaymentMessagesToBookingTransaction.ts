import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentMessagesToBookingTransaction1767158927907 implements MigrationInterface {
  name = 'AddPaymentMessagesToBookingTransaction1767158927907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_transaction" ADD "payment_messages" jsonb DEFAULT '[]'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "booking_transaction" DROP COLUMN "payment_messages"`);
  }
}
