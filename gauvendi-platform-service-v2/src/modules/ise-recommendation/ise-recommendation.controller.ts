import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoomProductPricingRequestDto } from '../room-product-rate-plan/room-product-selling-price/room-product-selling-price.dto';
import {
  CalculateRoomProductRatePlanPricingDto,
  StayOptionDetailsDto,
  StayOptionsDto
} from './ise-recommendation.dto';
import { IseRecommendationService } from './ise-recommendation.service';
import { StayOptionService } from './stay-option.service';

@Controller('ise-recommendation')
export class IseRecommendationController {
  constructor(
    private readonly iseRecommendationService: IseRecommendationService,
    private readonly stayOptionService: StayOptionService
  ) {}

  @MessagePattern({ cmd: 'get_nearest_bookable_date' })
  async getNearestBookableDate(@Payload() payload: { hotelCode: string; fromDate: string }) {
    return await this.stayOptionService.getNearestBookableDate(payload);
  }

  @MessagePattern({ cmd: 'get_ise_recommendation_stay_options' })
  async getIseRecommendationStayOptions(@Payload() payload: StayOptionsDto) {
    return await this.stayOptionService.getIseRecommendationStayOptions(payload);
  }

  @MessagePattern({ cmd: 'get_ise_recommendation_stay_option_details' })
  async getIseRecommendationStayOptionDetails(@Payload() payload: StayOptionDetailsDto) {
    return await this.stayOptionService.getIseRecommendationStayOptionDetails(payload);
  }

  @MessagePattern({ cmd: 'calculate_room_product_rate_plan_pricing' })
  async calculateRoomProductRatePlanPricing(
    @Payload() payload: CalculateRoomProductRatePlanPricingDto
  ) {
    return await this.stayOptionService.calculateRoomProductRatePlanPricing(
      payload.hotelId,
      payload.roomProductRatePlanIds,
      payload.fromDate,
      payload.toDate,
      payload.totalAdult,
      payload.childAgeList,
      payload.totalPet,
      payload.hotelConfigRoundingMode,
      payload.isIsePricingDisplay
    );
  }

  @MessagePattern({ cmd: 'get_lowest_price_calendar' })
  async getLowestPriceCalendar(@Payload() query: RoomProductPricingRequestDto) {
    return await this.stayOptionService.getLowestPriceCalendarV2(query);
  }
}
