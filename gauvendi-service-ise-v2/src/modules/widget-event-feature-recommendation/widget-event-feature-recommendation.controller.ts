import { Controller, Get, Query } from '@nestjs/common';
import { WidgetEventFeatureRecommendationService } from './widget-event-feature-recommendation.service';
import { WidgetEventFeatureRecommendationDto } from './widget-event-feature-recommendation.dto';

@Controller('widget-event-feature-recommendation')
export class WidgetEventFeatureRecommendationController {
  constructor(private readonly widgetEventFeatureRecommendationService: WidgetEventFeatureRecommendationService) {}

  @Get()
  async getWidgetEventFeatureRecommendation(@Query() query: WidgetEventFeatureRecommendationDto) {
    return this.widgetEventFeatureRecommendationService.getWidgetEventFeatureRecommendation(query);
  }
}
