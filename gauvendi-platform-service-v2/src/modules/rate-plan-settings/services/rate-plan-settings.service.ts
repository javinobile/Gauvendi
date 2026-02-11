import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCancellationPolicy } from '@src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanPaymentTermSetting } from '@src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlanSellability } from '@src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanCxlPolicyDaily } from '@src/core/entities/rate-plan-cxl-policy-daily.entity';
import { RatePlanDailyExtraService } from '@src/core/entities/rate-plan-daily-extra-service.entity';
import { RatePlanDailyPaymentTerm } from '@src/core/entities/rate-plan-daily-payment-term.entity';
import { RatePlanExtraServiceType } from '@src/core/enums/common';
import { Helper } from '@src/core/helper/utils';
import { getAllowedDateByDayOfWeek } from '@src/core/utils/datetime.util';
import { HotelAmenityRepository } from '@src/modules/hotel-amenity/repositories/hotel-amenity.repository';
import { HotelCancellationPolicyRepository } from '@src/modules/hotel-cancellation-policy/repositories/hotel-cancellation-policy.repository';
import { HotelPaymentTermRepository } from '@src/modules/hotel-payment-term/repositories/hotel-payment-term.repository';
import { RatePlanExtraServiceRepository } from '@src/modules/rate-plan-extra-service/repositories/rate-plan-extra-service.repository';
import { RatePlanPaymentTermSettingRepository } from '@src/modules/rate-plan-payment-term-setting/repositories/rate-plan-payment-term-setting.repository';
import { RatePlanDerivedSettingRepository } from '@src/modules/rate-plan/repositories/rate-plan-derived-setting.repository';
import { DbName } from 'src/core/constants/db-name.constant';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { HotelMarketSegment } from 'src/core/entities/hotel-entities/hotel-market-segment.entity';
import { DatabaseException } from 'src/core/exceptions';
import { In, IsNull, Repository } from 'typeorm';
import {
  AvailableSalesPlanToDeriveListDto,
  MappingHotelListDto,
  MarketSegmentListDto,
  SalesPlanSellabilityListDto,
  SalesPlanSellabilityListResponseDto
} from '../dtos/mapping-hotel-list.dto';
import {
  CreateOrUpdateRatePlanCancellationPolicyDailyInputDto,
  DeleteRatePlanCancellationPolicyDailyInputDto,
  RatePlanCancellationPolicyDailyFilterDto,
  RatePlanCxlPolicyDailyDto
} from '../dtos/rate-plan-cancellation-policy-daily.dto';
import {
  CreateOrUpdateRatePlanExtrasDailyInputDto,
  DeleteRatePlanExtrasDailyInputDto,
  RatePlanHotelExtrasDailyDto,
  RatePlanHotelExtrasDailyFilterDto
} from '../dtos/rate-plan-hotel-extras-daily.dto';
import {
  CreateOrUpdateRatePlanPaymentTermDailyInputDto,
  DeleteRatePlanPaymentTermDailyInputDto,
  RatePlanPaymentTermDailyDto,
  RatePlanPaymentTermDailyFilterDto
} from '../dtos/rate-plan-payment-term-daily.dto';
import { RatePlanDailyExtraServiceRepository } from '../repositories/rate-plan-daily-extra-service.repository';
import { RatePlanDailyPaymentTermRepository } from '../repositories/rate-plan-daily-payment-term.repository';
import { RatePlanDailyCancellationPolicyRepository } from '../repositories/rate-plan-daily-sellability.repository';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
type RatePlanId = RatePlan['id'];
type HotelCancellationPolicyCode = HotelCancellationPolicy['code'];
@Injectable()
export class RatePlanSettingsService {
  constructor(
    @InjectRepository(Connector, DbName.Postgres)
    private readonly connectorRepository: Repository<Connector>,

    @InjectRepository(HotelMarketSegment, DbName.Postgres)
    private readonly hotelMarketSegmentRepository: Repository<HotelMarketSegment>,

    @InjectRepository(RatePlanSellability, DbName.Postgres)
    private readonly ratePlanSellabilityRepository: Repository<RatePlanSellability>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    private readonly ratePlanDerivedSettingRepository: RatePlanDerivedSettingRepository,
    private readonly ratePlanDailyCancellationPolicyRepository: RatePlanDailyCancellationPolicyRepository,
    private readonly ratePlanDailyPaymentTermSettingRepository: RatePlanPaymentTermSettingRepository,
    private readonly ratePlanDailyPaymentTermRepository: RatePlanDailyPaymentTermRepository,
    private readonly hotelPaymentTermRepository: HotelPaymentTermRepository,
    private readonly ratePlanDailyExtraServiceRepository: RatePlanDailyExtraServiceRepository,
    private readonly ratePlanExtraServiceRepository: RatePlanExtraServiceRepository,
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly hotelCancellationPolicyRepository: HotelCancellationPolicyRepository
  ) {}

