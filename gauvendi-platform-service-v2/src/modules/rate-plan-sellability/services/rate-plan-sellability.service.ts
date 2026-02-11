import { Injectable } from '@nestjs/common';
import { RatePlanDailySellability } from '@src/core/entities/pricing-entities/rate-plan-daily-sellability.entity';
import { Helper } from '@src/core/helper/utils';
import { getAllowedDateByDayOfWeek } from '@src/core/utils/datetime.util';
import { RatePlanDerivedSettingRepository } from '@src/modules/rate-plan/repositories/rate-plan-derived-setting.repository';
import { ResponseContent, ResponseData } from 'src/core/dtos/common.dto';
import {
  RatePlanSellabilityDeleteDto,
  RatePlanSellabilityDto,
  RatePlanSellabilityFilterDto,
  RatePlanSellabilityInputDto
} from '../dtos';
import {
  DailyRatePlanSellabilityDto,
  DailyRatePlanSellabilityFilterDto
} from '../dtos/daily-rate-plan-sellability.dto';
import { DeleteRatePlanDailySellabilityInputDto } from '../dtos/delete-rate-plan-daily-sellability-input.dto';
import { RatePlanDailySellabilityRepository } from '../repositories/rate-plan-daily-sellability.repository';
import { RatePlanSellabilityRepository } from '../repositories/rate-plan-sellability.repository';

type RatePlanId = string;
type HotelId = string;
type DateString = string;
type DistributionChannelValue = string;
@Injectable()
export class RatePlanSellabilityService {
  constructor(
    private readonly ratePlanSellabilityRepository: RatePlanSellabilityRepository,
    private readonly ratePlanDailySellabilityRepository: RatePlanDailySellabilityRepository,
    private readonly ratePlanDerivedSettingRepository: RatePlanDerivedSettingRepository
  ) {}

  async ratePlanSellabilityList(
    filter: RatePlanSellabilityFilterDto
  ): Promise<ResponseData<RatePlanSellabilityDto>> {
    return await this.ratePlanSellabilityRepository.ratePlanSellabilityList(filter);
  }

  async createOrUpdateRatePlanSellability(
    inputs: RatePlanSellabilityInputDto[]
  ): Promise<ResponseContent<RatePlanSellabilityDto | null>> {
    return await this.ratePlanSellabilityRepository.createOrUpdateRatePlanSellability(inputs);
  }

  async deleteRatePlanSellability(
    inputs: RatePlanSellabilityDeleteDto[]
  ): Promise<ResponseContent<null>> {
    return await this.ratePlanSellabilityRepository.deleteRatePlanSellability(inputs);
  }

