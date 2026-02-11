import { RoundingModeEnum } from 'src/core/enums/common';

export class HotelPricingDecimalRoundingRuleDto {
  decimalUnits: number = 2;
  roundingMode: RoundingModeEnum = RoundingModeEnum.HALF_ROUND_UP;
}
