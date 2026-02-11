import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Connector } from '@src/core/entities/hotel-entities/connector.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelRestrictionIntegrationSetting } from '@src/core/entities/hotel-restriction-integration-setting.entity';
import { HotelRestrictionSetting } from '@src/core/entities/hotel-restriction-setting.entity';
import { Restriction } from '@src/core/entities/restriction.entity';
import { HotelConfigurationSharedModule } from '../hotel-configuration/hotel-configuration-shared.module';
import { PmsModule } from '../pms/pms.module';
import { RestrictionModule } from '../restriction/restriction.module';
import { HotelRestrictionSettingController } from './hotel-restriction-setting.controller';
import { HotelRestrictionSettingService } from './hotel-restriction-setting.service';

@Module({
  controllers: [HotelRestrictionSettingController],
  providers: [HotelRestrictionSettingService],
  imports: [
    HotelConfigurationSharedModule,
    TypeOrmModule.forFeature(
      [
        HotelRestrictionSetting,
        HotelRestrictionIntegrationSetting,
        Restriction,
        HotelConfiguration,
        Connector
      ],
      DbName.Postgres
    ),
    PmsModule,
    RestrictionModule
  ],
})
export class HotelRestrictionSettingModule {}
