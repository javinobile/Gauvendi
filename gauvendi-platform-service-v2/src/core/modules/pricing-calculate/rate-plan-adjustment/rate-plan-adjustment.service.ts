import { Injectable } from '@nestjs/common';
import { RatePlanAdjustmentType, RatePlanStatusEnum } from '@src/core/enums/common';
import { groupByToMapSingle } from '@src/core/utils/group-by.util';
import { RatePlanV2Repository } from '@src/modules/rate-plan/repositories/rate-plan-v2.repository';

export interface GetDailyOrDefaultRatePlanAdjustmentFilter {
  hotelId: string;
  ratePlanIds: string[];
  dates: string[];
}

export interface GetDailyOrDefaultRatePlanAdjustmentResult {
  ratePlanId: string;
  date: string;
  adjustmentValue: number;
  adjustmentType: RatePlanAdjustmentType;
}

@Injectable()
export class RatePlanAdjustmentService {
  constructor(
    private readonly ratePlanRepository: RatePlanV2Repository,
  ) {}



  async getDailyOrDefaultRatePlanAdjustment(filter: GetDailyOrDefaultRatePlanAdjustmentFilter): Promise<GetDailyOrDefaultRatePlanAdjustmentResult[]> {
    const { hotelId, ratePlanIds, dates } = filter;
    const [ratePlans, dailyAdjustments] = await Promise.all([
      this.ratePlanRepository.findAll(
        {
          hotelId,
          ratePlanIds: ratePlanIds,
          statusList: [RatePlanStatusEnum.ACTIVE]
        },
        {
          id: true,
          adjustmentUnit: true,
          adjustmentValue: true
        }
      ),
      this.ratePlanRepository.findDailyAdjustments(
        {
          hotelId,
          ratePlanIds,
          dates
        },
        {
          id: true,
          ratePlanId: true,
          date: true,
          adjustmentValue: true,
          adjustmentType: true
        }
      )
    ]);

    const dailyAdjustmentMap = groupByToMapSingle(
      dailyAdjustments,
      (item) => `${item.ratePlanId}-${item.date}`
    );

    const result: {
      ratePlanId: string;
      date: string;
      adjustmentValue: number;
      adjustmentType: RatePlanAdjustmentType;
    }[] = [];
    for (const ratePlan of ratePlans) {
      for (const date of dates) {
        let adjustmentValue = ratePlan.adjustmentValue;
        let adjustmentType = ratePlan.adjustmentUnit;
        const dailyAdjustment = dailyAdjustmentMap.get(`${ratePlan.id}-${date}`);
        if (dailyAdjustment) {
          adjustmentValue = Number(dailyAdjustment.adjustmentValue);
          adjustmentType = dailyAdjustment.adjustmentType;
        }
        result.push({
          ratePlanId: ratePlan.id,
          date,
          adjustmentValue,
          adjustmentType
        });
      }
    }

    return result;
  }
}
