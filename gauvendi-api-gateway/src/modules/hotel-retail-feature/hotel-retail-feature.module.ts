import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { HotelRetailFeatureController } from "./hotel-retail-feature.controller";
import { HotelRetailFeatureService } from "./hotel-retail-feature.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [HotelRetailFeatureController],
  providers: [HotelRetailFeatureService],
})
export class HotelRetailFeatureModule {}