  async getDailyRatePlanSellability(
    input: DailyRatePlanSellabilityFilterDto
  ): Promise<DailyRatePlanSellabilityDto[]> {
    const { distributionChannelList, fromDate, hotelId, salesPlanIdList, toDate, isSellable } =
      input;

    const distributionChannels = distributionChannelList?.map((channel) => channel) || [];
    const ratePlanIds = salesPlanIdList?.map((id) => id) || [];

    const ratePlanDerivedSettings = (
      await this.ratePlanDerivedSettingRepository.findAll({
        hotelIdList: [hotelId],
        ratePlanIdList: ratePlanIds
      })
    ).filter((setting) => setting.followDailyRoomProductAvailability === true);

    const dateRange = Helper.generateDateRange(fromDate, toDate);
    const masterRatePlanIds = ratePlanDerivedSettings.map((setting) => setting.derivedRatePlanId);

    const ratePlanSellabilities = await this.ratePlanSellabilityRepository.findAll(
      {
        hotelId: hotelId,
        ratePlanIds: [...masterRatePlanIds, ...ratePlanIds],
        distributionChannels: distributionChannels,
        isSellable: isSellable
      },
      {
        id: true,
        ratePlanId: true,
        hotelId: true,
        distributionChannel: true
      }
    );

    const ratePlanSellabilityMap = new Map<`${RatePlanId}_${HotelId}`, RatePlanSellabilityDto>();
    for (const ratePlanSellability of ratePlanSellabilities) {
      const key = `${ratePlanSellability.ratePlanId}_${ratePlanSellability.hotelId}` as const;
      ratePlanSellabilityMap.set(key, ratePlanSellability);
    }

    const dailyRatePlanSellabilities = await this.ratePlanDailySellabilityRepository.findAll(
      {
        hotelId: input.hotelId,
        ratePlanIds: [...masterRatePlanIds, ...ratePlanIds],
        distributionChannels: distributionChannels,
        fromDate: fromDate,
        toDate: toDate,
        isSellable: isSellable
      },
      {
        id: true,
        ratePlanId: true,
        hotelId: true,
        distributionChannel: true,
        date: true,
        isSellable: true
      }
    );

    const ratePlanDailySellabilityMap = new Map<
      `${RatePlanId}_${HotelId}_${DateString}_${DistributionChannelValue}`,
      RatePlanDailySellability
    >();

    for (const dailyRatePlanSellability of dailyRatePlanSellabilities) {
      const key =
        `${dailyRatePlanSellability.ratePlanId}_${dailyRatePlanSellability.hotelId}_${dailyRatePlanSellability.date}_${dailyRatePlanSellability.distributionChannel}` as const;
      ratePlanDailySellabilityMap.set(key, dailyRatePlanSellability);
    }

    const allSellabilityList: DailyRatePlanSellabilityDto[] = [];

    for (const distributionChannel of distributionChannels) {
      for (const ratePlanId of [...masterRatePlanIds, ...ratePlanIds]) {
        for (const date of dateRange) {
          let isSellable = false;
          let isAdjusted = false;

          // default
          const ratePlanSellability = ratePlanSellabilityMap.get(
            `${ratePlanId}_${hotelId}` as const
          );

          if (
            ratePlanSellability &&
            ratePlanSellability?.distributionChannel.includes(distributionChannel)
          ) {
            isSellable = true;
          } else {
            isSellable = false;
          }

          // daily
          const dailyRatePlanSellability = ratePlanDailySellabilityMap.get(
            `${ratePlanId}_${hotelId}_${date}_${distributionChannel}` as const
          );

          if (dailyRatePlanSellability) {
            isSellable = dailyRatePlanSellability.isSellable;
            isAdjusted = true;
          }

          allSellabilityList.push({
            propertyId: hotelId,
            salePlanId: ratePlanId,
            distributionChannel: distributionChannel,
            isSellable: isSellable,
            date: date,
            isAdjusted: isAdjusted
          });
        }
      }
    }

    const sellabilityList = allSellabilityList.filter((s) => ratePlanIds.includes(s.salePlanId));
    const derivedSellabilityList = allSellabilityList.filter((s) =>
      masterRatePlanIds.includes(s.salePlanId)
    );
    // handle derived Rate Plan
    for (const sellability of sellabilityList) {
      const derivedSetting = ratePlanDerivedSettings.find(
        (rps) => rps.ratePlanId === sellability.salePlanId && rps.hotelId === sellability.propertyId
      );

      if (derivedSetting) {
        const sellabilityDerived = derivedSellabilityList.find(
          (s) =>
            s.salePlanId === derivedSetting.derivedRatePlanId &&
            s.propertyId === sellability.propertyId &&
            s.date === sellability.date &&
            s.distributionChannel === sellability.distributionChannel
        );

        if (sellabilityDerived) {
          sellability.isSellable = sellabilityDerived.isSellable;
          sellability.isAdjusted = sellabilityDerived.isAdjusted;
        }
      }
    }

    if (isSellable !== null && isSellable !== undefined) {
      return sellabilityList.filter((s) => s.isSellable === isSellable);
    }

    return sellabilityList;
  }

  async deleteDailyRatePlanSellability(
    inputs: DeleteRatePlanDailySellabilityInputDto
  ): Promise<null> {
    const { fromDate, toDate, daysOfWeek } = inputs;

    const dates = getAllowedDateByDayOfWeek(fromDate, toDate, daysOfWeek || []);

    await this.ratePlanDailySellabilityRepository.delete({
      hotelId: inputs.hotelId,
      ratePlanId: inputs.ratePlanId,
      distributionChannel: inputs.distributionChannel,
      dates
    });

    return null;
  }
}
