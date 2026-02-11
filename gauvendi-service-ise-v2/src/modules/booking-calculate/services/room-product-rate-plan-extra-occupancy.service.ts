import { BadRequestException, Injectable } from '@nestjs/common';
import { Helper } from 'src/core/helper/utils';
import { groupByToMap } from 'src/core/utils/group-by.util';
import { DailyRfcRatePlanExtraOccupancyRateFilter } from '../../room-product-rate-plan-extra-occupancy-rate-adjustment/dtos/room-product-rate-plan-extra-occupancy.dto';
import { RoomProductExtraOccupancyRateRepository } from '../../room-product-rate-plan-extra-occupancy-rate-adjustment/room-product-extra-occupancy-rate.repository';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentRepository } from '../../room-product-rate-plan-extra-occupancy-rate-adjustment/room-product-rate-plan-extra-occupancy-rate-adjustment.repository';
import { RoomProductRatePlanRepository } from '../../room-product-rate-plan/room-product-rate-plan.repository';
import {
  DailyExtraOccupancyRateDto,
  ExtraOccupancyRateDto
} from '../dtos/daily-extra-occupancy-rate.dto';

@Injectable()
export class RoomProductRatePlanExtraOccupancyService {
  extraPeopleList = [2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,
    private readonly roomProductExtraOccupancyRateRepository: RoomProductExtraOccupancyRateRepository,
    private readonly roomProductRatePlanExtraOccupancyRateAdjustmentRepository: RoomProductRatePlanExtraOccupancyRateAdjustmentRepository
  ) {}

  async getDailyRatePlanExtraOccupancyRate(
    input: DailyRfcRatePlanExtraOccupancyRateFilter
  ): Promise<DailyExtraOccupancyRateDto[]> {
    if ((!input.fromDate && !input.toDate) || new Date(input.fromDate) > new Date(input.toDate)) {
      throw new BadRequestException('Invalid date range');
    }

    const allRoomProductRatePlans = await this.roomProductRatePlanRepository.findAll(
      {
        roomProductIdList: input.roomProductIds,

        ratePlanIdList: input.ratePlanIds
      },
      { id: true, ratePlanId: true, roomProductId: true }
    );

    const roomProductIds = allRoomProductRatePlans.map((r) => r.roomProductId);
    const roomProductRatePlanIds = allRoomProductRatePlans.map((r) => r.id);

    // default extra occupancy rates
    const allRoomProductExtraOccupancyRates =
      await this.roomProductExtraOccupancyRateRepository.findByRoomProductIds(roomProductIds);

    // extra occupancy rate adjustments daily
    const allRoomProductRatePlanExtraOccupancyRateAdjustments =
      await this.roomProductRatePlanExtraOccupancyRateAdjustmentRepository.findAll({
        fromDate: input.fromDate,
        toDate: input.toDate,
        rfcRatePlanIdList: roomProductRatePlanIds
      });

    const roomProductRatePlanExtraOccupancyRateAdjustmentMap = groupByToMap(
      allRoomProductRatePlanExtraOccupancyRateAdjustments,
      (r) => r.roomProductRatePlan.roomProductId
    );

    const result: DailyExtraOccupancyRateDto[] = [];
    for (const roomProductRatePlan of allRoomProductRatePlans) {
      const roomProductRatePlanExtraOccupancyRateAdjustments =
        roomProductRatePlanExtraOccupancyRateAdjustmentMap.get(roomProductRatePlan.roomProductId) ??
        [];
      const rangeDates = Helper.generateDateRange(input.fromDate, input.toDate);

      for (const date of rangeDates) {
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
          rfcRatePlanId: roomProductRatePlan.id,
          extraOccupancyRateList: extraOccupancyRates
        });
      }
    }

    return result;
  }
}
