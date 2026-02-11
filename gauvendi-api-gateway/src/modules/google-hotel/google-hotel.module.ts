import { Module } from '@nestjs/common';
import { GoogleHotelService } from './google-hotel.service';
import { GoogleHotelController } from './google-hotel.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [GoogleHotelController],
  providers: [GoogleHotelService],
  imports: [PlatformClientModule]
})
export class GoogleHotelModule {}
