import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";

@Injectable()
export class BusinessIntelligenceService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  generateQuicksightDashboardUrl() {
    return this.platformClient.send({ cmd: CMD.BUSINESS_INTELLIGENCE.GENERATE_QUICKSIGHT_DASHBOARD_URL }, {});
  }
}
