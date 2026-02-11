import { ApiProperty } from '@nestjs/swagger';
import { TaxSettingEnum } from '@src/core/enums/common';
import { IsString, IsNumber, IsEnum } from 'class-validator';

export class MonthlyRatePlanOverviewResponseDto {
  @ApiProperty({ description: 'Property ID', example: '3efd68e5-043d-46ae-9f8f-6fbf91da7865' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Month name', example: 'OCTOBER' })
  @IsString()
  month: string;

  @ApiProperty({ description: 'Occupancy rate (decimal)', example: 0.34 })
  @IsNumber()
  occupancy: number;

  @ApiProperty({ description: 'Average Daily Rate', example: 208.03 })
  @IsNumber()
  adr: number;

  @ApiProperty({ description: 'Total room revenue', example: 6449 })
  @IsNumber()
  totalRoomRevenue: number;

  @ApiProperty({ description: 'Seven day occupancy pace trend', example: 0.02 })
  @IsNumber()
  sevenDayOccupancyPaceTrend: number;

  @ApiProperty({ description: 'Seven day pickup ADR', example: -172.23 })
  @IsNumber()
  sevenDayPickupAdr: number;

  @ApiProperty({ description: 'Seven day average daily room pickup', example: 0 })
  @IsNumber()
  sevenDayAvgDailyRoomPickup: number;

  @ApiProperty({ description: 'Year', example: '2025' })
  @IsString()
  year: string;

  @ApiProperty({ description: 'Total room nights', example: 31 })
  @IsNumber()
  roomNights: number;

  @ApiProperty({ description: 'Seven day room nights', example: 0 })
  @IsNumber()
  sevenDayRoomNights: number;

  @ApiProperty({ description: 'Seven day cancellation count', example: 0 })
  @IsNumber()
  sevenDayCancellationCount: number;

  @ApiProperty({ description: 'Seven day pickup ADR before', example: 380.26 })
  @IsNumber()
  sevenDayPickupAdrBefore: number;

  @ApiProperty({ description: 'Seven day occupancy pace trend before', example: 0.34 })
  @IsNumber()
  sevenDayOccupancyPaceTrendBefore: number;

  @ApiProperty({ description: 'Amenity revenue', example: 0 })
  @IsNumber()
  amenityRevenue: number;

  @ApiProperty({ description: 'Accommodation revenue', example: 0 })
  @IsNumber()
  accommodationRevenue: number;

  @ApiProperty({ description: 'Growth revenue', example: 0 })
  @IsNumber()
  growthRevenue?: number;

  @ApiProperty({ description: 'Seven day accommodation revenue', example: 0 })
  @IsNumber()
  sevenDayAccommodationRevenue?: number;

  @ApiProperty({ description: 'Seven day extra', example: 0 })
  @IsNumber()
  sevenDayExtra?: number;

  @ApiProperty({})
  @IsEnum(TaxSettingEnum)
  hotelTaxSetting: TaxSettingEnum;
}
