import { Module } from "@nestjs/common";
import { BusinessIntelligenceService } from "./business-intelligence.service";
import { BusinessIntelligenceController } from "./business-intelligence.controller";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";

@Module({
  imports: [PlatformClientModule],
  controllers: [BusinessIntelligenceController],
  providers: [BusinessIntelligenceService],
})
export class BusinessIntelligenceModule {}
