import { Module } from '@nestjs/common';
import { BusinessIntelligenceService } from './business-intelligence.service';
import { BusinessIntelligenceController } from './business-intelligence.controller';

@Module({
  controllers: [BusinessIntelligenceController],
  providers: [BusinessIntelligenceService],
})
export class BusinessIntelligenceModule {}