  async getHotelMappingList(query: MappingHotelListDto) {
    try {
      const { hotelIds } = query;

      const result = await this.connectorRepository.find({
        where: {
          hotelId: In(hotelIds)
        },
        select: {
          id: true,
          connectorType: true,
          status: true
        }
      });

      return result;
    } catch (error) {
      throw new DatabaseException('get hotel mapping list error: ', error?.message);
    }
  }

  async getMarketSegmentList(query: MarketSegmentListDto) {
    try {
      const { hotelIds, ids } = query;

      const result = await this.hotelMarketSegmentRepository.find({
        where: {
          hotelId: In(hotelIds),
          id: ids?.length ? In(ids) : undefined
        }
      });

      return result;
    } catch (error) {
      throw new DatabaseException('get market segment list error: ', error?.message);
    }
  }

  async getSalesPlanSellabilityList(
    query: SalesPlanSellabilityListDto
  ): Promise<SalesPlanSellabilityListResponseDto[]> {
    try {
      const { hotelIds, ratePlanIds } = query;

      // Build the base query with unnest to separate each distribution channel
      let queryBuilder = this.ratePlanSellabilityRepository
        .createQueryBuilder('rps')
        .select([
          'rps.hotel_id as "propertyId"',
          'rps.rate_plan_id as "salesPlanId"',
          'unnest(rps.distribution_channel) as "distributionChannel"'
        ])
        .where('rps.hotel_id = ANY(:hotelIds)', { hotelIds });

      // Add optional filter by ids if provided
      if (ratePlanIds && ratePlanIds.length > 0) {
        queryBuilder = queryBuilder.andWhere('rps.rate_plan_id = ANY(:ids)', { ids: ratePlanIds });
      }

      const result = await queryBuilder.getRawMany();

      return result;
    } catch (error) {
      throw new DatabaseException('get sales plan sellability list error: ', error?.message);
    }
  }

