import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { GlobalPaymentProvider } from '@src/core/entities/hotel-entities/global-payment-provider.entity';
import { GlobalPaymentProviderRepository } from '../repositories/global-payment-provider.repository';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalPaymentProvider], DbName.Postgres)],
  providers: [GlobalPaymentProviderRepository],
  exports: [GlobalPaymentProviderRepository]
})
export class GlobalPaymentProviderSharedModule {}
