import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format, subDays } from 'date-fns';
import { DATE_FORMAT } from 'src/core/constants/date.constant';
import { DB_NAME } from 'src/core/constants/db.const';
import { GlobalPaymentMethod } from 'src/core/entities/hotel-entities/global-payment-method.entity';
import {
  GlobalPaymentProvider,
  GlobalPaymentProviderCodeEnum
} from 'src/core/entities/hotel-entities/global-payment-provider.entity';
import { HotelCancellationPolicy } from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import {
  HotelPaymentMethodSetting,
  PaymentMethodStatusEnum
} from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { HotelPaymentModeCodeEnum } from 'src/core/entities/hotel-entities/hotel-payment-mode.entity';
import { HotelPaymentTerm } from 'src/core/entities/hotel-entities/hotel-payment-term.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RatePlanDerivedSetting } from 'src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanPaymentTermSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanCxlPolicyDaily } from 'src/core/entities/rate-plan-cxl-policy-daily.entity';
import { RatePlanDailyPaymentTerm } from 'src/core/entities/rate-plan-daily-payment-term.entity';
import { Helper } from 'src/core/helper/utils';
import { groupByToMap, groupByToMapSingle } from 'src/core/utils/group-by.util';
import { RatePlanPaymentTermSettingDto } from 'src/modules/hotel-rate-plan/dtos/rate-plan-payment-term-setting.dto';
import { SellingRatePlanService } from 'src/modules/hotel-rate-plan/services/selling-rate-plan.service';
import {
  RatePlanCancellationPolicyDailyDto,
  RatePlanCancellationPolicyDailyFilter
} from 'src/modules/rate-plan-cancellation-policy-daily/rate-plan-cancellation-policy-daily.dto';
import { In, IsNull, Raw, Repository } from 'typeorm';
import {
  AvailablePaymentMethodDto,
  AvailablePaymentMethodFilterDto,
  GlobalPaymentMethodDto,
  GlobalPaymentProviderDto,
  PaymentMethodDetailsDto,
  RatePlanPaymentTermDailyDto,
  RatePlanPaymentTermDailyFilterDto
} from './dtos/payment.dto';

