export class PushAvailabilitySmDto {
  propertyId: string;
  roomProductId: string;
  startDate: string;
  endDate: string;
  bookingLimit: number;
}

export class PushRestrictionSmDto {
  propertyId: string;
  roomProductId: string;
  startDate: string;
  salePlanId: string;
  endDate: string;
  restriction: {
    status?: "Open" | "Close"; // general status
    arrival?: "Open" | "Close";
    departure?: "Open" | "Close";
    minLOS?: number;
    maxLOS?: number;
  };
}
