import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTableCustomerPaymentGateway1769408309510 implements MigrationInterface {
    name = 'AlterTableCustomerPaymentGateway1769408309510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_payment_gateway" ALTER COLUMN "ref_payment_customer_id" TYPE TEXT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_payment_gateway" ALTER COLUMN "ref_payment_customer_id" TYPE UUID`);

    }

}
