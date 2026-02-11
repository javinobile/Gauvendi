import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CalculatePricingAmenityPayload } from '../dtos/calculate-pricing-amenity-payload.dto';
import { CalculateAmenityPricingService } from '../services/calculate-amenity-pricing.service';

@Controller('calculate-amenity-pricing')
export class CalculateAmenityPricingController {
  constructor(private readonly calculateAmenityPricingService: CalculateAmenityPricingService) {}

  @MessagePattern({ cmd: 'calculate_amenity_pricing' })
  async calculateAmenityPricing(
    @Payload()
    payload: CalculatePricingAmenityPayload
  ) {
    return await this.calculateAmenityPricingService.calculatePricingAmenity(
      payload.input,
      payload.hotelConfigRoundingMode
    );
  }
}
