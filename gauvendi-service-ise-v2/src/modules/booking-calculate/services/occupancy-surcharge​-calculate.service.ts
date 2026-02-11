import { BadRequestException, Injectable } from '@nestjs/common';
import { formatDate } from 'date-fns';
import { DATE_FORMAT } from 'src/core/constants/date.constant';
import { HotelAgeCategory } from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { Helper } from 'src/core/helper/utils';
import { groupByToMap } from 'src/core/utils/group-by.util';
import { RoomProductRatePlanRepository } from 'src/modules/hotel-rate-plan/repositories/room-product-rate-plan.repository';
import { RoomProductRepository } from 'src/modules/room-product/repositories/room-product.repository';

export class ExtraOccupancyRateDto {
  extraPeople: number;
  extraRate: number;
}

export class DailyExtraOccupancyRateDto {
  date: Date;
  roomProductId: string;
  ratePlanId: string;
  roomProductRatePlanId: string;
  extraOccupancyRates: ExtraOccupancyRateDto[];
}

export type DailyOccupancySurchargeRateFilter = {
  fromDate: string;
  toDate: string;
  roomProductRatePlans: RoomProductRatePlan[];
};

export type CalculateExtraOccupancySurchargeInput = {
  fromDate: string;
  toDate: string;
  roomProductRatePlans: RoomProductRatePlan[];
  rates: DailyExtraOccupancyRateDto[];
  ageCategories: HotelAgeCategory[];
  childrenAges: number[];
  adults: number;
  serviceChargeRate?: number; // 0
  serviceChargeTaxRate?: number; // 0
};

export type ExtraOccupancySurchargePriceDto = {
  date: string;
  roomProductId: string;
  ratePlanId: string;
  roomProductRatePlanId: string;
  extraOccupancySurcharge: number;
};

type GuestCount = number;
type ExtraOccupancySurcharge = number;

@Injectable()
export class OccupancySurchargeCalculateService {
  constructor(

    private readonly roomProductRepository: RoomProductRepository,
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository
  ) {}

  extraPeopleList = [2, 3, 4, 5, 6, 7, 8, 9, 10];

  calculateExtraOccupancySurcharge(
    input: CalculateExtraOccupancySurchargeInput
  ): ExtraOccupancySurchargePriceDto[] {
    const {
      fromDate,
      toDate,
      roomProductRatePlans,
      rates,
      serviceChargeRate = 0,
      serviceChargeTaxRate = 0,
  
      ageCategories,
      adults,
      childrenAges,
    } = input;

    const dailyRatePlanExtraOccupancyRateMap = groupByToMap(rates, (r) =>
      formatDate(r.date, DATE_FORMAT)
    );

    // Tính guestCount = adults + số children được phép
    const guestCount = this.calculateGuestCount(adults, childrenAges, ageCategories);

    const result: ExtraOccupancySurchargePriceDto[] = [];
    for (const roomProductRatePlan of roomProductRatePlans) {
      const rangeDates = Helper.generateDateRange(fromDate, toDate);
      for (const date of rangeDates) {
        let extraOccupancySurchargeAmount = 0;
        if (guestCount > 1) {
          const dailyExtraOccupancyRateList = (
            dailyRatePlanExtraOccupancyRateMap.get(date) || []
          ).filter((r) => r.roomProductRatePlanId === roomProductRatePlan.id);
          const dailyExtraOccupancyRateMap = new Map<GuestCount, ExtraOccupancySurcharge>();

          dailyExtraOccupancyRateList.forEach((dailyRate) => {
            dailyRate.extraOccupancyRates.forEach((extraOcc) => {
              dailyExtraOccupancyRateMap.set(extraOcc.extraPeople, extraOcc.extraRate);
            });
          });

          for (let i = 1; i <= guestCount; i++) {
            const extraOccupancySurcharge = dailyExtraOccupancyRateMap.get(i) || 0;
            extraOccupancySurchargeAmount += extraOccupancySurcharge;
          }
        }

        result.push({
          date: date,
          roomProductId: roomProductRatePlan.roomProductId,
          ratePlanId: roomProductRatePlan.ratePlanId,
          roomProductRatePlanId: roomProductRatePlan.id,
          extraOccupancySurcharge: extraOccupancySurchargeAmount
        });
      }
    }

    return result;
  }

