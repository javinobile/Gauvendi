import { Controller, Get } from '@nestjs/common';
import { BusinessIntelligenceService } from './business-intelligence.service';

@Controller('business-intelligence')
export class BusinessIntelligenceController {
  constructor(private readonly businessIntelligenceService: BusinessIntelligenceService) {}

  @Get("generate-quicksight-dashboard-url")
  generateQuicksightDashboardUrl() {
    return this.businessIntelligenceService.generateQuicksightDashboardUrl();
  }

}
