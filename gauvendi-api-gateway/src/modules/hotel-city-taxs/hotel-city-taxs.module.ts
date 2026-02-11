import { Module } from '@nestjs/common';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';
import { HotelCityTaxsService } from './hotel-city-taxs.service';
import { HotelCityTaxsController } from './hotel-city-taxs.controller';

@Module({
  controllers: [HotelCityTaxsController],
  providers: [HotelCityTaxsService],
  imports: [PlatformClientModule],
})
export class HotelCityTaxsModule {}
