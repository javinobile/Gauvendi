import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { HotelAmenityController } from "./hotel-amenity.controller";
import { HotelAmenityService } from "./hotel-amenity.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [HotelAmenityController],
  providers: [HotelAmenityService],
})
export class HotelAmenityModule {}
