import { Controller, Get, Post, Query } from '@nestjs/common';
import { QueryHotelRetailFeaturesDto } from './hotel-retail-features.dto';
import { HotelRetailFeaturesService } from './hotel-retail-features.service';

@Controller('hotel-retail-features')
export class HotelRetailFeaturesController {
  constructor(private readonly hotelRetailFeaturesService: HotelRetailFeaturesService) {}

  @Get('')
  getAllHotelRetailFeatures(@Query() query: QueryHotelRetailFeaturesDto) {
    return this.hotelRetailFeaturesService.getAllHotelRetailFeatures(query);
  }

  @Post('sync-image-url')
  async syncImageUrl() {
    return this.hotelRetailFeaturesService.syncImageUrlStandard();
  }
}
