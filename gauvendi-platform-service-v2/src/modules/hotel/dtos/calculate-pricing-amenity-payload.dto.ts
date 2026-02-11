import { RoundingModeEnum } from '@src/core/enums/common';
import { CalculatePricingAmenityInput } from './hotel-amenity.dto';

export interface CalculatePricingAmenityPayload {
  input: CalculatePricingAmenityInput;
  hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number };
}
