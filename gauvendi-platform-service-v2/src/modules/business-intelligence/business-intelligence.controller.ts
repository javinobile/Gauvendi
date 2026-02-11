import { Controller } from '@nestjs/common';
import { BusinessIntelligenceService } from './business-intelligence.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';

@Controller()
export class BusinessIntelligenceController {
  constructor(private readonly businessIntelligenceService: BusinessIntelligenceService) {}

  @MessagePattern({ cmd: CMD.BUSINESS_INTELLIGENCE.GENERATE_QUICKSIGHT_DASHBOARD_URL })
  async generateQuicksightDashboardUrl() {
    return await this.businessIntelligenceService.generateQuicksightDashboardUrl();
  }

}