type RatePlanId = RatePlan['id'];
type HotelCancellationPolicyCode = HotelCancellationPolicy['code'];

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(RatePlanDerivedSetting, DB_NAME.POSTGRES)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,

    @InjectRepository(GlobalPaymentMethod, DB_NAME.POSTGRES)
    private readonly globalPaymentMethodRepository: Repository<GlobalPaymentMethod>,

    @InjectRepository(HotelPaymentMethodSetting, DB_NAME.POSTGRES)
    private readonly hotelPaymentMethodSettingRepository: Repository<HotelPaymentMethodSetting>,

    @InjectRepository(RatePlanPaymentTermSetting, DB_NAME.POSTGRES)
    private readonly ratePlanPaymentTermSettingRepository: Repository<RatePlanPaymentTermSetting>,

    @InjectRepository(HotelPaymentTerm, DB_NAME.POSTGRES)
    private readonly hotelPaymentTermRepository: Repository<HotelPaymentTerm>,

    @InjectRepository(GlobalPaymentProvider, DB_NAME.POSTGRES)
    private readonly globalPaymentProviderRepository: Repository<GlobalPaymentProvider>,

    @InjectRepository(HotelCancellationPolicy, DB_NAME.POSTGRES)
    private readonly hotelCancellationPolicyRepository: Repository<HotelCancellationPolicy>,

    @InjectRepository(RatePlanDailyPaymentTerm, DB_NAME.POSTGRES)
    private readonly ratePlanDailyPaymentTermRepository: Repository<RatePlanDailyPaymentTerm>,

    @InjectRepository(RatePlanCxlPolicyDaily, DB_NAME.POSTGRES)
    private readonly ratePlanCxlPolicyDailyRepository: Repository<RatePlanCxlPolicyDaily>,

    private readonly sellingRatePlanService: SellingRatePlanService
  ) {}

  async availablePaymentMethodList(
    filter: AvailablePaymentMethodFilterDto
  ): Promise<AvailablePaymentMethodDto[]> {
    const { hotelCode, ratePlanCodes, fromDate, toDate } = filter;

    // Validate input parameters
    if (!hotelCode?.trim() || !ratePlanCodes?.length || !fromDate || !toDate) {
      return [];
    }

    try {
      // Get property
      const hotel = await this.hotelRepository.findOne({
        where: {
          code: hotelCode
        },
        select: ['id']
      });
      if (!hotel?.id) {
        this.logger.log('[availablePaymentMethodList] - Not found property');
        return [];
      }
      const hotelId = hotel.id;
      const ratePlans = await this.ratePlanRepository.find({
        where: {
          hotelId,
          code: In(ratePlanCodes)
        },
        select: ['id', 'hotelId']
      });

      if (ratePlans.length === 0) {
        this.logger.log('[availablePaymentMethodList] - Not found sales plan');
        return [];
      }

      // Process each sales plan to get payment method codes
      const salesPlanPaymentMethodCodeList: string[] = [];

      const mostBeneficialPaymentTerms = await this.getMostBeneficialPaymentTerm({
        ratePlanIds: ratePlans.map((rp) => rp.id),
        hotelId,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate)
      });

      if (mostBeneficialPaymentTerms.length === 0) {
        this.logger.log('[availablePaymentMethodList] - Not found most beneficial payment term');
        return [];
      }

      const hotelPaymentTermIds = mostBeneficialPaymentTerms
        .map((term) => term.hotelPaymentTerm.id)
        .filter((id): id is string => !!id);

      const ratePlanPaymentTerms = await this.getRatePlanPaymentTermWithHotelPaymentTerm(
        hotelId,
        ratePlans.map((rp) => rp.id),
        hotelPaymentTermIds,
        false
      );

      for (const ratePlan of ratePlans) {
        if (!ratePlan.id) continue;

        const hotelPaymentTerm = mostBeneficialPaymentTerms.find(
          (term) => term.ratePlanId === ratePlan.id
        )?.hotelPaymentTerm;

        if (!hotelPaymentTerm?.id) {
          this.logger.log(
            `[availablePaymentMethodList] - Not found sales plan most beneficial payment term: ${ratePlan.code}`
          );
          continue;
        }

        const filteredSettings = ratePlanPaymentTerms.filter(
          (f) =>
            f.hotelPaymentTerm &&
            f.supportedPaymentMethodCodeList?.length &&
            f.ratePlanId === ratePlan.id
        );

        if (filteredSettings.length === 0) {
          this.logger.log(
            `[availablePaymentMethodList] - Not found sales plan payment term setting: ${ratePlan.code}`
          );
          continue;
        }

        const supportedPaymentMethodCodeList = filteredSettings.flatMap(
          (f) => f.supportedPaymentMethodCodeList || []
        );

        if (supportedPaymentMethodCodeList.length > 0) {
          salesPlanPaymentMethodCodeList.push(...supportedPaymentMethodCodeList);
        }
      }

      // Remove duplicates
      const uniquePaymentMethodCodes = [...new Set(salesPlanPaymentMethodCodeList)];
      if (uniquePaymentMethodCodes.length === 0) {
        this.logger.log('[availablePaymentMethodList] - Not found sales plan payment method');
        throw new BadRequestException('Not found sales plan payment method');
      }

      // Convert to enum values
      const globalPaymentMethods = await this.getGlobalPaymentMethods(uniquePaymentMethodCodes);

      if (globalPaymentMethods.length === 0) {
        this.logger.log('[availablePaymentMethodList] - Not found global payment method');
        throw new BadRequestException('Not found global payment method');
      }

      const globalPaymentMethodIds = globalPaymentMethods
        .map((method) => method.id)
        .filter((id): id is string => !!id);

      const globalPaymentMethodMap = new Map<string, GlobalPaymentMethodDto>();
      globalPaymentMethods.forEach((method) => {
        if (method.id) {
          globalPaymentMethodMap.set(method.id, method);
        }
      });

      const hotelPaymentMethodSettings = await this.hotelPaymentMethodSettingRepository.find({
        where: {
          hotelId,
          globalPaymentMethodId: In(globalPaymentMethodIds),
          status: PaymentMethodStatusEnum.ACTIVE,
          deletedAt: IsNull()
        }
      });

      if (hotelPaymentMethodSettings.length === 0) {
        this.logger.log('[availablePaymentMethodList] - Not found property payment method');
        throw new BadRequestException('Not found property payment method');
      }

      // Group by global payment method ID
      const hotelPaymentMethodMap = new Map<
        GlobalPaymentMethod['id'],
        HotelPaymentMethodSetting[]
      >();
      hotelPaymentMethodSettings.forEach((setting) => {
        if (setting.globalPaymentMethodId) {
          const existing = hotelPaymentMethodMap.get(setting.globalPaymentMethodId) || [];
          existing.push(setting);
          hotelPaymentMethodMap.set(setting.globalPaymentMethodId, existing);
        }
      });

      // Set data
      const availablePaymentMethodList: AvailablePaymentMethodDto[] = [];

      for (const [globalPaymentMethodId, settingList] of hotelPaymentMethodMap.entries()) {
        const globalPaymentMethod = globalPaymentMethodMap.get(globalPaymentMethodId);
        if (!globalPaymentMethod) continue;

        const paymentProviderMap = new Map<string, any>();
        if (globalPaymentMethod.paymentProviderList?.length) {
          globalPaymentMethod.paymentProviderList.forEach((provider) => {
            if (provider.id) {
              paymentProviderMap.set(provider.id, provider);
            }
          });
        }

        const data: AvailablePaymentMethodDto = {
          paymentMethodId: globalPaymentMethod.id,
          paymentMethodCode: globalPaymentMethod.code,
          paymentMethodName: globalPaymentMethod.name,
          paymentMethodDescription: globalPaymentMethod.description,
          paymentMethodDetailsList: []
        };

        const paymentMethodDetailsList: PaymentMethodDetailsDto[] = [];
        for (const setting of settingList) {
          let paymentProvider: GlobalPaymentProviderDto | undefined = undefined;
          if (setting.globalPaymentProviderId) {
            paymentProvider = paymentProviderMap.get(setting.globalPaymentProviderId) || null;
          }

          const paymentMethodDetails: PaymentMethodDetailsDto = {
            metadata: setting.metadata,
            paymentProvider
          };
          paymentMethodDetailsList.push(paymentMethodDetails);
        }
        data.paymentMethodDetailsList = paymentMethodDetailsList;
        availablePaymentMethodList.push(data);
      }

      // Overwrite name of other payment method and clean sensitive data
      availablePaymentMethodList.forEach((paymentMethod) => {
        // Handle PMDOTH (Other payment method)
        if (paymentMethod.paymentMethodCode === HotelPaymentModeCodeEnum.PMDOTH) {
          if (
            paymentMethod.paymentMethodDetailsList?.length &&
            paymentMethod.paymentMethodDetailsList[0].metadata?.metadata
          ) {
            const metadataObj = paymentMethod.paymentMethodDetailsList[0].metadata.metadata;
            if (
              metadataObj['customName'] &&
              typeof metadataObj['customName'] === 'string' &&
              metadataObj['customName'].trim()
            ) {
              paymentMethod.paymentMethodName = metadataObj['customName'];
            }
          }
        }

        // Handle GUAWCC (Credit card payment) - clean sensitive data
        if (paymentMethod.paymentMethodCode === HotelPaymentModeCodeEnum.GUAWCC) {
          if (paymentMethod.paymentMethodDetailsList?.length) {
            const paymentMethodDetail = paymentMethod.paymentMethodDetailsList[0];
            if (paymentMethodDetail?.metadata && paymentMethodDetail?.paymentProvider) {
              const metadata = paymentMethodDetail.metadata;
              const paymentProvider = paymentMethodDetail.paymentProvider.code;

              if (paymentProvider === GlobalPaymentProviderCodeEnum.ADYEN && metadata.metadata) {
                const metadataObj = { ...metadata.metadata };
                delete metadataObj['apiKey'];
                delete metadataObj['hmacKey'];
                delete metadataObj['merchantAccount'];
                delete metadataObj['urlPrefix'];
                metadata.metadata = metadataObj;
              }

              if (
                paymentProvider === GlobalPaymentProviderCodeEnum.APALEO_PAY &&
                metadata.metadata
              ) {
                const metadataObj = { ...metadata.metadata };
                delete metadataObj['paymentApiKey'];
                delete metadataObj['subMerchantId'];
                delete metadataObj['merchant'];
                delete metadataObj['urlPrefix'];
                metadata.metadata = metadataObj;
              }

              if (paymentProvider === GlobalPaymentProviderCodeEnum.ONE_PAY && metadata.metadata) {
                metadata.metadata = undefined;
              }

              if (
                paymentProvider === GlobalPaymentProviderCodeEnum.GAUVENDI_PAY &&
                metadata.metadata
              ) {
                const bookingEngineOriginKey =
                  metadata.metadata['bookingEngineOriginKey'] != null
                    ? metadata.metadata['bookingEngineOriginKey'].toString()
                    : null;
                const publicKey =
                  metadata.metadata['publicKey'] != null
                    ? metadata.metadata['publicKey'].toString()
                    : null;
                metadata.metadata = {
                  bookingEngineOriginKey: bookingEngineOriginKey,
                  publicKey,
                };
              }
            }
          }
        }
      });

      // Set response
      return availablePaymentMethodList;
    } catch (error) {
      this.logger.error('[availablePaymentMethodList] - Error:', error);
      throw error;
    }
  }

  private async getGlobalPaymentMethods(codeList: string[]): Promise<GlobalPaymentMethodDto[]> {
    const paymentMethodCodeList: HotelPaymentModeCodeEnum[] = [];
    codeList.forEach((code) => {
      if (Object.values(HotelPaymentModeCodeEnum).includes(code as HotelPaymentModeCodeEnum)) {
        paymentMethodCodeList.push(code as HotelPaymentModeCodeEnum);
      }
    });

    const globalPaymentMethods = await this.globalPaymentMethodRepository.find({
      where: {
        code: In(codeList)
      }
    });
    const paymentProviderCodes = globalPaymentMethods.flatMap(
      (method) => method.supportedPaymentProviderCodes || []
    );
    const paymentProviders = await this.globalPaymentProviderRepository.find({
      where: {
        code: In(paymentProviderCodes)
      }
    });

    return globalPaymentMethods.map((method) => {
      return {
        ...method,
        paymentProviderList: paymentProviders.filter((provider) =>
          method.supportedPaymentProviderCodes?.includes(provider.code)
        )
      };
    });
  }

  async getMostBeneficialPaymentTerm(params: {
    ratePlanIds: string[];
    hotelId: string;
    fromDate: Date;
    toDate: Date;
  }): Promise<
    {
      ratePlanId: string;
      hotelPaymentTerm: HotelPaymentTerm;
    }[]
  > {
    const { ratePlanIds, hotelId } = params;
    if (!ratePlanIds || !hotelId) return [];

    try {
      const fromDate = format(params.fromDate, DATE_FORMAT);
      const toDate = format(subDays(params.toDate, 1), DATE_FORMAT);

      const los = Helper.generateDateRange(fromDate, toDate).length;

      const dailyRatePlanPaymentTermsResponse = await this.getRatePlanPaymentTermDailyList({
        ratePlanIdList: ratePlanIds,
        hotelId,
        fromDate: fromDate,
        toDate: toDate
      });

      const ratePlanPaymentTermSettings = await this.ratePlanPaymentTermSettingRepository.find({
        where: {
          ratePlanId: In(ratePlanIds),
          hotelId,
          isDefault: true,
          supportedPaymentMethodCodes: Raw((alias) => `array_length(${alias}, 1) > 0`)
        },
        select: ['id', 'ratePlanId', 'hotelPaymentTermId']
      });

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
        const hasDateNotSetPaymentTerm = codes.length < los;
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

      const hotelPaymentTerms = await this.hotelPaymentTermRepository.find({
        where: [
          {
            hotelId
          }
        ]
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
      this.logger.error('[getMostBeneficialPaymentTerm] - Error:', error);
      return [];
    }
  }

  async getMostBeneficialCxlPolicy(params: {
    ratePlanIds: string[];
    hotelId: string;
    fromDate: string;
    toDate: string;
    translateTo?: string | null;
    defaultCxlPolicyCodes?: {
      ratePlanId: RatePlanId;
      cxlPolicyCode?: HotelCancellationPolicyCode;
    }[];
  }): Promise<
    {
      ratePlanId: string;
      hotelCancellationPolicy?: HotelCancellationPolicy;
    }[]
  > {
    const { ratePlanIds, hotelId, fromDate, toDate, translateTo, defaultCxlPolicyCodes } = params;

    // Load daily cancellation policies for the stay dates
    const dailyRatePlanCxlPolicyFilter: RatePlanCancellationPolicyDailyFilter = {
      ratePlanIdList: ratePlanIds,
      hotelId,
      fromDate: fromDate,
      toDate: toDate
    };

    const allDailyRatePlanCxlPolicies = await this.getRatePlanCancellationPolicyDailyList(
      dailyRatePlanCxlPolicyFilter
    );

    const cxlPolicyCodes = Array.from(
      new Set(allDailyRatePlanCxlPolicies.map((item) => item.cxlPolicyCode))
    );
    // const cxlPolicyCodeMap = new Map<RatePlanId, HotelCancellationPolicyCode[]>();
    // for (const cxlPolicy of allDailyRatePlanCxlPolicies) {
    //   const existing = dailyRatePlanCxlPolicyMap.get(cxlPolicy.ratePlanId) || [];
    //   existing.push(cxlPolicy);
    //   dailyRatePlanCxlPolicyMap.set(cxlPolicy.ratePlanId, existing);
    // }

    // for (const ratePlanId of ratePlanIds) {
    //   const defaultCxlPolicyCodes = params.defaultCxlPolicyCodes?.filter(
    //     (x) => x.ratePlanId === ratePlanId
    //   );
    //   if (defaultCxlPolicyCodes && defaultCxlPolicyCodes.length > 0) {
    //     for (const code of defaultCxlPolicyCodes) {
    //       if (code.cxlPolicyCode) {
    //         const existing = cxlPolicyCodeMap.get(ratePlanId) || [];
    //         existing.push(code.cxlPolicyCode);
    //         cxlPolicyCodeMap.set(ratePlanId, existing);
    //       }
    //     }
    //   }
    // }

    const cxlPolicies =
      cxlPolicyCodes.length > 0
        ? await this.hotelCancellationPolicyRepository.find({
            where: {
              hotelId,
              code: In(cxlPolicyCodes)
            }
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

  private async getRatePlanPaymentTermWithHotelPaymentTerm(
    hotelId: string,
    ratePlanIds: string[],
    hotelPaymentTermIds: string[],
    isDefault: boolean
  ): Promise<RatePlanPaymentTermSettingDto[]> {
    const ratePlanPaymentTermSettings = await this.ratePlanPaymentTermSettingRepository.find({
      where: [
        {
          ratePlanId: In(ratePlanIds),
          hotelId,
          isDefault,
          supportedPaymentMethodCodes: Raw((alias) => `array_length(${alias}, 1) > 0`)
        },
        {
          ratePlanId: In(ratePlanIds),
          hotelId,
          hotelPaymentTermId: In(hotelPaymentTermIds),
          supportedPaymentMethodCodes: Raw((alias) => `array_length(${alias}, 1) > 0`)
        }
      ]
    });

    const ids = ratePlanPaymentTermSettings.map((setting) => setting.hotelPaymentTermId);

    const hotelPaymentTermList = await this.hotelPaymentTermRepository.find({
      where: {
        id: In([...hotelPaymentTermIds, ...ids])
      }
    });

    return ratePlanPaymentTermSettings.map((setting) => {
      return {
        ...setting,
        supportedPaymentMethodCodeList: setting.supportedPaymentMethodCodes,
        hotelPaymentTerm: hotelPaymentTermList.find(
          (term) => term.id === setting.hotelPaymentTermId
        )
      };
    });
  }

  async getRatePlanPaymentTermDailyList(
    query: RatePlanPaymentTermDailyFilterDto
  ): Promise<RatePlanPaymentTermDailyDto[]> {
    const { hotelId, ratePlanIdList, idList, fromDate, toDate } = query;

    if (!hotelId || !ratePlanIdList || !fromDate || !toDate) {
      throw new BadRequestException('Invalid query');
    }

    const ratePlanDerivedSettings = (
      await this.ratePlanDerivedSettingRepository.find({
        where: {
          hotelId: hotelId,
          ratePlanId: In(ratePlanIdList || [])
        }
      })
    ).filter((setting) => setting.followDailyCxlPolicy === true);

    const dateRange = Helper.generateDateRange(fromDate, toDate);
    const masterRatePlanIds = ratePlanDerivedSettings.map((setting) => setting.derivedRatePlanId);

    const ratePLanPaymentTermSetting = await this.ratePlanPaymentTermSettingRepository.find({
      where: {
        hotelId: hotelId,
        ratePlanId: In([...masterRatePlanIds, ...(ratePlanIdList || [])]),
        isDefault: true,
        supportedPaymentMethodCodes: Raw((alias) => `array_length(${alias}, 1) > 0`)
      }
    });

    const hotelPaymentTermList = await this.hotelPaymentTermRepository.find({
      where: {
        hotelId: hotelId,
        id: In(ratePLanPaymentTermSetting.map((setting) => setting.hotelPaymentTermId))
      }
    });

    const ratePlanPaymentTermDailyList = await this.ratePlanDailyPaymentTermRepository.find({
      where: {
        hotelId: hotelId,
        ratePlanId: In([...masterRatePlanIds, ...(ratePlanIdList || [])]),
        date: In(dateRange),
        id: In(idList || [])
      }
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

  async getRatePlanCancellationPolicyDailyList(
    query: RatePlanCancellationPolicyDailyFilter
  ): Promise<RatePlanCancellationPolicyDailyDto[]> {
    const { hotelId, ratePlanIdList, idList, fromDate, toDate } = query;

    if (!hotelId || !ratePlanIdList || !fromDate || !toDate) {
      throw new BadRequestException('Invalid query');
    }

    const ratePlanDerivedSettings = (
      await this.ratePlanDerivedSettingRepository.find({
        where: {
          hotelId: hotelId,
          ratePlanId: In(ratePlanIdList || [])
        }
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
        hotelCxlPolicyCode: true
      }
    });

    const ratePlanCancellationPolicyDailyList = await this.ratePlanCxlPolicyDailyRepository.find({
      where: {
        hotelId: hotelId,
        ratePlanId: In([...masterRatePlanIds, ...(ratePlanIdList || [])]),
        date: In(dateRange),
        id: idList && idList.length > 0 ? In(idList) : undefined
      }
    });

    const masterRatePlanCxlPolicyDefaultOrDailyList =
      masterRatePlanIds && masterRatePlanIds.length > 0
        ? this.getRatePlanCxlPolicyDefaultOrDailyList({
            hotelId: hotelId,
            ratePlans: ratePLans,
            ratePlanCancellationPolicyDailyList: ratePlanCancellationPolicyDailyList,
            dateRange: dateRange,
            ratePlanIdList: masterRatePlanIds
          })
        : [];

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

  private getRatePlanCxlPolicyDefaultOrDailyList(input: {
    hotelId: string;
    ratePlans: RatePlan[];
    ratePlanCancellationPolicyDailyList: RatePlanCxlPolicyDaily[];
    dateRange: string[];
    ratePlanIdList: string[];
  }): RatePlanCancellationPolicyDailyDto[] {
    const { hotelId, ratePlans, ratePlanCancellationPolicyDailyList, dateRange, ratePlanIdList } =
      input;

    const results: RatePlanCancellationPolicyDailyDto[] = [];
    for (const date of dateRange) {
      for (const ratePlanId of ratePlanIdList) {
        let cxlPolicyCode = '';
        let isAdjusted = false;
        // default
        const ratePlan = ratePlans.find((rp) => rp.id === ratePlanId);
        if (!ratePlan) {
          throw new BadRequestException('Rate plan not found');
        }

        cxlPolicyCode = ratePlan.hotelCxlPolicyCode || '';
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
}
