import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { LogPerformance } from 'src/core/decorators/execution-time.decorator';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsSelect, FindOptionsWhere, In, Like, Raw, Repository } from 'typeorm';
import { RatePlanFilterDto } from '../dtos/rate-plan-filter.dto';
import { RatePlanDerivedSettingRepository } from './rate-plan-derived-setting.repository';

@Injectable()
export class RatePlanRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private readonly ratePlanRepository: Repository<RatePlan>,
    private readonly ratePlanDerivedSettingRepository: RatePlanDerivedSettingRepository,
    configService: ConfigService
  ) {
    super(configService);
  }

  @LogPerformance({
    loggerName: 'RatePlanRepository',
    logLevel: 'log',
    slowThreshold: 2000,
    includeArgs: false
  })
  async findAll(filterDto: RatePlanFilterDto): Promise<RatePlan[]> {
    const {
      hotelId,
      idList,
      id,
      hotelIdList,
      code,
      codeList,
      name,
      statusList,
      roundingMode,
      typeList,
      isPrimary,
      promoCodeList,
      distributionChannelList,
      languageCodeList
    } = filterDto;

    const where: FindOptionsWhere<RatePlan> = {};

    if (hotelIdList && hotelIdList.length > 0) {
      where.hotelId = In(hotelIdList);
    } else if (hotelId) {
      where.hotelId = hotelId;
    }

    if (idList && idList.length > 0) {
      where.id = In(idList);
    }

    if (code) {
      where.code = code;
    }

    if (codeList && codeList.length > 0) {
      where.code = In(codeList);
    }

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (statusList && statusList.length > 0) {
      where.status = In(statusList);
    }

    if (roundingMode) {
      where.roundingMode = roundingMode;
    }

    if (typeList && typeList.length > 0) {
      where.type = In(typeList);
    }

    if (isPrimary !== undefined) {
      where.isPrimary = isPrimary;
    }

    if (promoCodeList && promoCodeList.length > 0) {
      where.promoCodes = Raw((alias) => `"${alias}"."promo_codes" && :promoCodes`, {
        promoCodes: promoCodeList
      });
    }

    if (distributionChannelList && distributionChannelList.length > 0) {
      // where.distributionChannel = Raw(
      //   (alias) => `"${alias}"."distribution_channel" && :distributionChannel`,
      //   {
      //     distributionChannel: distributionChannelList
      //   }
      // );

      where.distributionChannel = Raw(
        (alias) => distributionChannelList.map((r) => `'${r}'`).join(' = ANY(') + ` = ANY(${alias})`
      );
    }

    if (languageCodeList && languageCodeList.length > 0) {
      if (!filterDto.relations) {
        filterDto.relations = [];
      }
      filterDto.relations.push('ratePlanTranslations');
    }

    // Get additional rate plan IDs if searching by name includes derived plans
    let additionalRatePlanIds: string[] = [];
    if (name && hotelId) {
      // Find derived plans that match the search name
      const matchingDerivedPlans = await this.ratePlanRepository.find({
        where: {
          hotelId,
          name: Like(`%${name.trim()}%`)
        },
        select: ['id']
      });

      if (matchingDerivedPlans.length > 0) {
        const matchingDerivedPlanIds = matchingDerivedPlans.map((p) => p.id);

        // Find parent plans for these derived plans
        const derivedSettingsForMatching =
          await this.ratePlanDerivedSettingRepository.findForMatching(
            hotelId,
            matchingDerivedPlanIds
          );

        additionalRatePlanIds = derivedSettingsForMatching
          .map((ds) => ds.derivedRatePlanId)
          .filter((id): id is string => id !== null)
          .concat(matchingDerivedPlanIds);
      }
    }

    // Build the final where clause
    let finalWhere = where;
    if (additionalRatePlanIds.length > 0) {
      delete where.name;
      finalWhere = { ...where, id: In([...new Set(additionalRatePlanIds)]) };
    }

    // Fetch all rate plans with derived settings
    const ratePlans = await this.ratePlanRepository.find({
      where: finalWhere,
      order: {
        isPrimary: 'DESC',
        name: 'ASC'
      },
      select: {
        id: true,
        name: true,
        code: true,
        isPrimary: true,
        roundingMode: true,
        status: true,
        description: true,
        pricingMethodology: true,
        sellingStrategyType: true,
        marketSegmentId: true,
        promoCodes: true,
        distributionChannel: true,
        rfcAttributeMode: true,
        mrfcPositioningMode: true,
        hotelExtrasCodeList: true,
        adjustmentValue: true,
        adjustmentUnit: true,
        hourPrior: true,
        cancellationFeeValue: true,
        cancellationFeeUnit: true,
        hotelCxlPolicyCode: true,
        paymentTermCode: true,
        translations: true,
        ratePlanPaymentTermSettings: {
          hotelPaymentTermId: true
        },

        ratePlanExtraServices: {
          extrasId: true
        },

        roomProductRatePlans: {
          roomProductId: true,
          roomProduct: {
            id: true,
            code: true,
            type: true
          }
        },

        baseSetting: {
          id: true,
          ratePlanId: true,
          derivedRatePlanId: true,
          followDailyPaymentTerm: true,
          followDailyCxlPolicy: true,
          followDailyIncludedAmenity: true,
          followDailyRoomProductAvailability: true,
          followDailyRestriction: true
        },

        derivedSetting: {
          id: true,
          ratePlanId: true,
          derivedRatePlanId: true,
          followDailyPaymentTerm: true,
          followDailyCxlPolicy: true,
          followDailyIncludedAmenity: true,
          followDailyRoomProductAvailability: true,
          followDailyRestriction: true
        }
      },

      relations: [
        'ratePlanPaymentTermSettings',
        'ratePlanExtraServices',
        'roomProductRatePlans',
        'roomProductRatePlans.roomProduct',
        'baseSetting',
        ...(filterDto.relations ?? [])
      ]
    });

    // Transform into tree structure
    return ratePlans;
  }

  @LogPerformance({
    loggerName: 'RatePlanRepository',
    logLevel: 'log',
    slowThreshold: 2000,
    includeArgs: false
  })
  async findAllNoRelations(
    filterDto: RatePlanFilterDto,
    select?: FindOptionsSelect<RatePlan>
  ): Promise<RatePlan[]> {
    const {
      hotelId,
      idList,
      id,
      hotelIdList,
      code,
      codeList,
      name,
      statusList,
      roundingMode,
      typeList,
      isPrimary,
      promoCodeList,
      distributionChannelList,
      languageCodeList
    } = filterDto;

    const where: FindOptionsWhere<RatePlan> = {};

    if (hotelIdList && hotelIdList.length > 0) {
      where.hotelId = In(hotelIdList);
    } else if (hotelId) {
      where.hotelId = hotelId;
    }

    if (idList && idList.length > 0) {
      where.id = In(idList);
    }

    if (code) {
      where.code = code;
    }

    if (codeList && codeList.length > 0) {
      where.code = In(codeList);
    }

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (statusList && statusList.length > 0) {
      where.status = In(statusList);
    }

    if (roundingMode) {
      where.roundingMode = roundingMode;
    }

    if (typeList && typeList.length > 0) {
      where.type = In(typeList);
    }

    if (isPrimary !== undefined) {
      where.isPrimary = isPrimary;
    }

    if (promoCodeList && promoCodeList.length > 0) {
      where.promoCodes = Raw((alias) => `"${alias}"."promo_codes" && :promoCodes`, {
        promoCodes: promoCodeList
      });
    }

    if (distributionChannelList && distributionChannelList.length > 0) {
      // where.distributionChannel = Raw(
      //   (alias) => `"${alias}"."distribution_channel" && :distributionChannel`,
      //   {
      //     distributionChannel: distributionChannelList
      //   }
      // );

      where.distributionChannel = Raw(
        (alias) => distributionChannelList.map((r) => `'${r}'`).join(' = ANY(') + ` = ANY(${alias})`
      );
    }

    if (languageCodeList && languageCodeList.length > 0) {
      if (!filterDto.relations) {
        filterDto.relations = [];
      }
      filterDto.relations.push('ratePlanTranslations');
    }

    // Get additional rate plan IDs if searching by name includes derived plans
    let additionalRatePlanIds: string[] = [];
    if (name && hotelId) {
      // Find derived plans that match the search name
      const matchingDerivedPlans = await this.ratePlanRepository.find({
        where: {
          hotelId,
          name: Like(`%${name.trim()}%`)
        },
        select: ['id']
      });

      if (matchingDerivedPlans.length > 0) {
        const matchingDerivedPlanIds = matchingDerivedPlans.map((p) => p.id);

        // Find parent plans for these derived plans
        const derivedSettingsForMatching =
          await this.ratePlanDerivedSettingRepository.findForMatching(
            hotelId,
            matchingDerivedPlanIds
          );

        additionalRatePlanIds = derivedSettingsForMatching
          .map((ds) => ds.derivedRatePlanId)
          .filter((id): id is string => id !== null)
          .concat(matchingDerivedPlanIds);
      }
    }

    // Build the final where clause
    let finalWhere = where;
    if (additionalRatePlanIds.length > 0) {
      delete where.name;
      finalWhere = { ...where, id: In([...new Set(additionalRatePlanIds)]) };
    }

    // Fetch all rate plans with derived settings
    const ratePlans = await this.ratePlanRepository.find({
      where: finalWhere,
      order: {
        isPrimary: 'DESC',
        name: 'ASC'
      },
      select: select ?? {
        id: true,
        name: true,
        code: true,
        isPrimary: true,
        roundingMode: true,
        status: true,
        description: true,
        pricingMethodology: true,
        sellingStrategyType: true,
        marketSegmentId: true,
        promoCodes: true,
        distributionChannel: true,
        rfcAttributeMode: true,
        mrfcPositioningMode: true,
        hotelExtrasCodeList: true,
        adjustmentValue: true,
        adjustmentUnit: true,
        hourPrior: true,
        cancellationFeeValue: true,
        cancellationFeeUnit: true,
        hotelCxlPolicyCode: true,
        paymentTermCode: true,
        translations: true,
        ratePlanPaymentTermSettings: {
          hotelPaymentTermId: true
        },

        ratePlanExtraServices: {
          extrasId: true
        },

        roomProductRatePlans: {
          roomProductId: true,
          roomProduct: {
            id: true,
            code: true,
            type: true
          }
        },

        baseSetting: {
          id: true,
          ratePlanId: true,
          derivedRatePlanId: true,
          followDailyPaymentTerm: true,
          followDailyCxlPolicy: true,
          followDailyIncludedAmenity: true,
          followDailyRoomProductAvailability: true,
          followDailyRestriction: true
        },

        derivedSetting: {
          id: true,
          ratePlanId: true,
          derivedRatePlanId: true,
          followDailyPaymentTerm: true,
          followDailyCxlPolicy: true,
          followDailyIncludedAmenity: true,
          followDailyRoomProductAvailability: true,
          followDailyRestriction: true
        }
      },

      relations: [...(filterDto.relations ?? [])]
    });

    // Transform into tree structure
    return ratePlans;
  }
}
