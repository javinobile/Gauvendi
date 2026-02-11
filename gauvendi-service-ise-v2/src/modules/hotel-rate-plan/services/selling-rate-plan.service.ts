import { Injectable } from '@nestjs/common';
import {
  RatePlan,
  RatePlanPricingMethodologyEnum
} from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanCxlPolicyDaily } from 'src/core/entities/rate-plan-cxl-policy-daily.entity';
import { RatePlanCancellationPolicyDailyRepository } from 'src/modules/rate-plan-cancellation-policy-daily/rate-plan-cancellation-policy-daily.repository';
import {
  RatePlanDailyPaymentTermDto,
  RatePlanDailyPaymentTermFilter
} from 'src/modules/rate-plan-daily-payment-term/rate-plan-daily-payment-term.dto';
import { RatePlanDailyPaymentTermRepository } from 'src/modules/rate-plan-daily-payment-term/rate-plan-daily-payment-term.repository';
import {
  RatePlanCancellationPolicyDailyDto,
  RatePlanCancellationPolicyDailyFilter
} from '../../rate-plan-cancellation-policy-daily/rate-plan-cancellation-policy-daily.dto';
import { RatePlanFilterDto } from '../dtos/rate-plan-filter.dto';
import { RatePlanRepository } from '../repositories/rate-plan.repository';

@Injectable()
export class SellingRatePlanService {
  constructor(
    private readonly ratePlanRepository: RatePlanRepository,
    private readonly ratePlanCancellationPolicyDailyRepository: RatePlanCancellationPolicyDailyRepository,
    private readonly ratePlanDailyPaymentTermRepository: RatePlanDailyPaymentTermRepository
  ) {}

  async sellingRatePlanCancellationPolicyDailyList(
    filter: RatePlanCancellationPolicyDailyFilter
  ): Promise<{
    data: RatePlanCancellationPolicyDailyDto[];
    count: number;
    totalPage: number;
  }> {
    const rs: {
      data: RatePlanCancellationPolicyDailyDto[];
      count: number;
      totalPage: number;
    } = {
      data: [],
      count: 0,
      totalPage: 1
    };

    // Step 1: Get Rate Plan information
    const ratePlanFilter: RatePlanFilterDto = {
      hotelId: filter.hotelId,
      idList: filter.ratePlanIdList,
      relations: ['derivedSetting', 'baseSetting']
    };

    const ratePlanList = await this.ratePlanRepository.findAllNoRelations(ratePlanFilter, {
      id: true,
      pricingMethodology: true,
      baseSetting: true,
      derivedSetting: true
    });
    const retainedRatePlanIds = new Set(ratePlanList.map((rp) => rp.id));

    // Step 2: Identify Derived Rate Plans
    const derivedPricingRatePlanMap = new Map<string, RatePlan>();
    ratePlanList
      .filter((rp) => rp.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING)
      .forEach((rp) => {
        derivedPricingRatePlanMap.set(rp.id, rp);
      });

    // Step 3: Expand Rate Plan ID list for derived plans
    if (derivedPricingRatePlanMap.size > 0) {
      const masterRatePlanIds = Array.from(derivedPricingRatePlanMap.values())
        .map(
          (rp) =>
            (rp.baseSetting && rp.baseSetting.length > 0 && rp.baseSetting[0].derivedRatePlanId) ||
            undefined
        )
        .filter((id) => id !== undefined);

      if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
        const currentRatePlanIds = [...filter.ratePlanIdList, ...masterRatePlanIds];
        filter.ratePlanIdList = currentRatePlanIds;
      }
    }

    // Step 4: Get Cancellation Policy data
    const ratePlanItemDailyList =
      await this.ratePlanCancellationPolicyDailyRepository.findAll(filter);

    // Step 5: Process Derived Rate Plan logic
    const data: RatePlanCancellationPolicyDailyDto[] = [];

    if (ratePlanItemDailyList.length > 0) {
      if (derivedPricingRatePlanMap.size > 0) {
        // Group by Rate Plan ID
        const ratePlanItemDailyMap = new Map<string, RatePlanCxlPolicyDaily[]>();
        ratePlanItemDailyList.forEach((item) => {
          const existing = ratePlanItemDailyMap.get(item.ratePlanId) || [];
          existing.push(item);
          ratePlanItemDailyMap.set(item.ratePlanId, existing);
        });

        // Process each retained Rate Plan ID
        for (const retainedRatePlanId of retainedRatePlanIds) {
          if (derivedPricingRatePlanMap.has(retainedRatePlanId)) {
            const derivedPricingRatePlan = derivedPricingRatePlanMap.get(retainedRatePlanId)!;
            const derivedSetting =
              derivedPricingRatePlan.baseSetting && derivedPricingRatePlan.baseSetting.length > 0
                ? derivedPricingRatePlan.baseSetting[0]
                : undefined;

            if (derivedSetting?.followDailyCxlPolicy) {
              // If following cancellation policy from Master
              const masterRatePlanId = derivedSetting.derivedRatePlanId;
              const masterList = ratePlanItemDailyMap.get(masterRatePlanId) || [];

              // Create derived list from master, but with derived plan's ratePlanId
              const derivedList = masterList.map((masterItem) => ({
                id: masterItem.id,
                ratePlanId: retainedRatePlanId, // ID of derived plan
                hotelId: masterItem.hotelId,
                cxlPolicyCode: masterItem.cxlPolicyCode, // Copy policy code
                date: masterItem.date // Copy date
              }));

              data.push(...derivedList);
            } else {
              // If not following, use derived plan's own data
              const derivedData = ratePlanItemDailyMap.get(retainedRatePlanId) || [];
              data.push(...derivedData);
            }
          } else {
            // Regular Rate Plan, get data directly
            const regularData = ratePlanItemDailyMap.get(retainedRatePlanId) || [];
            data.push(...regularData);
          }
        }
      } else {
        // No derived plans, return data as is
        data.push(...ratePlanItemDailyList);
      }
    }

