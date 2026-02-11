import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelCancellationPolicy } from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelCancellationPolicyRepository } from '../repositories/hotel-cancellation-policy.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([HotelCancellationPolicy], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelCancellationPolicyRepository],
  exports: [HotelCancellationPolicyRepository]
})
export class HotelCancellationPolicySharedModule {}
