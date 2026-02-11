import { Controller, Post, Body } from '@nestjs/common';
import { IseRecommendationService } from './ise-recommendation.service';
import { NearestBookableDateDto, StayOptionsDto } from './ise-recommendation.dto';

@Controller('ise-recommendation')
export class IseRecommendationController {
  constructor(private readonly iseRecommendationService: IseRecommendationService) {}

  @Post('nearest-bookable-date')
  async getNearestBookableDate(@Body() body: NearestBookableDateDto) {
    return this.iseRecommendationService.getNearestBookableDate(body);
  }

  @Post('stay-options')
  async getStayOptions(@Body() body: StayOptionsDto) {
    return this.iseRecommendationService.getStayOptions(body);
}
}
