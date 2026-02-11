export type RoomProductRatePlanExtraOccupancyRateDailyFilter = {
  hotelId: string;
  fromDate: string;
  toDate: string;
  roomProductRatePlanIds: string[];
};

export type RoomProductRatePlanExtraOccupancyRateDto = {
  extraPeople: number;
  extraRate: number;
}


export type RoomProductRatePlanDailyExtraOccupancyRateDto = {
  roomProductRatePlanId: string;
  date: Date;
  extraOccupancyRateList: RoomProductRatePlanExtraOccupancyRateDto[];
}
