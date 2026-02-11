import { HotelConfigurationTypeEnum } from '@src/core/enums/common';

export class HotelConfigurationFilterDto {
  hotelId: string;
}

export class HotelConfigurationDetailDto {
  colorCode?: string;
  title?: string;
  shortDescription?: string;
  content?: string;
  priorityWeightList?: number[];
  penaltyScore?: number;
  matchingScoreDisplay?: number;
  numberOfResultDisplay?: number;
  value?: string;
  vatValue?: number;
  minChildrenAge?: number;
  maxChildrenAge?: number;
  maxChildrenCapacity?: number;
  metadata?: Record<string, any>;
}

export class HotelConfigurationDto {
  id?: string;
  configType?: HotelConfigurationTypeEnum;
  configValue?: HotelConfigurationDetailDto;
  deletedAt?: Date | null;
  hotelId?: string;
  configTypes?: HotelConfigurationTypeEnum[];
}
