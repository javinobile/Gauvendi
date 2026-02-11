export class RatePlanDto {
  id?: string;
  hotelId?: string;
  code?: string;
}

export class RfcRatePlanDto {
  hotelId: string;
  roomProductIds: string[];
}
