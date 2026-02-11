import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { NearestBookableDateDto, StayOptionDetailsDto, StayOptionsDto } from './ise-recommendation.dto';
import { IseRecommendationService } from './ise-recommendation.service';

@Controller('ise-recommendation')
export class IseRecommendationController {
  constructor(private readonly iseRecommendationService: IseRecommendationService) {}

  @Post('nearest-bookable-date')
  getNearestBookableDate(@Body() body: NearestBookableDateDto) {
    try {
      return this.iseRecommendationService.getNearestBookableDate(body);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Post('stay-options')
  getStayOptions(@Body() body: StayOptionsDto) {
    try {
      return this.iseRecommendationService.getStayOptions(body);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Post('stay-option-details')
  getStayOptionDetails(@Body() body: StayOptionDetailsDto) {
    try {
      return this.iseRecommendationService.getStayOptionDetails(body);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
