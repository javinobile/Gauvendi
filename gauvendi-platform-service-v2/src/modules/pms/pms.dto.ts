import { ConnectorTypeEnum, RoomProductStatus, RoomProductType } from '@src/core/enums/common';
import { RestrictionConditionType, Weekday } from 'src/core/entities/restriction.entity';
import { RoomUnitAvailabilityStatus } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomUnitStatus } from 'src/core/entities/room-unit.entity';
import { ModeEnumQuery } from '../room-product-restriction/room-product-restriction.dto';

export interface RoomProductMappingDto {
  roomProductMappingPmsCode: string;
  name: string;
  description?: string;
  productType?: RoomProductType;
  productCapacity?: number;
  productExtraCapacity?: number;
  ordering?: number;
  status?: RoomProductStatus;
  rawData?: any; // the raw data from pms response
}

export interface RatePlanMappingDto {
  ratePlanMappingPmsCode: string;
  name: string;
  metadata: any;
}

export interface RoomProductAvailabilityMappingDto {
  roomProductMappingPmsCode: string;
  date: string;
  available: number;
  adjustment: number;
}

export interface RoomUnitMappingDto {
  roomUnitMappingPmsCode: string;
  name: string;
  floor: string;
  locationNotes: string;
  status: RoomUnitStatus;
  roomProductMappingPmsCode?: string;
  rawData?: any; // the raw data from pms response
}

export interface RoomUnitMaintenanceMappingDto {
  roomUnitMappingPmsCode: string;
  dates: string[];
  type: RoomUnitAvailabilityStatus;
  maintenanceId?: string | null;
}
export interface RestrictionMappingDto {
  roomProductMappingPmsCode?: string;
  ratePlanMappingPmsCode?: string;
  fromDate?: string;
  toDate?: string;
  type?: RestrictionConditionType | null;
  weekdays: Weekday[];
  minLength?: number | null;
  maxLength?: number | null;
  minAdv?: number | null;
  maxAdv?: number | null;
  minLosThrough?: number | null;

  connectorType?: ConnectorTypeEnum;
}

export interface RestrictionQueryDto {
  hotelId: string;
  startDate: string;
  endDate: string;
  mode?: ModeEnumQuery;
  pmsRatePlanCodes?: string[];
}

export interface RatePlanPricingMappingDto {
  roomProductMappingPmsCode: string;
  date: string;
  netPrice: number;
  grossPrice: number;
  ratePlanMappingPmsCode: string;
  pricingMode: 'Gross' | 'Net';
}

export interface RatePlanPricingPushDto {
  roomProductMappingPmsCode: string;
  ratePlanMappingPmsCode: string;
  date: string;
  price: number;
  currency: string;
}

export interface RatePlanPricingQueryDto {
  hotelId: string;
  startDate: string;
  endDate: string;

  ratePlanMappingPmsCode: string;
}

export interface UpdatePmsAvailabilityDto {
  pmsRoomProductMappingCode: string;
  startDate: string;
  endDate: string;
  adjustment: number;
}

export class AuthorizeConnectorDto {
  connectorType: ConnectorTypeEnum;
  hotelCode: string;
  authorizationCode?: string;
  refreshToken?: string;
  redirectUrl?: string;
  accountCode?: string;
}

export class GetPmsHotelListDto {
  hotelCode: string;
}

export class CreateMappingHotelDto {
  connectorType: ConnectorTypeEnum;
  hotelCode: string;
  mappingHotelCode: string;
}

export class DeauthorizeConnectorDto {
  connectorType: ConnectorTypeEnum;
  hotelCode: string;
}