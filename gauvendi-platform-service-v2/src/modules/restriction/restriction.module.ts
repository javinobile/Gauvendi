import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelRestrictionIntegrationSetting } from '@src/core/entities/hotel-restriction-integration-setting.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelRestrictionSetting } from 'src/core/entities/hotel-restriction-setting.entity';
import { RatePlanDerivedSetting } from 'src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { Restriction } from 'src/core/entities/restriction.entity';
import { RoomProductMappingPms } from 'src/core/entities/room-product-mapping-pms.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { PmsModule } from '../pms/pms.module';
import { RestrictionConsumer } from './restriction.consumer';
import { RestrictionController } from './restriction.controller';
import { RestrictionService } from './restriction.service';
import { RoomProductRestrictionModule } from '../room-product-restriction/room-product-restriction.module';

@Module({
  controllers: [RestrictionController],
  providers: [RestrictionService, RestrictionConsumer],
  exports: [RestrictionService],
  imports: [
    TypeOrmModule.forFeature(
      [
        Restriction,
        RoomProductMappingPms,
        HotelRestrictionSetting,
        RatePlan,
        RoomProduct,
        RatePlanDerivedSetting,
        RoomProductRatePlan,
        HotelConfiguration,
        Hotel,
        HotelRestrictionIntegrationSetting
      ],
      DbName.Postgres
    ),
    PmsModule,
    forwardRef(() => RoomProductRestrictionModule),
  ]
})
export class RestrictionModule {}
