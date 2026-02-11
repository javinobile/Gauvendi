import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelCancellationPolicy } from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelRepositoryModule } from 'src/modules/hotel/modules/hotel-repository.module';
import { HotelCancellationPolicyRepository } from '../repositories/hotel-cancellation-policy.repository';

@Module({
  imports: [
    HotelRepositoryModule,
    TypeOrmModule.forFeature([HotelCancellationPolicy], DbName.Postgres),
    ConfigModule
  ],
  providers: [HotelCancellationPolicyRepository],
  exports: [HotelCancellationPolicyRepository]
})
export class HotelCancellationPolicySharedModule {}
