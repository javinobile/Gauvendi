import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { GlobalPaymentMethod } from '@src/core/entities/hotel-entities/global-payment-method.entity';
import { GlobalPaymentMethodRepository } from '../repositories/global-payment-method.repository';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalPaymentMethod], DbName.Postgres)],
  providers: [GlobalPaymentMethodRepository],
  exports: [GlobalPaymentMethodRepository]
})
export class GlobalPaymentMethodSharedModule {}
