import { RoundingModeEnum } from "../enums/common";

export class HotelPricingDecimalRoundingRuleDto {
    decimalUnits: number = 2;
    roundingMode: RoundingModeEnum = RoundingModeEnum.HALF_ROUND_UP;
  }