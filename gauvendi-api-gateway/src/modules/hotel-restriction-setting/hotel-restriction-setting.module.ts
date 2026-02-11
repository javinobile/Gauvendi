import { Module } from '@nestjs/common';
import { HotelRestrictionSettingService } from './hotel-restriction-setting.service';
import { HotelRestrictionSettingController } from './hotel-restriction-setting.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [HotelRestrictionSettingController],
  providers: [HotelRestrictionSettingService],
  imports: [PlatformClientModule]
})
export class HotelRestrictionSettingModule {}