    // Step 6: Sort results
    data.sort((a, b) => {
      const ratePlanCompare = a.ratePlanId.localeCompare(b.ratePlanId);
      if (ratePlanCompare !== 0) return ratePlanCompare;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    rs.data = data;
    rs.count = data.length;
    rs.totalPage = 1;

    return rs;
  }

  async sellingRatePlanPaymentTermDailyList(filter: RatePlanDailyPaymentTermFilter): Promise<{
    data: RatePlanDailyPaymentTermDto[];
    count: number;
    totalPage: number;
  }> {
    const rs: {
      data: RatePlanDailyPaymentTermDto[];
      count: number;
      totalPage: number;
    } = {
      data: [],
      count: 0,
      totalPage: 1
    };

    // Step 1: Get Rate Plan information
    const ratePlanFilter: RatePlanFilterDto = {
      hotelIdList: filter.hotelId ? [filter.hotelId] : undefined,
      idList: filter.ratePlanIdList,
      relations: ['derivedSetting']
    };

    const ratePlanList = await this.ratePlanRepository.findAllNoRelations(ratePlanFilter);
    const retainedRatePlanIds = new Set(ratePlanList.map((rp) => rp.id));

    // Step 2: Identify Derived Rate Plans
    const derivedPricingRatePlanMap = new Map<string, RatePlan>();
    ratePlanList
      .filter((rp) => rp.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING)
      .forEach((rp) => {
        derivedPricingRatePlanMap.set(rp.id, rp);
      });

    // Step 3: Expand Rate Plan ID list for derived plans
    if (derivedPricingRatePlanMap.size > 0) {
      const masterRatePlanIds = Array.from(derivedPricingRatePlanMap.values())
        .map((rp) =>
          rp.derivedSetting &&
          rp.derivedSetting.length > 0 &&
          rp.derivedSetting[0].derivedRatePlanId
            ? rp.derivedSetting[0].derivedRatePlanId
            : undefined
        )
        .filter((id): id is string => id !== undefined);

      if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
        const currentRatePlanIds = [...filter.ratePlanIdList, ...masterRatePlanIds];
        filter.ratePlanIdList = currentRatePlanIds;
      }
    }

    // Step 4: Get Payment Term data
    const ratePlanItemDailyList = await this.ratePlanDailyPaymentTermRepository.findAll(filter);

    // Step 5: Process Derived Rate Plan logic
    const data: RatePlanDailyPaymentTermDto[] = [];

    if (ratePlanItemDailyList.length > 0) {
      if (derivedPricingRatePlanMap.size > 0) {
        // Group by Rate Plan ID
        const ratePlanItemDailyMap = new Map<string, RatePlanDailyPaymentTermDto[]>();
        ratePlanItemDailyList.forEach((item) => {
          const existing = ratePlanItemDailyMap.get(item.ratePlanId) || [];
          existing.push(item);
          ratePlanItemDailyMap.set(item.ratePlanId, existing);
        });

        // Process each retained Rate Plan ID
        for (const retainedRatePlanId of retainedRatePlanIds) {
          if (derivedPricingRatePlanMap.has(retainedRatePlanId)) {
            const derivedPricingRatePlan = derivedPricingRatePlanMap.get(retainedRatePlanId)!;
            const derivedSetting =
              derivedPricingRatePlan.derivedSetting &&
              derivedPricingRatePlan.derivedSetting.length > 0
                ? derivedPricingRatePlan.derivedSetting[0]
                : undefined;

            if (derivedSetting?.followDailyPaymentTerm) {
              // If following payment term from Master
              const masterRatePlanId = derivedSetting.derivedRatePlanId;
              const masterList = ratePlanItemDailyMap.get(masterRatePlanId) || [];

              // Create derived list from master, but with derived plan's ratePlanId
              const derivedList = masterList.map((masterItem) => ({
                id: masterItem.id,
                ratePlanId: retainedRatePlanId, // ID of derived plan
                hotelId: masterItem.hotelId,
                paymentTermCode: masterItem.paymentTermCode, // Copy payment term code
                date: masterItem.date // Copy date
              }));

              data.push(...derivedList);
            } else {
              // If not following, use derived plan's own data
              const derivedData = ratePlanItemDailyMap.get(retainedRatePlanId) || [];
              data.push(...derivedData);
            }
          } else {
            // Regular Rate Plan, get data directly
            const regularData = ratePlanItemDailyMap.get(retainedRatePlanId) || [];
            data.push(...regularData);
          }
        }
      } else {
        // No derived plans, return data as is
        data.push(...ratePlanItemDailyList);
      }
    }

    // Step 6: Sort results
    data.sort((a, b) => {
      const ratePlanCompare = a.ratePlanId.localeCompare(b.ratePlanId);
      if (ratePlanCompare !== 0) return ratePlanCompare;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    rs.data = data;
    rs.count = data.length;
    rs.totalPage = 1;

    return rs;
  }
}
