import { Controller, Get, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { QueryHotelRetailFeaturesDto } from './hotel-retail-features.dto';
import { HotelRetailFeaturesService } from './hotel-retail-features.service';

@Controller('hotel-retail-features')
export class HotelRetailFeaturesController {
  constructor(private readonly hotelRetailFeaturesService: HotelRetailFeaturesService) {}

  @Get('')
  getAllHotelRetailFeatures(@Query() query: QueryHotelRetailFeaturesDto) {
    return this.hotelRetailFeaturesService.getAllHotelRetailFeatures(query);
  }

  @MessagePattern({ cmd: CMD.HOTEL_RETAIL_FEATURE.GET_CPP_RETAIL_FEATURES })
  async getCppRetailFeatures(@Payload() query: QueryHotelRetailFeaturesDto) {
    return this.hotelRetailFeaturesService.getCppRetailFeatures(query);
  }

  @MessagePattern({ cmd: 'hotel_retail_features_migrate_translation' })
  async migrateTranslation() {
    return this.hotelRetailFeaturesService.migrateTranslation();
  }
}
