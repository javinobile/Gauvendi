import { Module } from '@nestjs/common';
import { HotelAmenityService } from './hotel-amentity.service';
import { HotelAmenitySharedModule } from './modules/hotel-amenity-shared.module';
import { HotelAmenityController } from './controllers/hotel-amenity.controller';
import { PmsModule } from '../pms/pms.module';

@Module({
  imports: [HotelAmenitySharedModule, PmsModule],
  providers: [HotelAmenityService],
  exports: [HotelAmenityService],
  controllers: [HotelAmenityController]
})
export class HotelAmenityModule {}
