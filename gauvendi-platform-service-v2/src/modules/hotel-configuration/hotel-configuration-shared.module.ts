import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelConfiguration } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { HotelConfigurationRepository } from './hotel-configuration.repository';
import { RedisCacheModule } from '@src/core/cache/redis-cache.module';
import { RedisModule } from '@src/core/redis';

@Module({
  imports: [
    TypeOrmModule.forFeature([HotelConfiguration, Hotel], DB_NAME.POSTGRES),
    ConfigModule,
    RedisModule,
    RedisCacheModule
  ],
  providers: [HotelConfigurationRepository],
  exports: [HotelConfigurationRepository]
})
export class HotelConfigurationSharedModule {}
