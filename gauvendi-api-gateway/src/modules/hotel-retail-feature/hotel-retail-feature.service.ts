import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { HotelRetailFeaturesInputDto } from "./hotel-retail-feature.dto";

@Injectable()
export class HotelRetailFeatureService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getCppRetailFeatures(query: HotelRetailFeaturesInputDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_RETAIL_FEATURE.GET_CPP_RETAIL_FEATURES }, query);
  }

  migrateTranslation() {
    return this.clientProxy.send({ cmd: "hotel_retail_features_migrate_translation" }, {});
  }
}