  /**
   * Tính tổng số khách (guest count) = adults + children được phép
   * 
   * Children được phép là những trẻ có độ tuổi nằm trong khoảng fromAge-toAge
   * của HotelAgeCategory có isIncludeExtraOccupancyRate = true
   * 
   * @param adults - Số người lớn
   * @param childrenAges - Mảng độ tuổi của trẻ em
   * @param ageCategories - Danh sách các age categories của hotel
   * @returns Tổng số khách được tính phụ thu
   */
  calculateGuestCount(
    adults: number,
    childrenAges: number[],
    ageCategories: HotelAgeCategory[]
  ): number {

    let guestCount = adults || 0;

    if (!childrenAges || childrenAges.length === 0 || !ageCategories || ageCategories.length === 0) {
      return guestCount;
    }

    const allowedCategories = ageCategories.filter(
      (category) => category.isIncludeExtraOccupancyRate === true
    );

    if (allowedCategories.length === 0) {
      return guestCount;
    }

    const allowedChildrenCount = childrenAges.filter((childAge) => {

      return allowedCategories.some((category) => {
        const fromAge = category.fromAge ?? 0;
        const toAge = category.toAge ?? 999;
        return childAge >= fromAge && childAge <= toAge;
      });
    }).length;

    guestCount += allowedChildrenCount;

    return guestCount;
  }

  async getDailyOccupancySurchargeRate(input: DailyOccupancySurchargeRateFilter) {
    if ((!input.fromDate && !input.toDate) || new Date(input.fromDate) > new Date(input.toDate)) {
      throw new BadRequestException('Invalid date range');
    }

    const { roomProductRatePlans, fromDate, toDate } = input;
    const roomProductIds = roomProductRatePlans.map((r) => r.roomProductId);
    const roomProductRatePlanIds = roomProductRatePlans.map((r) => r.id);
    const ranges = Helper.generateDateRange(fromDate, toDate);
    // default extra occupancy rates
    const [allRoomProductExtraOccupancyRates, allRoomProductRatePlanExtraOccupancyRateAdjustments] =
      await Promise.all([
        this.roomProductRepository.findExtraOccupancyRates({
          roomProductIds: roomProductIds
        }),
        this.roomProductRatePlanRepository.findDailyExtraOccupancyRate({
          fromDate: input.fromDate,
          toDate: input.toDate,
          roomProductRatePlanIds: roomProductRatePlanIds
        })
      ]);

    // extra occupancy rate adjustments daily

    const roomProductRatePlanExtraOccupancyRateAdjustmentMap = groupByToMap(
      allRoomProductRatePlanExtraOccupancyRateAdjustments,
      (r) => r.roomProductRatePlan.roomProductId
    );

    const result: DailyExtraOccupancyRateDto[] = [];
    for (const roomProductRatePlan of roomProductRatePlans) {
      const roomProductRatePlanExtraOccupancyRateAdjustments =
        roomProductRatePlanExtraOccupancyRateAdjustmentMap.get(roomProductRatePlan.roomProductId) ??
        [];

      for (const date of ranges) {
        // get daily extra occupancy rate adjustments
        const dailyExtraOccupancyRateList = roomProductRatePlanExtraOccupancyRateAdjustments.filter(
          (r) =>
            r.date === date &&
            r.roomProductRatePlan.ratePlanId === roomProductRatePlan.ratePlanId &&
            r.roomProductRatePlan.roomProductId === roomProductRatePlan.roomProductId
        );

        // get default extra occupancy rates
        const defaultExtraOccupancyRates = allRoomProductExtraOccupancyRates.filter(
          (r) => r.roomProductId === roomProductRatePlan.roomProductId
        );

        const extraOccupancyRates: ExtraOccupancyRateDto[] = [];
        for (const extraPeople of this.extraPeopleList) {
          const extraOccupancyRate = dailyExtraOccupancyRateList.find(
            (r) => r.extraPeople === extraPeople
          );

          const defaultExtraOccupancyRate = defaultExtraOccupancyRates.find(
            (r) => r.extraPeople === extraPeople
          );

          extraOccupancyRates.push({
            extraPeople: extraPeople,
            extraRate: Number(
              extraOccupancyRate?.extraRate ?? defaultExtraOccupancyRate?.extraRate ?? 0
            )
          });
        }

        result.push({
          date: new Date(date),
          roomProductId: roomProductRatePlan.roomProductId,
          ratePlanId: roomProductRatePlan.ratePlanId,
          roomProductRatePlanId: roomProductRatePlan.id,
          extraOccupancyRates: extraOccupancyRates
        });
      }
    }

    return result;
  }
}
