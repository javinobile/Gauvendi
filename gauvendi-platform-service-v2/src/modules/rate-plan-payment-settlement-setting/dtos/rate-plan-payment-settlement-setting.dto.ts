import { ApiProperty } from '@nestjs/swagger';
import { RatePlanPaymentSettlementSettingModeEnum } from 'src/core/enums/common';

export class RatePlanPaymentSettlementSettingDto {
  @ApiProperty({
    description: 'Unique identifier for the rate plan payment settlement setting',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Hotel ID (maps from Java propertyId)',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  hotelId: string;

  @ApiProperty({
    description: 'Rate plan ID (maps from Java salesPlanId)',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  ratePlanId: string;

  @ApiProperty({
    description: 'Payment settlement mode',
    enum: RatePlanPaymentSettlementSettingModeEnum,
    example: RatePlanPaymentSettlementSettingModeEnum.PMS_SETTLEMENT
  })
  mode: RatePlanPaymentSettlementSettingModeEnum;
}

export class GetRatePlanPaymentSettlementSettingDto {
  hotelId: string;
  ratePlanId: string;
}
