import { RoomRequestDto } from "@src/core/dtos/room-request.dto";


export interface CppRatePlanFilterDto {
  arrival: string;
  departure: string;
  featureCodeList: string[];
  promoCodeList?: string[];
  hotelId: string;
  roomRequestList: RoomRequestDto[];
  translateTo?: string
}

export interface CppRatePlanResultDto {
  id: string;
  name: string;
  code: string;
  description: string;
  promoCodeList: string[];
  availableProducts: number;
  appliedPromoCodeList: string[] | null;
}
