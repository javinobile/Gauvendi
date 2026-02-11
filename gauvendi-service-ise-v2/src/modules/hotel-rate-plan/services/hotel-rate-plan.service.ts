import { BadRequestException, Injectable } from '@nestjs/common';
import { LogPerformance } from 'src/core/decorators/execution-time.decorator';

import { LanguageCodeEnum } from 'src/core/database/entities/base.entity';
import { HotelPaymentTerm } from 'src/core/entities/hotel-entities/hotel-payment-term.entity';
import { RatePlanPaymentTermSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import {
  RatePlanPricingMethodologyEnum,
  RatePlanStatusEnum
} from 'src/core/entities/pricing-entities/rate-plan.entity';
import { DistributionChannel } from 'src/core/entities/room-product.entity';
import { HotelCancellationPolicyRepository } from 'src/modules/hotel-cancellation-policy/repositories/hotel-cancellation-policy.repository';
import { HotelRepository } from 'src/modules/hotel-v2/repositories/hotel.repository';
import { RatePlanCancellationPolicyDailyRepository } from 'src/modules/rate-plan-cancellation-policy-daily/rate-plan-cancellation-policy-daily.repository';
import {
  RatePlanDailyPaymentTermDto,
  RatePlanDailyPaymentTermFilter
} from 'src/modules/rate-plan-daily-payment-term/rate-plan-daily-payment-term.dto';
import { HotelCancellationPolicyDto } from '../../hotel-cancellation-policy/dtos/hotel-cancellation-policy.dto';
import {
  RatePlanCancellationPolicyDailyDto,
  RatePlanCancellationPolicyDailyFilter
} from '../../rate-plan-cancellation-policy-daily/rate-plan-cancellation-policy-daily.dto';
import { HotelPaymentTermFilterDto } from '../dtos/hotel-payment-term-filter.dto';
import { HotelRatePlanFilterDto } from '../dtos/hotel-rate-plan-filter.dto';
import { RatePlanFilterDto } from '../dtos/rate-plan-filter.dto';
import { RatePlanPaymentTermSettingFilterDto } from '../dtos/rate-plan-payment-term-setting-filter.dto';
import {
  HotelPaymentTermDto,
  RatePlanPaymentTermSettingDto
} from '../dtos/rate-plan-payment-term-setting.dto';
import { RatePlanDto } from '../dtos/rate-plan.dto';
import { RoomProductFilterDto } from '../dtos/room-product-filter.dto';
import { RoomProductRatePlanFilterDto } from '../dtos/room-product-rate-plan-filter.dto';
import { HotelPaymentTermRepository } from '../repositories/hotel-payment-term.repository';
import { RatePlanDailyPaymentTermRepository } from '../repositories/rate-plan-daily-payment-term.repository';
import { RatePlanPaymentTermSettingsRepository } from '../repositories/rate-plan-payment-term-settings.repository';
import { RatePlanRepository } from '../repositories/rate-plan.repository';
import { RoomProductRatePlanRepository } from '../repositories/room-product-rate-plan.repository';
import { RoomProductRepository } from '../repositories/room-product.repository';
import { ExtraServiceSettingsService } from './extra-service-settings.service';
import { HotelPaymentTermMapper } from './hotel-payment-term.mapper';
import { HotelRatePlanMapper } from './hotel-rate-plan.mapper';
import { RatePlanPaymentTermSettingMapper } from './rate-plan-payment-term-setting.mapper';
import { SellingRatePlanService } from './selling-rate-plan.service';

@Injectable()
export class HotelRatePlanService {
  constructor(
    private readonly ratePlan: RatePlanRepository,
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,
    private readonly roomProductRepository: RoomProductRepository,
    private readonly hotelCancellationPolicyRepository: HotelCancellationPolicyRepository,
    private readonly ratePlanCancellationPolicyDailyRepository: RatePlanCancellationPolicyDailyRepository,
    private readonly ratePlanPaymentTermSettingsRepository: RatePlanPaymentTermSettingsRepository,
    private readonly hotelPaymentTermRepository: HotelPaymentTermRepository,
    private readonly hotelRepository: HotelRepository,
    private readonly ratePlanDailyPaymentTermRepository: RatePlanDailyPaymentTermRepository,
    private readonly hotelPaymentTermMapper: HotelPaymentTermMapper,
    private readonly ratePlanPaymentTermSettingMapper: RatePlanPaymentTermSettingMapper,
    private readonly extraServiceSettingsService: ExtraServiceSettingsService,
    private readonly hotelRatePlanMapper: HotelRatePlanMapper,
    private readonly sellingRatePlanService: SellingRatePlanService
  ) { }

  async findAll(filter: HotelRatePlanFilterDto): Promise<RatePlanDto[]> {
    try {
      let filterRatePlanIds: string[] | null = null;

      if (!filter.hotelCode) {
        throw new BadRequestException('Hotel code is required');
      }

      const hotel = await this.hotelRepository.getHotelByCode(filter.hotelCode);

      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }

      // Step 1: Handle RFC code filtering
      if (filter.roomProductCode) {
        filterRatePlanIds = [];
        const roomProductCodeList = [filter.roomProductCode];

        // Create RFC filter
        const roomProductFilter: RoomProductFilterDto = {
          hotelId: hotel.id,
          codeList: roomProductCodeList
        };

        // Get RFC list
        const roomProductList = await this.roomProductRepository.findAll(roomProductFilter);

        if (roomProductList && roomProductList.length > 0) {
          const hotelIdList = [hotel.id];

          // Create RFC Rate Plan filter
          const rfcRatePlanFilter: RoomProductRatePlanFilterDto = {
            hotelIdList,
            roomProductIdList: roomProductList.map((roomProduct) => roomProduct.id),
            offset: 0,
            pageSize: -1
          };

          // Get RFC Rate Plan list
          const roomProductRatePlanList = (
            await this.roomProductRatePlanRepository.findAndCount(rfcRatePlanFilter)
          ).data;

          // Extract rate plan IDs
          filterRatePlanIds = roomProductRatePlanList
            .filter((rp) => rp.hotelId === hotel.id)
            .map((roomProductRatePlan) => roomProductRatePlan?.ratePlanId)
            .filter((id) => id !== undefined);
        }
      }

      // Step 2: Create main rate plan filter
      const ratePlanFilter: RatePlanFilterDto = {
        hotelId: hotel.id,
        statusList: [RatePlanStatusEnum.ACTIVE],
        distributionChannelList: [DistributionChannel.GV_SALES_ENGINE],
        ...(filter.code ? { code: filter.code } : {})
        // relations: [RatePlanExpandEnum.IMAGE]
      };

      // Step 3: Apply RFC filtering if needed
      if (filterRatePlanIds !== null) {
        if (filterRatePlanIds.length === 0) {
          return [];
        }
        if (filter.code) {
          ratePlanFilter.code = filter.code;
        } else {
          ratePlanFilter.idList = Array.from(new Set(filterRatePlanIds)) as string[];
        }
      }

      // Step 4: Get selling rate plan list
      const ratePlanList = (await this.sellingRatePlanList(ratePlanFilter)).data;
      // const ratePlans = await this.ratePlan.findAll(ratePlanFilter);
      // const ratePlanList = ratePlans.map((rp) => this.hotelRatePlanMapper.toDto(rp));
      // Step 6: Handle translation application
      if (filter.translateTo) {
        this.handleTranslation(filter.translateTo, ratePlanList);
      }

      if (filter.arrival && filter.departure && ratePlanList.length > 0) {
        await this.handlePaymentTermAndCxlPolicyForSalesPlan(
          hotel.id,
          filter.translateTo,
          filter.arrival,
          filter.departure,
          ratePlanList
        );
      }

      return ratePlanList;
    } catch (error) {
      console.error('Error in ratePlanList:', error);
      throw error;
    }
  }

  @LogPerformance({
    loggerName: 'HotelRatePlanService',
    logLevel: 'log',
    slowThreshold: 2000,
    includeArgs: false
  })
  async sellingRatePlanList(filter: {
    hotelId?: string;
    code?: string;
    isRequirePaymentTermSetting?: boolean;
    relations?: string[];
    translateTo?: LanguageCodeEnum;
    distributionChannelList?: DistributionChannel[];
  }): Promise<{
    data: RatePlanDto[];
    count: number;
    totalPage: number;
  }> {
    // Extract and store the payment term setting flag
    const isRequirePaymentTermSetting = filter.isRequirePaymentTermSetting === true;
    filter.isRequirePaymentTermSetting = undefined;

    // Add required expand fields
    let relations = filter.relations || [];
    relations = [...relations, 'derivedSetting', 'ratePlanSellabilities'];
    filter.relations = relations;

    // Get rate plan list
    const ratePlanList = await this.ratePlan.findAll({
      ...filter,
      code: filter.code
    });
    let ratePlanDtoList = ratePlanList.map((rp) => this.hotelRatePlanMapper.toDto(rp));

    // Early return if no data
    if (!ratePlanDtoList || !ratePlanDtoList || ratePlanDtoList.length === 0) {
      return { data: [], count: 0, totalPage: 0 };
    }

    // Filter by payment term settings if required
    if (isRequirePaymentTermSetting) {
      const salesPlanIdList = ratePlanDtoList
        .map((rp) => rp.id)
        .filter((id): id is string => id !== null && id !== undefined);

      const salesPlanPaymentTermList = await this.getRatePlanPaymentTermList(
        salesPlanIdList,
        undefined,
        true
      );

      const validPaymentTermList = salesPlanPaymentTermList.filter(
        (item) =>
          item.hotelPaymentTerm !== null &&
          item.supportedPaymentMethodCodeList &&
          item.supportedPaymentMethodCodeList.length > 0
      );

      if (validPaymentTermList.length === 0) {
        return { data: [], count: 0, totalPage: 0 };
      }

      const validSalesPlanIdList = new Set(
        validPaymentTermList
          .map((item) => item.ratePlanId)
          .filter((id): id is string => id !== null && id !== undefined)
      );

      const validSalesPlanList = ratePlanDtoList.filter((item) =>
        validSalesPlanIdList.has(item.id!)
      );

      if (validSalesPlanList.length === 0) {
        return { data: [], count: 0, totalPage: 0 };
      }

      ratePlanDtoList = validSalesPlanList;
    }

    // Extract sales plan IDs once
    const ratePlanIdList = new Set(ratePlanDtoList.map((rp) => rp.id!));

    // Get included and mandatory services in a single batch

    const {
      includedServiceMap: includedServicesByRatePlan,
      mandatoryServiceMap: mandatoryServicesByRatePlan
    } = await this.extraServiceSettingsService.fetchServicesSettingBySalesPlan({
      ratePlanIdList: Array.from(ratePlanIdList),
      distributionChannelList: filter.distributionChannelList
    });

    // Populate services data
    ratePlanDtoList.forEach((salesPlan) => {
      const isDerived =
        salesPlan.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING;
      if (isDerived) {
        const isFollowingMasterSalesPlan =
          salesPlan.ratePlanDerivedSetting &&
          salesPlan.ratePlanDerivedSetting.followDailyIncludedAmenity === true;
        if (isFollowingMasterSalesPlan) {
          // Skip and handle later
          return;
        }
      }

      const ratePlanId = salesPlan.id!;

      // Handle included services
      const includedServicesList = includedServicesByRatePlan.get(ratePlanId) || [];
      const includedServicesCodeList = includedServicesList.map((service) => service.code!);

      salesPlan.includedServiceCodeList = includedServicesCodeList;
      salesPlan.includedHotelExtrasList = includedServicesList;

      // Handle mandatory services
      const mandatoryHotelExtrasList = mandatoryServicesByRatePlan.get(ratePlanId) || [];
      const mandatoryHotelExtrasIdList = mandatoryHotelExtrasList.map((service) => service.id!);

      salesPlan.mandatoryHotelExtrasIdList = mandatoryHotelExtrasIdList;
      salesPlan.mandatoryHotelExtrasList = mandatoryHotelExtrasList;
    });

    // Create a map for efficient lookup
    const salesPlanMap = new Map<string, RatePlanDto>();
    ratePlanDtoList.forEach((rp) => {
      salesPlanMap.set(rp.id!, rp);
    });

    // Process derived rate plans
    const derivedSalesPlanList = ratePlanDtoList.filter(
      (item) => item.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING
    );

    if (derivedSalesPlanList.length > 0) {
      // Get master sales plan IDs
      const masterSalesPlanIdList = derivedSalesPlanList
        .map((item) => item.ratePlanDerivedSetting?.derivedRatePlanId)
        .filter((id): id is string => id !== null && id !== undefined);

      // Fetch master sales plan list
      const masterSalesPlanFilter: RatePlanFilterDto = {
        hotelId: filter.hotelId,
        idList: masterSalesPlanIdList
      };

      const masterSalesPlanList = await this.ratePlan.findAll(masterSalesPlanFilter);
      const masterSalesPlanDtoList = masterSalesPlanList.map((rp) =>
        this.hotelRatePlanMapper.toDto(rp)
      );
      if (!masterSalesPlanDtoList || masterSalesPlanDtoList.length === 0) {
        ratePlanDtoList = Array.from(salesPlanMap.values());
        return { data: ratePlanDtoList, count: ratePlanDtoList.length, totalPage: 1 };
      }

      const masterRatePlanMap = new Map<string, RatePlanDto>();
      masterSalesPlanDtoList.forEach((rp) => {
        masterRatePlanMap.set(rp.id!, rp);
      });

      // Get payment term settings for master plans
      const ratePlanPaymentTermList = await this.getRatePlanPaymentTermList(
        Array.from(masterRatePlanMap.keys()),
        undefined,
        true
      );

      const validPaymentTermList = ratePlanPaymentTermList.filter(
        (item) =>
          item.hotelPaymentTerm !== null &&
          item.supportedPaymentMethodCodeList &&
          item.supportedPaymentMethodCodeList.length > 0
      );

      // Create lookup map for payment terms
      const paymentTermMap = new Map<string, RatePlanPaymentTermSettingDto>();
      validPaymentTermList.forEach((item) => {
        paymentTermMap.set(item.ratePlanId!, item);
      });

      const {
        includedServiceMap: masterIncludedServices,
        mandatoryServiceMap: masterMandatoryServices
      } = await this.extraServiceSettingsService.fetchServicesSettingBySalesPlan({
        ratePlanIdList: masterSalesPlanIdList,
        distributionChannelList: filter.distributionChannelList
      });

      // Update derived plans based on master plans
      derivedSalesPlanList.forEach((derivedPlan) => {
        const derivedSetting = derivedPlan.ratePlanDerivedSetting;
        if (!derivedSetting) return;

        const masterSalesPlanId = derivedSetting.derivedRatePlanId;
        const masterPlan = masterRatePlanMap.get(masterSalesPlanId);

        if (!masterPlan) {
          return;
        }

        // Apply settings from master plan based on configuration
        if (derivedSetting.followDailyCxlPolicy) {
          derivedPlan.hotelCxlPolicyCode = masterPlan.hotelCxlPolicyCode;
        }

        if (derivedSetting.followDailyPaymentTerm) {
          const masterPaymentTerm = paymentTermMap.get(masterPlan.id!);
          if (masterPaymentTerm && masterPaymentTerm.hotelPaymentTerm) {
            derivedPlan.paymentTermCode = masterPaymentTerm.hotelPaymentTerm.code;
          }
        }

        if (derivedSetting.followDailyIncludedAmenity) {
          // Set included services
          const includedServicesList = masterIncludedServices.get(masterSalesPlanId) || [];
          const includedServicesCodeList = includedServicesList.map((service) => service.code!);

          derivedPlan.includedServiceCodeList = includedServicesCodeList;
          derivedPlan.includedHotelExtrasList = includedServicesList;

          // Set mandatory services
          const mandatoryHotelExtrasList = masterMandatoryServices.get(masterSalesPlanId) || [];
          const mandatoryHotelExtrasIdList = mandatoryHotelExtrasList.map((service) => service.id!);

          derivedPlan.mandatoryHotelExtrasIdList = mandatoryHotelExtrasIdList;
          derivedPlan.mandatoryHotelExtrasList = mandatoryHotelExtrasList;
        }

        if (derivedSetting.followDailyRoomProductAvailability) {
          derivedPlan.sellableSetting = masterPlan.sellableSetting;
        }

        salesPlanMap.set(derivedPlan.id!, derivedPlan);
      });
    }

    ratePlanDtoList = Array.from(salesPlanMap.values());
    return { data: ratePlanDtoList, count: ratePlanDtoList.length, totalPage: 1 };
  }

  private handleTranslation(translateTo: string, ratePlanList: RatePlanDto[]): void {
    if (!translateTo || !translateTo.trim()) {
      return;
    }

    ratePlanList.forEach((item) => {
      if (item.translations && item.translations.length > 0) {
        const translation = item.translations?.find(
          (t) => `${t.languageCode}`.toLowerCase() === `${translateTo}`.toLowerCase()
        );

        if (translation && translation.name) {
          item.name = translation.name;
        }
        if (translation && translation.description) {
          item.description = translation.description;
        }
      }
      if (
        item.strongestCxlPolicy &&
        item.strongestCxlPolicy.translationList &&
        item.strongestCxlPolicy.translationList.length > 0
      ) {
        const translation = item.strongestCxlPolicy.translationList.find(
          (t) => t.languageCode === translateTo
        );
        if (translation && translation.name) {
          item.strongestCxlPolicy.name = translation.name;
        }
        if (translation && translation.description) {
          item.strongestCxlPolicy.description = translation.description;
        }
      }

      if (
        item.strongestPaymentTerms &&
        item.strongestPaymentTerms.translationList &&
        item.strongestPaymentTerms.translationList.length > 0
      ) {
        const translation = item.strongestPaymentTerms.translationList.find(
          (t) => t.languageCode === translateTo
        );
        if (translation && translation.name) {
          item.strongestPaymentTerms.name = translation.name;
        }
        if (translation && translation.description) {
          item.strongestPaymentTerms.description = translation.description;
        }
      }
    });
  }

  private async handlePaymentTermAndCxlPolicyForSalesPlan(
    propertyId: string,
    translateTo?: LanguageCodeEnum,
    arrival?: string,
    departure?: string,
    ratePlanList?: RatePlanDto[]
  ): Promise<void> {
    if (!ratePlanList || ratePlanList.length === 0 || !arrival || !departure) {
      return;
    }

    try {
      // Step 1: Get hotel payment terms
      const hotelPaymentTermFilter: HotelPaymentTermFilterDto = {
        hotelId: propertyId,
        languageCodeList: translateTo ? [translateTo] : undefined
      };
      const paymentTerms = await this.hotelPaymentTermRepository.findAll(hotelPaymentTermFilter);

      // Step 2: Convert dates and get date list
      const arrivalDate = new Date(arrival);
      const departureDate = new Date(departure);
      const dateList = this.convertToDateList(arrivalDate, departureDate);

      // Step 3: Get rate plan payment term daily data

      const ratePlanDailyPaymentTermFilter: RatePlanDailyPaymentTermFilter = {
        hotelId: propertyId,
        ratePlanIdList: ratePlanList
          .map((sp) => sp.id)
          .filter((id): id is string => id !== null && id !== undefined),
        fromDate: arrivalDate.toISOString().split('T')[0],
        toDate: new Date(departureDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      const ratePlanPaymentTermDailyList = await this.ratePlanDailyPaymentTermRepository.findAll(
        ratePlanDailyPaymentTermFilter
      );

      // Step 4: Get hotel cancellation policies
      const cxlPolicies = await this.hotelCancellationPolicyRepository.findAll({
        hotelId: propertyId,
        translateTo
      });

      // Step 5: Get rate plan cancellation policy daily data

      const ratePlanCancellationPolicyDailyFilter: RatePlanCancellationPolicyDailyFilter = {
        hotelId: propertyId,
        ratePlanIdList: ratePlanList
          .map((sp) => sp.id)
          .filter((id): id is string => id !== null && id !== undefined),
        fromDate: arrivalDate.toISOString().split('T')[0],
        toDate: new Date(departureDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      const ratePlanCxlPolicyDailyList =
        await this.sellingRatePlanService.sellingRatePlanCancellationPolicyDailyList(
          ratePlanCancellationPolicyDailyFilter
        );

      // Step 6: Get sales plan payment term settings
      const salesPlanPaymentTermSettingList = await this.getRatePlanPaymentTermList(
        ratePlanList
          .map((sp) => sp.id)
          .filter((id): id is string => id !== null && id !== undefined),
        propertyId,
        true
      );

      // Step 7: Process each rate plan
      for (const ratePlan of ratePlanList) {
        if (!ratePlan.id) continue;

        // Find payment term setting for this rate plan
        const salesPlanPaymentTermSetting = salesPlanPaymentTermSettingList.find(
          (setting) => setting.ratePlanId === ratePlan.id
        );

        // Get strongest payment term
        const paymentTerm = this.getStrongestPaymentTerm(
          ratePlan,
          paymentTerms,
          ratePlanPaymentTermDailyList,
          dateList,
          salesPlanPaymentTermSetting
        );

        ratePlan.strongestPaymentTerms = paymentTerm;
        ratePlan.strongestPaymentTermsCode = paymentTerm?.code;

        // Get strongest cancellation policy
        const cancellationPolicy = this.getStrongestCxlPolicy(
          ratePlan,
          cxlPolicies,
          ratePlanCxlPolicyDailyList.data,
          dateList
        );

        ratePlan.strongestCxlPolicy = cancellationPolicy;
        ratePlan.strongestCxlPolicyCode = cancellationPolicy?.code;
      }
    } catch (error) {
      console.error('Error in handlePaymentTermAndCxlPolicyForSalesPlan:', error);
      // Don't throw error, just log it to avoid breaking the main flow
    }
  }

  @LogPerformance({
    loggerName: 'HotelRatePlanService',
    logLevel: 'log',
    slowThreshold: 2000,
    includeArgs: false
  })
  async getRatePlanPaymentTermList(
    ratePlanIdList: string[],
    hotelId?: string,
    isRequestDefaultPaymentTerm?: boolean,
    hotelPaymentTermIdList?: string[]
  ): Promise<RatePlanPaymentTermSettingDto[]> {
    try {
      let ratePlanPaymentTermList: RatePlanPaymentTermSetting[] = [];

      if (!ratePlanIdList || ratePlanIdList.length === 0) {
        return ratePlanPaymentTermList;
      }

      // Step 1: Create filter for sales plan payment term settings
      const salesPlanPaymentTermSettingFilter: RatePlanPaymentTermSettingFilterDto = {
        ratePlanIdList: ratePlanIdList
      };

      if (hotelId) {
        salesPlanPaymentTermSettingFilter.hotelIdList = [hotelId];
      }

      if (hotelPaymentTermIdList && hotelPaymentTermIdList.length > 0) {
        salesPlanPaymentTermSettingFilter.hotelPaymentTermIdList = hotelPaymentTermIdList;
      }

      if (isRequestDefaultPaymentTerm) {
        salesPlanPaymentTermSettingFilter.isDefault = true;
      }

      // Step 2: Get sales plan payment term settings
      ratePlanPaymentTermList = await this.ratePlanPaymentTermSettingsRepository.findAll(
        salesPlanPaymentTermSettingFilter
      );

      if (!ratePlanPaymentTermList || ratePlanPaymentTermList.length === 0) {
        return [];
      }

      // Step 3: Extract payment term IDs
      const paymentTermIdList = ratePlanPaymentTermList
        .map((setting) => setting.hotelPaymentTermId)
        .filter((id) => id !== undefined);

      if (paymentTermIdList.length === 0) {
        return ratePlanPaymentTermList;
      }

      // Step 4: Get hotel payment terms
      const hotelPaymentTermFilter: HotelPaymentTermFilterDto = {
        hotelId,
        idList: paymentTermIdList
      };

      const hotelPaymentTermList =
        await this.hotelPaymentTermRepository.findAll(hotelPaymentTermFilter);

      if (!hotelPaymentTermList || hotelPaymentTermList.length === 0) {
        return ratePlanPaymentTermList;
      }

      // Step 5: Create mapping of payment term ID to payment term DTO
      const hotelPaymentTermMap = new Map<string, HotelPaymentTerm>();
      hotelPaymentTermList.forEach((paymentTerm) => {
        if (paymentTerm.id) {
          hotelPaymentTermMap.set(paymentTerm.id, paymentTerm);
        }
      });

      // Step 6: Map payment terms to sales plan payment term settings
      const result = ratePlanPaymentTermList.map((setting) => {
        const dto = this.ratePlanPaymentTermSettingMapper.toDto(setting);
        if (setting.hotelPaymentTermId) {
          const hotelPaymentTerm = hotelPaymentTermMap.get(setting.hotelPaymentTermId);
          if (hotelPaymentTerm) {
            dto.hotelPaymentTerm = this.hotelPaymentTermMapper.toDto(hotelPaymentTerm);
          }
        }
        return dto;
      });

      return result;
    } catch (error) {
      console.error('Error in getSalesPlanPaymentTermList:', error);
      throw error;
    }
  }

  private getStrongestPaymentTerm(
    ratePlan: RatePlanDto,
    paymentTerms: HotelPaymentTermDto[],
    ratePlanPaymentTermDailyList: RatePlanDailyPaymentTermDto[],
    dateList: Date[],
    salesPlanPaymentTermSetting?: RatePlanPaymentTermSettingDto
  ): HotelPaymentTermDto | undefined {
    if (!ratePlanPaymentTermDailyList || ratePlanPaymentTermDailyList.length === 0) {
      // Fallback to sales plan payment term setting
      if (salesPlanPaymentTermSetting?.hotelPaymentTerm) {
        const fallbackTerm = paymentTerms.find(
          (item) => item.code === salesPlanPaymentTermSetting.hotelPaymentTerm?.code
        );
        return fallbackTerm ? fallbackTerm : undefined;
      }
      return undefined;
    }

    // Filter daily payment terms for this rate plan
    const dailyRatePlanPaymentTerms = ratePlanPaymentTermDailyList.filter(
      (dailyPaymentTerms) => dailyPaymentTerms.ratePlanId === ratePlan.id
    );

    if (dailyRatePlanPaymentTerms.length === 0) {
      // Fallback to sales plan payment term setting
      if (salesPlanPaymentTermSetting?.hotelPaymentTerm) {
        const fallbackTerm = paymentTerms.find(
          (item) => item.code === salesPlanPaymentTermSetting.hotelPaymentTerm?.code
        );
        return fallbackTerm ? fallbackTerm : undefined;
      }
      return undefined;
    }

    // Get adjusted date list from daily payment terms
    const adjustedDateList = dailyRatePlanPaymentTerms
      .map((item) => new Date(item.date || ''))
      .filter((date) => !isNaN(date.getTime()));

    // Check if all required dates are covered
    const dateListStrings = dateList.map((date) => date.toISOString().split('T')[0]);
    const adjustedDateListStrings = adjustedDateList.map(
      (date) => date.toISOString().split('T')[0]
    );

    if (!dateListStrings.every((date) => adjustedDateListStrings.includes(date))) {
      // Add default payment term if not all dates are covered
      if (salesPlanPaymentTermSetting?.hotelPaymentTerm) {
        const defaultPaymentTerm: RatePlanDailyPaymentTermDto = {
          ratePlanId: ratePlan.id,
          paymentTermCode: salesPlanPaymentTermSetting.hotelPaymentTerm.code
        } as RatePlanDailyPaymentTermDto;
        dailyRatePlanPaymentTerms.push(defaultPaymentTerm);
      }
    }

    // Get unique payment term codes from daily data
    const uniquePaymentTermCodes = [
      ...new Set(
        dailyRatePlanPaymentTerms
          .map((item) => item.paymentTermCode)
          .filter((code) => code !== undefined)
      )
    ];

    // Filter available payment terms based on daily data
    const availablePaymentTerms = paymentTerms.filter(
      (item) => item.code && uniquePaymentTermCodes.includes(item.code)
    );

    if (availablePaymentTerms.length === 0) {
      // Fallback to sales plan payment term setting
      if (salesPlanPaymentTermSetting?.hotelPaymentTerm) {
        const fallbackTerm = paymentTerms.find(
          (item) => item.code === salesPlanPaymentTermSetting.hotelPaymentTerm?.code
        );
        return fallbackTerm ? fallbackTerm : undefined;
      }
      return undefined;
    }

    // Find the strongest payment term (highest payOnConfirmation value)
    const strongestTerm = availablePaymentTerms.reduce(
      (acc, val) => {
        if (!acc) return val;
        const accPayOnConfirmation = acc.payOnConfirmation || 0;
        const valPayOnConfirmation = val.payOnConfirmation || 0;
        return accPayOnConfirmation < valPayOnConfirmation ? val : acc;
      },
      undefined as HotelPaymentTermDto | undefined
    );

    return strongestTerm ? strongestTerm : undefined;
  }

  private getStrongestCxlPolicy(
    ratePlan: RatePlanDto,
    cxlPolicies: HotelCancellationPolicyDto[],
    ratePlanCxlPolicyDailyList: RatePlanCancellationPolicyDailyDto[],
    dateList: Date[],
    translateTo?: LanguageCodeEnum
  ): HotelCancellationPolicyDto | undefined {
    if (!ratePlanCxlPolicyDailyList || ratePlanCxlPolicyDailyList.length === 0) {
      // Fallback to rate plan's default cancellation policy
      const fallbackPolicy = cxlPolicies.find((item) => item.code === ratePlan.hotelCxlPolicyCode);
      return fallbackPolicy ? fallbackPolicy : undefined;
    }

    // Filter daily cancellation policies for this rate plan
    const dailyRatePlanCxlPolicies = ratePlanCxlPolicyDailyList.filter(
      (dailyCxlPolicy) => dailyCxlPolicy.ratePlanId === ratePlan.id
    );

    if (dailyRatePlanCxlPolicies.length === 0) {
      // Fallback to rate plan's default cancellation policy
      const fallbackPolicy = cxlPolicies.find((item) => item.code === ratePlan.hotelCxlPolicyCode);
      return fallbackPolicy ? fallbackPolicy : undefined;
    }

    // Get adjusted date list from daily cancellation policies
    const adjustedDateList = dailyRatePlanCxlPolicies
      .map((item) => new Date(item.date || ''))
      .filter((date) => !isNaN(date.getTime()));

    // Check if all required dates are covered
    const dateListStrings = dateList.map((date) => date.toISOString().split('T')[0]);
    const adjustedDateListStrings = adjustedDateList.map(
      (date) => date.toISOString().split('T')[0]
    );

    // Use Set for efficient containsAll check (equivalent to HashSet in Java)
    const adjustedDateSet = new Set(adjustedDateListStrings);
    if (!dateListStrings.every((date) => adjustedDateSet.has(date))) {
      // Add default cancellation policy if not all dates are covered
      const defaultCxlPolicy: RatePlanCancellationPolicyDailyDto = {
        ratePlanId: ratePlan.id,
        cxlPolicyCode: ratePlan.hotelCxlPolicyCode
      } as RatePlanCancellationPolicyDailyDto;
      dailyRatePlanCxlPolicies.push(defaultCxlPolicy);
    }

    // Get unique cancellation policy codes from daily data
    const uniqueCxlPolicyCodes = [
      ...new Set(
        dailyRatePlanCxlPolicies
          .map((item) => item.cxlPolicyCode)
          .filter((code) => code !== undefined)
      )
    ];

    // Filter available cancellation policies based on daily data
    const availableCxlPolicies = cxlPolicies.filter(
      (item) => item.code && uniqueCxlPolicyCodes.includes(item.code)
    );

    if (availableCxlPolicies.length === 0) {
      // Fallback to rate plan's default cancellation policy
      const fallbackPolicy = cxlPolicies.find((item) => item.code === ratePlan.hotelCxlPolicyCode);
      return fallbackPolicy ? fallbackPolicy : undefined;
    }

    // Check if any policy has hourPrior <= 0 (non-refundable/immediate cancellation)
    // These are considered the strongest policies
    const nonRefundablePolicies = availableCxlPolicies.filter(
      (policy) => policy.hourPrior !== undefined && policy.hourPrior <= 0
    );

    if (nonRefundablePolicies.length > 0) {
      // Return the first non-refundable policy found
      return nonRefundablePolicies[0];
    }

    // If no non-refundable policy, find the one with highest hourPrior
    // (latest cancellation deadline = strongest policy)
    const strongestPolicy = availableCxlPolicies.reduce(
      (acc, val) => {
        if (!acc) return val;
        const accHourPrior = acc.hourPrior || 0;
        const valHourPrior = val.hourPrior || 0;
        return accHourPrior < valHourPrior ? val : acc;
      },
      undefined as HotelCancellationPolicyDto | undefined
    );

    return strongestPolicy ? strongestPolicy : undefined;
  }

  private convertToDateList(arrival: Date, departure: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(arrival);
    const end = new Date(departure.getTime() - 24 * 60 * 60 * 1000); // minus 1 day

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }
}
