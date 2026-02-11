import { DbName } from '@constants/db-name.constant';
import { HotelConfiguration } from '@entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheModule } from '@src/core/cache/redis-cache.module';
import { RedisModule } from '@src/core/redis/redis.module';
import { RoomProductAvailabilityModule } from '../room-product-availability/room-product-availability.module';
import { RoomProductPricingMethodDetailModule } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.module';
import { RoomUnitModule } from '../room-unit/room-unit.module';
import { HotelConfigurationsController } from './hotel-configurations.controller';
import { HotelConfigurationsService } from './hotel-configurations.service';
import { HotelConfigurationSharedModule } from '../hotel-configuration/hotel-configuration-shared.module';

@Module({
  controllers: [HotelConfigurationsController],
  providers: [HotelConfigurationsService],
  imports: [
    HotelConfigurationSharedModule,
    TypeOrmModule.forFeature([HotelConfiguration, Hotel], DbName.Postgres),
    RoomProductAvailabilityModule,
    RoomUnitModule,
    RoomProductPricingMethodDetailModule,
    RedisModule,
    RedisCacheModule
  ]
})
export class HotelConfigurationsModule {}
