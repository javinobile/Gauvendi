import { Controller, Get, Query } from "@nestjs/common";
import { HotelRetailFeaturesInputDto } from "./hotel-retail-feature.dto";
import { HotelRetailFeatureService } from "./hotel-retail-feature.service";
import { Public } from "@src/core/decorators/is-public.decorator";

@Controller("hotel-retail-feature")
export class HotelRetailFeatureController {
  constructor(private readonly hotelRetailFeatureService: HotelRetailFeatureService) {}

  @Get("cpp-retail-features")
  getCppRetailFeatures(@Query() query: HotelRetailFeaturesInputDto) {
    return this.hotelRetailFeatureService.getCppRetailFeatures(query);
  }

  @Get("migrate-translation")
  @Public()
  migrateTranslation() {
    return this.hotelRetailFeatureService.migrateTranslation();
  }

}
