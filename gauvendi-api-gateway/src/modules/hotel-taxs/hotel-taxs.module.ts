import { Module } from '@nestjs/common';
import { HotelTaxsService } from './hotel-taxs.service';
import { HotelTaxsController } from './hotel-taxs.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [HotelTaxsController],
  providers: [HotelTaxsService],
  imports: [PlatformClientModule],
})
export class HotelTaxsModule {}