  async getAvailableSalesPlanToDeriveList(query: AvailableSalesPlanToDeriveListDto) {
    try {
      const { hotelIds, status } = query;

      const result = await this.ratePlanRepository.find({
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          pricingMethodology: true
        },
        where: {
          baseSetting: {
            derivedRatePlanId: IsNull()
          },
          hotelId: In(hotelIds),
          status: status ? status : undefined
        }
      });

      return result;
    } catch (error) {
      throw new DatabaseException(
        'get available sales plan to derive list error: ',
        error?.message
      );
    }
  }

  async getRatePlanCancellationPolicyDailyList(
    query: RatePlanCancellationPolicyDailyFilterDto
  ): Promise<RatePlanCxlPolicyDailyDto[]> {
    const { hotelId, ratePlanIdList, idList, fromDate, toDate } = query;

    const ratePlanDerivedSettings = (
      await this.ratePlanDerivedSettingRepository.findAll({
        hotelIdList: [hotelId],
        ratePlanIdList: ratePlanIdList || []
      })
    ).filter((setting) => setting.followDailyCxlPolicy === true);

    const dateRange = Helper.generateDateRange(fromDate, toDate);
    const masterRatePlanIds = ratePlanDerivedSettings.map((setting) => setting.derivedRatePlanId);

    const ratePLans = await this.ratePlanRepository.find({
      where: {
        id: In([...masterRatePlanIds, ...(ratePlanIdList || [])])
      },
      select: {
        id: true,
        name: true,
        code: true,
        hotelId: true,
        hotelCancellationPolicy: true,
        hotelCxlPolicyCode: true
      }
    });

    const ratePlanCancellationPolicyDailyList =
      await this.ratePlanDailyCancellationPolicyRepository.findAll({
        hotelId: hotelId,
        ratePlanIds: [...masterRatePlanIds, ...(ratePlanIdList || [])],
        fromDate: fromDate,
        toDate: toDate,
        ids: idList || []
      });

    const masterRatePlanCxlPolicyDefaultOrDailyList = this.getRatePlanCxlPolicyDefaultOrDailyList({
      hotelId: hotelId,
      ratePlans: ratePLans,
      ratePlanCancellationPolicyDailyList: ratePlanCancellationPolicyDailyList,
      dateRange: dateRange,
      ratePlanIdList: masterRatePlanIds
    });

    const ratePlanCxlPolicyDefaultOrDailyList = this.getRatePlanCxlPolicyDefaultOrDailyList({
      hotelId: hotelId,
      ratePlans: ratePLans,
      ratePlanCancellationPolicyDailyList: ratePlanCancellationPolicyDailyList,
      dateRange: dateRange,
      ratePlanIdList: ratePlanIdList || []
    });

    // handle derived rate plans
    for (const ratePlanCxlPolicyDefaultOrDaily of ratePlanCxlPolicyDefaultOrDailyList) {
      const ratePlanDerivedSetting = ratePlanDerivedSettings.find(
        (setting) => setting.ratePlanId === ratePlanCxlPolicyDefaultOrDaily.id
      );

      if (ratePlanDerivedSetting) {
        const masterRatePlanCxlPolicyDefaultOrDaily =
          masterRatePlanCxlPolicyDefaultOrDailyList.find(
            (d) =>
              d.ratePlanId === ratePlanDerivedSetting.derivedRatePlanId &&
              d.hotelId === ratePlanCxlPolicyDefaultOrDaily.hotelId &&
              d.date === ratePlanCxlPolicyDefaultOrDaily.date
          );

        if (masterRatePlanCxlPolicyDefaultOrDaily) {
          ratePlanCxlPolicyDefaultOrDaily.cxlPolicyCode =
            masterRatePlanCxlPolicyDefaultOrDaily.cxlPolicyCode;
          ratePlanCxlPolicyDefaultOrDaily.isAdjusted =
            masterRatePlanCxlPolicyDefaultOrDaily.isAdjusted;
        }
      }
    }

    return ratePlanCxlPolicyDefaultOrDailyList;
  }

  async getRatePlanPaymentTermDailyList(
    query: RatePlanPaymentTermDailyFilterDto
  ): Promise<RatePlanPaymentTermDailyDto[]> {
    const { hotelId, ratePlanIdList, idList, fromDate, toDate } = query;

    const ratePlanDerivedSettings = (
      await this.ratePlanDerivedSettingRepository.findAll({
        hotelIdList: [hotelId],
        ratePlanIdList: ratePlanIdList || []
      })
    ).filter((setting) => setting.followDailyCxlPolicy === true);

    const dateRange = Helper.generateDateRange(fromDate, toDate);
    const masterRatePlanIds = ratePlanDerivedSettings.map((setting) => setting.derivedRatePlanId);

    const ratePLanPaymentTermSetting =
      await this.ratePlanDailyPaymentTermSettingRepository.ratePlanPaymentTermSettingList({
        hotelId: hotelId,
        ratePlanIdList: [...masterRatePlanIds, ...(ratePlanIdList || [])],
        isDefault: true,
        pageSize: 999
      });

    const hotelPaymentTermList = await this.hotelPaymentTermRepository.getHotelPaymentTerms({
      hotelId: hotelId,
      ids: ratePLanPaymentTermSetting.map((setting) => setting.hotelPaymentTermId)
    });

    const ratePlanPaymentTermDailyList = await this.ratePlanDailyPaymentTermRepository.findAll({
      hotelId: hotelId,
      ratePlanIds: [...masterRatePlanIds, ...(ratePlanIdList || [])],
      fromDate: fromDate,
      toDate: toDate,
      ids: idList || []
    });

    const masterRatePlanPaymentTermDefaultOrDailyList: RatePlanPaymentTermDailyDto[] =
      this.getRatePlanPaymentTermDefaultOrDailyList({
        hotelId: hotelId,
        hotelPaymentTermList: hotelPaymentTermList,
        ratePlanPaymentTermSettingList: ratePLanPaymentTermSetting,
        ratePlanPaymentTermDailyList: ratePlanPaymentTermDailyList,
        dateRange: dateRange,
        ratePlanIdList: masterRatePlanIds
      });

    const ratePlanPaymentTermDefaultOrDailyList = this.getRatePlanPaymentTermDefaultOrDailyList({
      hotelId: hotelId,
      hotelPaymentTermList: hotelPaymentTermList,
      ratePlanPaymentTermSettingList: ratePLanPaymentTermSetting,
      ratePlanPaymentTermDailyList: ratePlanPaymentTermDailyList,
      dateRange: dateRange,
      ratePlanIdList: ratePlanIdList || []
    });

    // handle derived rate plans
    for (const ratePlanPaymentTermDefaultOrDaily of ratePlanPaymentTermDefaultOrDailyList) {
      const ratePlanDerivedSetting = ratePlanDerivedSettings.find(
        (setting) => setting.ratePlanId === ratePlanPaymentTermDefaultOrDaily.id
      );

      if (ratePlanDerivedSetting) {
        const masterRatePlanPaymentTermDefaultOrDaily =
          masterRatePlanPaymentTermDefaultOrDailyList.find(
            (d) =>
              d.ratePlanId === ratePlanDerivedSetting.derivedRatePlanId &&
              d.hotelId === ratePlanPaymentTermDefaultOrDaily.hotelId &&
              d.date === ratePlanPaymentTermDefaultOrDaily.date
          );

        if (masterRatePlanPaymentTermDefaultOrDaily) {
          ratePlanPaymentTermDefaultOrDaily.paymentTermCode =
            masterRatePlanPaymentTermDefaultOrDaily.paymentTermCode;
          ratePlanPaymentTermDefaultOrDaily.isAdjusted =
            masterRatePlanPaymentTermDefaultOrDaily.isAdjusted;
        }
      }
    }

    return ratePlanPaymentTermDefaultOrDailyList;
  }

  async getRatePlanHotelExtrasDailyList(
    query: RatePlanHotelExtrasDailyFilterDto
  ): Promise<RatePlanHotelExtrasDailyDto[]> {
    const { hotelId, ratePlanIdList, idList, fromDate, toDate, types } = query;

    const ratePlanDerivedSettings = (
      await this.ratePlanDerivedSettingRepository.findAll({
        hotelIdList: [hotelId],
        ratePlanIdList: ratePlanIdList || []
      })
    ).filter((setting) => setting.followDailyIncludedAmenity === true);

    const dateRange = Helper.generateDateRange(fromDate, toDate);
    const masterRatePlanIds = ratePlanDerivedSettings.map((setting) => setting.derivedRatePlanId);

    const ratePlanPaymentTermDailyList = await this.ratePlanExtraServiceRepository.findAll({
      ratePlanIds: [...masterRatePlanIds, ...(ratePlanIdList || [])],
      types: types || [RatePlanExtraServiceType.INCLUDED, RatePlanExtraServiceType.MANDATORY]
    });

    const ratePLanDailyExtraServices = await this.ratePlanDailyExtraServiceRepository.findAll({
      hotelId: hotelId,
      ratePlanIds: [...masterRatePlanIds, ...(ratePlanIdList || [])],
      fromDate: fromDate,
      toDate: toDate,
      ids: idList || []
    });

    const hotelAmenityList = await this.hotelAmenityRepository.findInIdsOrCodes(
      {
        ids: ratePlanPaymentTermDailyList.map((rpd) => rpd.extrasId),
        codes: ratePLanDailyExtraServices.map((rpd) => rpd.extraServiceCodeList).flat(),
        hotelId: hotelId,
        relations: {
          hotelAmenityPrices: {
            hotelAgeCategory: true
          }
        }
      },
      {
        id: true,
        code: true,
        name: true,
        availability: true,
        hotelAmenityPrices: {
          price: true,
          hotelAgeCategory: {
            code: true,
            name: true
          }
        }
      }
    );

    const masterRatePlanHotelExtrasDefaultOrDailyList: RatePlanHotelExtrasDailyDto[] =
      this.getRatePlanHotelExtrasDefaultOrDailyList({
        hotelId: hotelId,
        hotelAmenityList: hotelAmenityList,
        ratePlanExtraServiceList: ratePlanPaymentTermDailyList,
        ratePlanDailyExtraServiceList: ratePLanDailyExtraServices,
        dateRange: dateRange,
        ratePlanIdList: masterRatePlanIds
      });

    const ratePlanHotelExtrasDefaultOrDailyList = this.getRatePlanHotelExtrasDefaultOrDailyList({
      hotelId: hotelId,
      hotelAmenityList: hotelAmenityList,
      ratePlanExtraServiceList: ratePlanPaymentTermDailyList,
      ratePlanDailyExtraServiceList: ratePLanDailyExtraServices,
      dateRange: dateRange,
      ratePlanIdList: ratePlanIdList || [],
      types: types || [RatePlanExtraServiceType.INCLUDED, RatePlanExtraServiceType.MANDATORY]
    });

    // handle derived rate plans
    for (const ratePlanHotelExtrasDefaultOrDaily of ratePlanHotelExtrasDefaultOrDailyList) {
      const ratePlanDerivedSetting = ratePlanDerivedSettings.find(
        (setting) => setting.ratePlanId === ratePlanHotelExtrasDefaultOrDaily.id
      );

      if (ratePlanDerivedSetting) {
        const masterRatePlanHotelExtrasDefaultOrDaily =
          masterRatePlanHotelExtrasDefaultOrDailyList.find(
            (d) =>
              d.ratePlanId === ratePlanDerivedSetting.derivedRatePlanId &&
              d.date === ratePlanHotelExtrasDefaultOrDaily.date
          );

        if (masterRatePlanHotelExtrasDefaultOrDaily) {
          ratePlanHotelExtrasDefaultOrDaily.hotelExtrasList =
            masterRatePlanHotelExtrasDefaultOrDaily.hotelExtrasList;
          ratePlanHotelExtrasDefaultOrDaily.isAdjusted =
            masterRatePlanHotelExtrasDefaultOrDaily.isAdjusted;
        }
      }
    }

    return ratePlanHotelExtrasDefaultOrDailyList;
  }

  async createOrUpdateRatePlanCancellationPolicyDaily(
    input: CreateOrUpdateRatePlanCancellationPolicyDailyInputDto
  ) {
    const { hotelId, ratePlanId, fromDate, toDate, daysOfWeek, cxlPolicyCode } = input;

    const dates = getAllowedDateByDayOfWeek(fromDate, toDate, daysOfWeek || []);

    const ratePlanCxlPolicyDailyList = await this.ratePlanDailyCancellationPolicyRepository.findAll(
      {
        hotelId: hotelId,
        ratePlanIds: [ratePlanId],
        dates: dates
      }
    );

    const saveList: RatePlanCxlPolicyDaily[] = [];
    for (const date of dates) {
      const ratePlanCxlPolicyDaily = ratePlanCxlPolicyDailyList.find(
        (rpcpd) =>
          rpcpd.date === date && rpcpd.ratePlanId === ratePlanId && rpcpd.hotelId === hotelId
      );

      if (ratePlanCxlPolicyDaily) {
        ratePlanCxlPolicyDaily.cxlPolicyCode = input.cxlPolicyCode;
        saveList.push(ratePlanCxlPolicyDaily);
      } else {
        const newRatePlanCxlPolicyDaily = new RatePlanCxlPolicyDaily();
        newRatePlanCxlPolicyDaily.hotelId = hotelId;
        newRatePlanCxlPolicyDaily.ratePlanId = ratePlanId;
        newRatePlanCxlPolicyDaily.date = date;
        newRatePlanCxlPolicyDaily.cxlPolicyCode = cxlPolicyCode;
        saveList.push(newRatePlanCxlPolicyDaily);
      }
    }

    return await this.ratePlanDailyCancellationPolicyRepository.save(saveList);
  }

  async deleteRatePlanPaymentTermDaily(input: DeleteRatePlanPaymentTermDailyInputDto) {
    const { hotelId, ratePlanId, fromDate, toDate, daysOfWeek } = input;

    const dates = getAllowedDateByDayOfWeek(fromDate, toDate, daysOfWeek || []);

    return await this.ratePlanDailyPaymentTermRepository.delete({
      hotelId: hotelId,
      ratePlanId: ratePlanId,
      date: In(dates)
    });
  }

  async createOrUpdateRatePlanHotelExtrasDaily(input: CreateOrUpdateRatePlanExtrasDailyInputDto) {
    const { hotelId, ratePlanId, fromDate, toDate, daysOfWeek, hotelExtrasCodeList } = input;

    const dates = getAllowedDateByDayOfWeek(fromDate, toDate, daysOfWeek || []);

    const ratePlanDailyExtraServiceList = await this.ratePlanDailyExtraServiceRepository.findAll({
      hotelId: hotelId,
      ratePlanIds: [ratePlanId],
      dates: dates
    });

    const saveList: RatePlanDailyExtraService[] = [];
    for (const date of dates) {
      const ratePlanDailyExtraService = ratePlanDailyExtraServiceList.find(
        (rpcpd) =>
          rpcpd.date === date && rpcpd.ratePlanId === ratePlanId && rpcpd.hotelId === hotelId
      );

      if (ratePlanDailyExtraService) {
        ratePlanDailyExtraService.extraServiceCodeList = input.hotelExtrasCodeList;
        saveList.push(ratePlanDailyExtraService);
      } else {
        const newRatePlanDailyExtraService = new RatePlanDailyExtraService();
        newRatePlanDailyExtraService.hotelId = hotelId;
        newRatePlanDailyExtraService.ratePlanId = ratePlanId;
        newRatePlanDailyExtraService.date = date;
        newRatePlanDailyExtraService.extraServiceCodeList = input.hotelExtrasCodeList;
        saveList.push(newRatePlanDailyExtraService);
      }
    }

    return await this.ratePlanDailyExtraServiceRepository.save(saveList);
  }

  async deleteRatePlanExtrasDaily(input: DeleteRatePlanExtrasDailyInputDto) {
    const { hotelId, ratePlanId, fromDate, toDate, daysOfWeek } = input;

    const dates = getAllowedDateByDayOfWeek(fromDate, toDate, daysOfWeek || []);

    return await this.ratePlanDailyExtraServiceRepository.delete({
      hotelId: hotelId,
      ratePlanId: ratePlanId,
      date: In(dates)
    });
  }

  async createOrUpdateRatePlanPaymentTermDaily(
    input: CreateOrUpdateRatePlanPaymentTermDailyInputDto
  ) {
    const { hotelId, ratePlanId, fromDate, toDate, daysOfWeek, paymentTermCode } = input;

    const dates = getAllowedDateByDayOfWeek(fromDate, toDate, daysOfWeek || []);

    const ratePlanPaymentTermDailyList = await this.ratePlanDailyPaymentTermRepository.findAll({
      hotelId: hotelId,
      ratePlanIds: [ratePlanId],
      dates: dates
    });

    const saveList: RatePlanDailyPaymentTerm[] = [];
    for (const date of dates) {
      const ratePlanPaymentTermDaily = ratePlanPaymentTermDailyList.find(
        (rpcpd) =>
          rpcpd.date === date && rpcpd.ratePlanId === ratePlanId && rpcpd.hotelId === hotelId
      );

      if (ratePlanPaymentTermDaily) {
        ratePlanPaymentTermDaily.paymentTermCode = input.paymentTermCode;
        saveList.push(ratePlanPaymentTermDaily);
      } else {
        const newRatePlanPaymentTermDaily = new RatePlanDailyPaymentTerm();
        newRatePlanPaymentTermDaily.hotelId = hotelId;
        newRatePlanPaymentTermDaily.ratePlanId = ratePlanId;
        newRatePlanPaymentTermDaily.date = date;
        newRatePlanPaymentTermDaily.paymentTermCode = paymentTermCode;
        saveList.push(newRatePlanPaymentTermDaily);
      }
    }

    return await this.ratePlanDailyPaymentTermRepository.save(saveList);
  }

  async deleteRatePlanCancellationPolicyDaily(
    input: DeleteRatePlanCancellationPolicyDailyInputDto
  ) {
    const { hotelId, ratePlanId, fromDate, toDate, daysOfWeek } = input;

    const dates = getAllowedDateByDayOfWeek(fromDate, toDate, daysOfWeek || []);

    return await this.ratePlanDailyCancellationPolicyRepository.delete({
      hotelId: hotelId,
      ratePlanId: ratePlanId,
      date: In(dates)
    });
  }

  async getMostBeneficialCxlPolicyReservations(params: {
    mapRatePlanCxlPolicies: Map<
      string,
      {
        ratePlanId: string;
        arrival: string;
        departure: string;
      }
    >;
  }): Promise<Record<string, string> | null> {
    const ratePlanIds = Array.from(params.mapRatePlanCxlPolicies.keys());

    if (!ratePlanIds?.length) return {};

    const ratePlans = await this.ratePlanRepository
      .createQueryBuilder('ratePlan')
      .leftJoinAndSelect('ratePlan.baseSetting', 'baseSetting')
      .leftJoinAndSelect('baseSetting.ratePlan', 'baseRatePlan')
      .where('ratePlan.id IN (:...ratePlanIds)', { ratePlanIds })
      .getMany();
    const mapDefaultCxlPolicyCodes = ratePlans.reduce(
      (acc, rp) => {
        acc[rp.id] = rp.baseSetting?.ratePlan?.hotelCxlPolicyCode || rp.hotelCxlPolicyCode;
        return acc;
      },
      {} as Record<string, string>
    );

    return mapDefaultCxlPolicyCodes;
  }

  async getMostBeneficialCxlPolicy(params: {
    ratePlans: {
      id: string;
      hotelCxlPolicyCode?: string;
    }[];
    hotelId: string;
    fromDate: string;
    toDate: string;
    translateTo?: string | null;
  }): Promise<
    {
      ratePlanId: string;
      hotelCancellationPolicy?: HotelCancellationPolicy;
    }[]
  > {
    const { ratePlans, hotelId, fromDate, toDate, translateTo } = params;

    const ratePlanIds = ratePlans.map((item) => item.id);

    const allDailyRatePlanCxlPolicies = await this.getRatePlanCancellationPolicyDailyList({
      ratePlanIdList: ratePlanIds,
      hotelId,
      fromDate: fromDate,
      toDate: toDate
    });

    const cxlPolicyCodes = Array.from(
      new Set(allDailyRatePlanCxlPolicies.map((x) => x.cxlPolicyCode))
    );

    // const cxlPolicyCodeMap = new Map<RatePlanId, RatePlanCxlPolicyDailyDto['cxlPolicyCode'][]>();
    // for (const cxlPolicy of allDailyRatePlanCxlPolicies) {
    //   const existing = cxlPolicyCodeMap.get(cxlPolicy.ratePlanId) || [];
    //   existing.push(cxlPolicy.cxlPolicyCode);
    //   cxlPolicyCodeMap.set(cxlPolicy.ratePlanId, existing);
    // }

    const cxlPolicies =
      cxlPolicyCodes.length > 0
        ? await this.hotelCancellationPolicyRepository.getHotelCancellationPolicies({
            hotelId,
            codes: Array.from(cxlPolicyCodes)
          })
        : [];

    if (!cxlPolicies || cxlPolicies.length === 0) {
      return [];
    }

    const dailyRatePlanCxlPolicyMap = groupByToMap(
      allDailyRatePlanCxlPolicies,
      (item) => item.ratePlanId
    );
    const cxlPolicyCodeMap = groupByToMapSingle(cxlPolicies, (item) => item.code);
    const mostBeneficialCxlPolicyMap = new Map<RatePlanId, HotelCancellationPolicy>();

    for (const ratePlanId of ratePlanIds) {
      const findDailyRatePlanCxlPolicies = dailyRatePlanCxlPolicyMap.get(ratePlanId) || [];
      const findCxlPolicies = findDailyRatePlanCxlPolicies
        .map((item) => cxlPolicyCodeMap.get(item.cxlPolicyCode))
        .filter((item) => item !== undefined);

      if (findCxlPolicies.length > 0) {
        let mostBeneficial = findCxlPolicies.find(
          (p: any) => p.hourPrior !== null && p.hourPrior !== undefined && p.hourPrior <= 0
        );

        if (!mostBeneficial) {
          mostBeneficial = findCxlPolicies
            .sort((a: any, b: any) => (a.hourPrior ?? -Infinity) - (b.hourPrior ?? -Infinity)) // ascending
            .pop(); // max hourPrior
        }

        if (mostBeneficial) {
          const translation = mostBeneficial.translations.find(
            (t: any) => t.languageCode === translateTo
          );

          if (translation) {
            if (translation.name) {
              mostBeneficial.name = translation.name;
            }
            if (translation.description) {
              mostBeneficial.description = translation.description;
            }
          }

          mostBeneficialCxlPolicyMap.set(ratePlanId, mostBeneficial);
        }
      }
    }

    return ratePlanIds.map((ratePlanId) => ({
      ratePlanId,
      hotelCancellationPolicy: mostBeneficialCxlPolicyMap.get(ratePlanId)
    }));
  }

  async getMostBeneficialPaymentTerm(params: {
    ratePlans: {
      id: string;
      paymentTermCode?: string;
    }[];
    hotelId: string;
    fromDate: string;
    toDate: string;
  }): Promise<
    {
      ratePlanId: string;
      hotelPaymentTerm: HotelPaymentTerm;
    }[]
  > {
    const { ratePlans, hotelId, fromDate, toDate } = params;
    if (!ratePlans || ratePlans.length === 0 || !hotelId) return [];

    try {
      const ratePlanIds = ratePlans.map((item) => item.id);
      const ranges = Helper.generateDateRange(params.fromDate, params.toDate);

      const dailyRatePlanPaymentTermsResponse = await this.getRatePlanPaymentTermDailyList({
        ratePlanIdList: ratePlanIds,
        hotelId,
        fromDate: fromDate,
        toDate: toDate
      });

      const ratePlanPaymentTermSettings =
        await this.ratePlanDailyPaymentTermSettingRepository.findAll(
          {
            ratePlanIds,
            hotelId,
            isDefault: true,
            isHasSupportedPaymentMethod: true
          },
          {
            id: true,
            ratePlanId: true,
            hotelPaymentTermId: true
          }
        );

      const dailyRatePlanPaymentTerms = dailyRatePlanPaymentTermsResponse || [];

      const hotelPaymentTermIdMap = new Map<RatePlan['id'], (string | null)[]>();
      const hotelPaymentTermCodeMap = new Map<RatePlan['id'], (string | null)[]>();

      for (const term of dailyRatePlanPaymentTerms) {
        if (term.ratePlanId) {
          const codes = hotelPaymentTermCodeMap.get(term.ratePlanId) || [];
          codes.push(term.paymentTermCode ?? null);
          hotelPaymentTermCodeMap.set(term.ratePlanId, codes);
        }
      }

      for (const ratePlanId of ratePlanIds) {
        const codes = hotelPaymentTermCodeMap.get(ratePlanId) || [];
        const hasDateNotSetPaymentTerm = codes.length < ranges.length;
        if (hasDateNotSetPaymentTerm) {
          const hotelPaymentTermIds = ratePlanPaymentTermSettings
            .filter((setting) => setting.ratePlanId === ratePlanId)
            .map((setting) => setting.hotelPaymentTermId);
          if (hotelPaymentTermIds && hotelPaymentTermIds.length > 0) {
            const ids = hotelPaymentTermIdMap.get(ratePlanId) || [];
            ids.push(...hotelPaymentTermIds);
            hotelPaymentTermIdMap.set(ratePlanId, ids);
          }
        }
      }

      const hotelPaymentTerms = await this.hotelPaymentTermRepository.getHotelPaymentTerms({
        hotelId
      });

      if (hotelPaymentTerms.length === 0) return [];

      const results: { ratePlanId: string; hotelPaymentTerm: HotelPaymentTerm }[] = [];
      for (const ratePlanId of ratePlanIds) {
        const hotelPaymentTermIds = (hotelPaymentTermIdMap.get(ratePlanId) || []).filter(
          (id): id is string => !!id
        );
        const hotelPaymentTermCodes = (hotelPaymentTermCodeMap.get(ratePlanId) || []).filter(
          (code): code is string => !!code
        );

        const filteredHotelPaymentTerms = hotelPaymentTerms.filter(
          (term) =>
            hotelPaymentTermIds.includes(term.id) || hotelPaymentTermCodes.includes(term.code)
        );

        if (filteredHotelPaymentTerms.length > 0) {
          const hotelPaymentTerm = filteredHotelPaymentTerms.reduce((max, current) => {
            const maxPayOnConfirmation = max.payOnConfirmation || 0;
            const currentPayOnConfirmation = current.payOnConfirmation || 0;
            return currentPayOnConfirmation > maxPayOnConfirmation ? current : max;
          });
          if (hotelPaymentTerm) {
            results.push({ ratePlanId, hotelPaymentTerm: hotelPaymentTerm });
          }
        }
      }

      return results;
    } catch (error) {
      return [];
    }
  }

  private getRatePlanCxlPolicyDefaultOrDailyList(input: {
    hotelId: string;
    ratePlans: RatePlan[];
    ratePlanCancellationPolicyDailyList: RatePlanCxlPolicyDaily[];
    dateRange: string[];
    ratePlanIdList: string[];
  }): RatePlanCxlPolicyDailyDto[] {
    const { hotelId, ratePlans, ratePlanCancellationPolicyDailyList, dateRange, ratePlanIdList } =
      input;

    const results: RatePlanCxlPolicyDailyDto[] = [];
    for (const date of dateRange) {
      for (const ratePlanId of ratePlanIdList) {
        let cxlPolicyCode = '';
        let isAdjusted = false;
        // default
        const ratePlan = ratePlans.find((rp) => rp.id === ratePlanId);
        if (!ratePlan) {
          throw new BadRequestException('Rate plan not found');
        }

        cxlPolicyCode = ratePlan.hotelCxlPolicyCode;
        // daily
        const ratePlanCancellationPolicyDaily = ratePlanCancellationPolicyDailyList.find(
          (rpcpd) => rpcpd.ratePlanId === ratePlanId && rpcpd.date === date
        );

        if (ratePlanCancellationPolicyDaily) {
          cxlPolicyCode = ratePlanCancellationPolicyDaily.cxlPolicyCode;
          isAdjusted = true;
        }

        results.push({
          id: ratePlanId,
          cxlPolicyCode: cxlPolicyCode,
          hotelId: hotelId,
          ratePlanId: ratePlanId,
          date: date,
          isAdjusted: isAdjusted
        });
      }
    }

    return results;
  }

  private getRatePlanPaymentTermDefaultOrDailyList(input: {
    hotelId: string;
    hotelPaymentTermList: HotelPaymentTerm[];
    ratePlanPaymentTermSettingList: RatePlanPaymentTermSetting[];
    ratePlanPaymentTermDailyList: RatePlanDailyPaymentTerm[];
    dateRange: string[];
    ratePlanIdList: string[];
  }): RatePlanPaymentTermDailyDto[] {
    const {
      hotelId,
      hotelPaymentTermList,
      ratePlanPaymentTermSettingList,
      ratePlanPaymentTermDailyList,
      dateRange,
      ratePlanIdList
    } = input;

    const results: RatePlanPaymentTermDailyDto[] = [];
    for (const date of dateRange) {
      for (const ratePlanId of ratePlanIdList) {
        let paymentTermCode = '';
        let isAdjusted = false;
        // default
        const ratePlanPaymentTermSetting = ratePlanPaymentTermSettingList.find(
          (rp) => rp.ratePlanId === ratePlanId && rp.isDefault === true
        );

        const hotelPaymentTerm = ratePlanPaymentTermSetting
          ? hotelPaymentTermList.find(
              (hp) => hp.id === ratePlanPaymentTermSetting.hotelPaymentTermId
            )
          : null;

        paymentTermCode = hotelPaymentTerm?.code || '';

        // daily
        const ratePlanDailyPaymentTerm = ratePlanPaymentTermDailyList.find(
          (rpcpd) => rpcpd.ratePlanId === ratePlanId && rpcpd.date === date
        );

        if (ratePlanDailyPaymentTerm) {
          paymentTermCode = ratePlanDailyPaymentTerm.paymentTermCode;
          isAdjusted = true;
        }

        results.push({
          id: ratePlanId,
          paymentTermCode: paymentTermCode,
          hotelId: hotelId,
          ratePlanId: ratePlanId,
          date: date,
          isAdjusted: isAdjusted
        });
      }
    }

    return results;
  }

  private getRatePlanHotelExtrasDefaultOrDailyList(input: {
    hotelId: string;
    hotelAmenityList: HotelAmenity[];
    ratePlanExtraServiceList: RatePlanExtraService[];
    ratePlanDailyExtraServiceList: RatePlanDailyExtraService[];
    dateRange: string[];
    ratePlanIdList: string[];
    types?: RatePlanExtraServiceType[];
  }): RatePlanHotelExtrasDailyDto[] {
    const {
      hotelId,
      hotelAmenityList,
      ratePlanExtraServiceList,
      ratePlanDailyExtraServiceList,
      dateRange,
      ratePlanIdList,
      types
    } = input;

    const results: RatePlanHotelExtrasDailyDto[] = [];
    for (const date of dateRange) {
      for (const ratePlanId of ratePlanIdList) {
        let includedHotelAmenityList: HotelAmenity[] = [];
        let isAdjusted = false;
        // default
        const ratePlanExtraServiceFiltered = ratePlanExtraServiceList.filter(
          (rp) => rp.ratePlanId === ratePlanId && (types ? types.includes(rp.type) : true)
        );
        if (!ratePlanExtraServiceFiltered) {
          throw new BadRequestException('Rate plan not found');
        }

        const extraIds = ratePlanExtraServiceFiltered.map((rpe) => rpe.extrasId);
        includedHotelAmenityList = hotelAmenityList.filter((ha) => extraIds.includes(ha.id));

        // daily
        const ratePlanDailyExtraService = ratePlanDailyExtraServiceList.find(
          (rpcpd) => rpcpd.ratePlanId === ratePlanId && rpcpd.date === date
        );

        if (ratePlanDailyExtraService) {
          const extraCodes = ratePlanDailyExtraService.extraServiceCodeList;
          includedHotelAmenityList = hotelAmenityList.filter((ha) => extraCodes.includes(ha.code));
          isAdjusted = true;
        }

        results.push({
          id: ratePlanId,
          hotelExtrasList: includedHotelAmenityList.map((ha) => ({
            id: ha.id,
            name: ha.name,
            code: ha.code,

            hotelAmenityPriceList: ha.hotelAmenityPrices?.map((hap) => ({
              price: hap.price,
              hotelAgeCategory: hap.hotelAgeCategory
            }))
          })),
          ratePlanId: ratePlanId,
          isAdjusted: isAdjusted,
          date: date
        });
      }
    }

    return results;
  }
}
