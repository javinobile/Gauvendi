import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelConfiguration } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { HotelConfigurationRepository } from './repositories/hotel-configuration.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelConfiguration, Hotel], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelConfigurationRepository],
  exports: [HotelConfigurationRepository]
})
export class HotelConfigurationSharedModule {}
