import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { RestrictionAutomationSetting } from '@src/core/entities/restriction-automation-setting.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RedisModule } from '@src/core/redis/redis.module';
import { DbName } from 'src/core/constants/db-name.constant';
import { Restriction } from 'src/core/entities/restriction.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { HotelConfigurationSharedModule } from '../hotel-configuration/hotel-configuration-shared.module';
import { RestrictionModule } from '../restriction/restriction.module';
import { RoomProductRestrictionController } from './room-product-restriction.controller';
import { RoomProductRestrictionService } from './room-product-restriction.service';

@Module({
  controllers: [RoomProductRestrictionController],
  providers: [RoomProductRestrictionService],
  imports: [
    HotelConfigurationSharedModule,
    TypeOrmModule.forFeature(
      [
        RoomProductDailyAvailability,
        RoomProduct,
        Restriction,
        RestrictionAutomationSetting,
        HotelConfiguration,
        RoomProductAssignedUnit
      ],
      DbName.Postgres
    ),
    forwardRef(() => RestrictionModule),
    RedisModule
  ],
  exports: [RoomProductRestrictionService]
})
export class RoomProductRestrictionModule {}
