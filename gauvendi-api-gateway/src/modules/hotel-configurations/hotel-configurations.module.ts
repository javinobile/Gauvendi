import { Module } from '@nestjs/common';
import { HotelConfigurationsController } from './hotel-configurations.controller';
import { HotelConfigurationsService } from './hotel-configurations.service';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [HotelConfigurationsController],
  providers: [HotelConfigurationsService],
  imports: [PlatformClientModule],
})
export class HotelConfigurationsModule {}
