import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { NearestBookableDateDto, StayOptionsDto } from "./ise-recommendation.dto";

@Injectable()
export class IseRecommendationService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getNearestBookableDate(body: NearestBookableDateDto) {
    return this.platformClient.send({ cmd: "get_nearest_bookable_date" }, body);
  }

  getStayOptions(body: StayOptionsDto) {
    return this.platformClient.send({ cmd: "get_ise_recommendation_stay_options" }, body);
  }
}
