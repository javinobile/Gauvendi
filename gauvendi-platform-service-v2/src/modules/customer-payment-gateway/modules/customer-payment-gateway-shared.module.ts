import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { CustomerPaymentGateway } from 'src/core/entities/booking-entities/customer-payment-gateway.entity';
import { CustomerPaymentGatewayRepository } from '../repositories/customer-payment-gateway.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerPaymentGateway], DB_NAME.POSTGRES), ConfigModule],
  providers: [CustomerPaymentGatewayRepository],
  exports: [CustomerPaymentGatewayRepository]
})
export class CustomerPaymentGatewaySharedModule {}
