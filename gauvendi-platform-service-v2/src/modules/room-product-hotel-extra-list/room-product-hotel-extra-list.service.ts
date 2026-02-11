import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import {
  RatePlanExtraServiceType,
  RoomProductExtraType,
  ServiceTypeEnum,
  TaxSettingEnum
} from '@src/core/enums/common';
import { Helper } from '@src/core/helper/utils';
import { ExtraBedCalculateService } from '@src/core/modules/pricing-calculate/services/extra-bed.service';
import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAgeCategoryCodeEnum } from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RatePlanExtraService } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanDailyExtraService } from 'src/core/entities/rate-plan-daily-extra-service.entity';
import { RoomProductExtra } from 'src/core/entities/room-product-extra.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { S3Service } from 'src/core/s3/s3.service';
import { In, Raw, Repository } from 'typeorm';
import { HotelAmenityService } from '../hotel-amenity/hotel-amentity.service';
import { CalculateAmenityPricingService } from './calculate-amenity-pricing.service';
import { AvailableAmenityDto, HotelAmenityResponse } from './room-product-hotel-extra-list.dto';

@Injectable()
export class RoomProductHotelExtraListService {
  private readonly logger = new Logger(RoomProductHotelExtraListService.name);

  constructor(
    @InjectRepository(HotelAmenity, DB_NAME.POSTGRES)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>,

    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomProductExtra, DB_NAME.POSTGRES)
    private readonly roomProductExtraRepository: Repository<RoomProductExtra>,

    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(RatePlanExtraService, DB_NAME.POSTGRES)
    private readonly ratePlanExtraServiceRepository: Repository<RatePlanExtraService>,

    @InjectRepository(RatePlanDailyExtraService, DB_NAME.POSTGRES)
    private readonly ratePlanDailyExtraServiceRepository: Repository<RatePlanDailyExtraService>,

    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(HotelTaxSetting, DB_NAME.POSTGRES)
    private readonly hotelTaxSettingRepository: Repository<HotelTaxSetting>,

    @InjectRepository(HotelTax, DB_NAME.POSTGRES)
    private readonly hotelTaxRepository: Repository<HotelTax>,

    private readonly calculateAmenityPricingService: CalculateAmenityPricingService,

    private readonly s3Service: S3Service,

    @InjectRepository(RatePlanDerivedSetting, DB_NAME.POSTGRES)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,

    private readonly extraBedCalculateService: ExtraBedCalculateService,
    private readonly hotelAmenityService: HotelAmenityService
  ) {}


  async getAvailableAmenity(query: AvailableAmenityDto): Promise<HotelAmenityResponse[]> {
    try {
      const {
        hotelCode,
        hotelId,
        fromTime,
        toTime,
        roomProductCode,
        salesPlanCode,
        translateTo,
        distributionChannelList,
        adults,
        childrenAges,
        pets
      } = query;

      if (isNaN(+fromTime) || isNaN(+toTime)) {
        throw new BadRequestException('Invalid date fromTime or toTime');
      }

      const fromDate = format(new Date(+fromTime), 'yyyy-MM-dd');
      const toDate = format(new Date(+toTime), 'yyyy-MM-dd');

      const hotel = await this.hotelRepository.findOne({
        where: {
          ...(hotelCode && { code: hotelCode }),
          ...(hotelId && { id: hotelId })
        }
      });

      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }

      const [ratePlan, roomProduct] = await Promise.all([
        this.ratePlanRepository.findOne({
          where: {
            hotelId: hotel.id,
            code: salesPlanCode
          },
          select: {
            id: true
          }
        }),
        this.roomProductRepository.findOne({
          where: {
            hotelId: hotel.id,
            code: roomProductCode
          }
        })
      ]);

      if (!ratePlan) {
        throw new BadRequestException('Rate plan not found');
      }

      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }

      const { ratePlanExtraIds, dailyRatePlanExtraCodes, ratePlanExtraServices } =
        await this.getRatePlanAvailableAmenity({
          hotelId: hotel.id,
          ratePlanId: ratePlan.id,
          fromDate,
          toDate
        });
      const roomProductExtraList = await this.roomProductExtraRepository.find({
        where: {
          hotelId: hotel.id,
          roomProductId: roomProduct.id
        }
      });

      const roomProductExtraIds = roomProductExtraList.map((item) => item.extrasId);

      // Run queries concurrently for better performance
      const [allHotelAmenityList] = await Promise.all([
        // Find room product extra list based on room product code:

        this.hotelAmenityRepository.find({
          where: {
            hotelId: hotel.id,
            hotelAmenityPrices: {
              hotelAgeCategory: {
                code: HotelAgeCategoryCodeEnum.DEFAULT
              }
            }
          },
          relations: {
            hotelAmenityPrices: {
              hotelAgeCategory: true
            }
          }
        })
      ]);

      const calculateAllocateCapacityResults =
        this.extraBedCalculateService.calculateAllocateCapacity({
          capacityDefault: roomProduct.capacityDefault,
          maximumAdult: roomProduct.maximumAdult,
          maximumChild: roomProduct.maximumKid,
          requestedAdult: adults || 1,
          requestedChild: childrenAges?.length || 0,
          requestedPet: pets || 0
        });

      const surchargeAmenities = this.hotelAmenityService.getAllowSurchargeAmenities(
        allHotelAmenityList,
        calculateAllocateCapacityResults
      );

      const hotelAmenityList = [
        ...allHotelAmenityList.filter(
          (amenity) =>
            roomProductExtraIds.includes(amenity.id) ||
            ratePlanExtraIds.includes(amenity.id) ||
            dailyRatePlanExtraCodes.includes(amenity.code)
        ),
        ...surchargeAmenities
      ];

      const hotelAmenityListMap = new Map<string, HotelAmenity>();
      for (const amenity of hotelAmenityList) {
        hotelAmenityListMap.set(amenity.code, amenity);
      }

      const typeMapping = new Map<string, string>();

      for (const roomProductExtra of roomProductExtraList) {
        typeMapping.set(roomProductExtra.extrasId, roomProductExtra.type);
      }

      for (const ratePlanExtraService of ratePlanExtraServices) {
        typeMapping.set(ratePlanExtraService.extrasId, ratePlanExtraService.type);
      }

      for (const ratePlanExtraCode of dailyRatePlanExtraCodes) {
        const amenity = hotelAmenityListMap.get(ratePlanExtraCode);
        if (amenity) {
          typeMapping.set(amenity.id, RoomProductExtraType.EXTRA);
        }
      }

      const amenityCodes = hotelAmenityList.map((amenity) => amenity.code).filter(Boolean);

      const taxStartTime = Date.now();

      // Apply translations
      if (translateTo && translateTo !== 'null' && translateTo !== 'undefined') {
        for (const amenity of hotelAmenityList) {
          const translation = amenity.translations?.find(
            (translation) => translation.languageCode === translateTo
          );
          if (translation) {
            amenity.name = translation.name || '';
            amenity.description = translation.description || '';
          }
        }
      }

      const { extrasTaxes } = await this.getHotelTaxSettings(
        hotel.id,
        amenityCodes,
        fromDate,
        toDate
      );

      // Create tax settings map for easy lookup - more efficient than the previous approach
      const taxSettingsMap = new Map<string, any[]>();
      for (const taxSetting of extrasTaxes) {
        if (!taxSettingsMap.has(taxSetting.serviceCode)) {
          taxSettingsMap.set(taxSetting.serviceCode, []);
        }
        taxSettingsMap.get(taxSetting.serviceCode)!.push(taxSetting);
      }

      // Attach tax settings to each amenity and calculate pricing
      const processedAmenityList: HotelAmenityResponse[] = [];

      for (const amenity of hotelAmenityList) {
        const taxSettingList = taxSettingsMap.get(amenity.code) || [];

        // Get the price from hotelAmenityPrices (this is the selling rate)
        const hotelAmenityPrice = amenity.hotelAmenityPrices?.[0];
        const sellingRate = hotelAmenityPrice?.price
          ? parseFloat(hotelAmenityPrice.price.toString())
          : 0;

        let totalBaseAmount = sellingRate; // Default to selling rate
        let totalGrossAmount = sellingRate; // Default to selling rate
        let taxAmount = 0;
        let serviceChargeAmount = 0;

        if (sellingRate > 0) {
          try {
            // Calculate tax and service charges using the proper service
            const totalSellingRateDecimal = new Decimal(sellingRate);
            const serviceChargeRate = 0; // Typically 0 based on codebase
            const serviceChargeTaxRate = 0; // Typically 0 based on codebase
            const taxDetailsMap: Record<string, Decimal> = {};

            const taxResult = this.calculateAmenityPricingService.calculateTaxAndServiceCharges(
              amenity,
              totalSellingRateDecimal,
              totalSellingRateDecimal, // beforeAdjustment same as current for now
              serviceChargeRate,
              serviceChargeTaxRate,
              taxSettingList,
              fromDate,
              toDate,
              hotel.taxSetting as TaxSettingEnum,
              2, // TODO: Get from hotel configuration PRICING_DECIMAL_ROUNDING_RULE
              this.mapRoundingMode('HALF_UP'), // TODO: Get from hotel configuration PRICING_DECIMAL_ROUNDING_RULE
              taxDetailsMap
            );

            totalBaseAmount = taxResult.totalBaseAmount.toNumber();
            totalGrossAmount = taxResult.totalGrossAmount.toNumber();
            taxAmount = taxResult.taxAmount.toNumber();
            serviceChargeAmount = taxResult.serviceChargeAmount.toNumber();
          } catch (error) {
            this.logger.warn(`Error calculating tax for amenity ${amenity.code}:`, error);
            // Keep default values on error
            totalBaseAmount = sellingRate;
            totalGrossAmount = sellingRate;
            taxAmount = 0;
            serviceChargeAmount = 0;
          }
        }

        // Format the amenity response
        const processedAmenity = {
          id: amenity.id,
          name: amenity.name,
          code: amenity.code,
          description: amenity.description,
          amenityType: amenity.amenityType,
          pricingUnit: amenity.pricingUnit,
          iconImageUrl: amenity.iconImageUrl,
          totalBaseAmount: parseFloat(totalBaseAmount.toFixed(4)),
          totalGrossAmount: parseFloat(totalGrossAmount.toFixed(4)),
          taxAmount: parseFloat(taxAmount.toFixed(4)),
          serviceChargeAmount: parseFloat(serviceChargeAmount.toFixed(4)),
          baseRate: amenity.baseRate,
          hotelAmenityPriceList:
            amenity.hotelAmenityPrices?.map((price) => ({
              hotelAgeCategory: {
                code: price.hotelAgeCategory?.code,
                name: price.hotelAgeCategory?.name,
                fromAge: price.hotelAgeCategory?.fromAge,
                toAge: price.hotelAgeCategory?.toAge
              },
              price: price.price
            })) || []
        };

        processedAmenityList.push(processedAmenity as any);
      }

      // Generate S3 pre-signed URLs concurrently for better performance
      const s3UrlPromises = processedAmenityList.map(async (amenity) => {
        if (amenity.iconImageUrl) {
          try {
            amenity.iconImageUrl = await this.s3Service.getPreSignedUrl(amenity.iconImageUrl);
          } catch (error) {}
        }
        return amenity;
      });

      // Wait for all S3 URL generation to complete
      await Promise.all(s3UrlPromises);

      // Mapping type for hotel amenity
      processedAmenityList.forEach((amenity) => {
        amenity.type = typeMapping.get(amenity.id) || typeMapping.get(amenity.code);
      });

      return processedAmenityList;
    } catch (error) {
      this.logger.error('Error getting room product hotel extra list', JSON.stringify(error));

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error getting room product hotel extra list');
    }
  }

  async getRatePlanAvailableAmenity(query: {
    hotelId: string;
    ratePlanId: string;
    fromDate: string;
    toDate: string;
  }) {
    const { hotelId, ratePlanId, fromDate, toDate } = query;

    const dateRange = Helper.generateDateRange(fromDate, toDate);

    let followRatePlanId = ratePlanId;
    let ratePlanIds = [ratePlanId];
    const ratePlanDerivedSettings = await this.ratePlanDerivedSettingRepository.findOne({
      where: {
        hotelId,
        ratePlanId,
        followDailyIncludedAmenity: true
      }
    });

    if (ratePlanDerivedSettings) {
      followRatePlanId = ratePlanDerivedSettings.derivedRatePlanId;
      ratePlanIds.push(ratePlanDerivedSettings.derivedRatePlanId);
    }

    const [ratePlanExtraServices, ratePlanDailyExtraServices] = await Promise.all([
      this.ratePlanExtraServiceRepository.find({
        where: {
          ratePlanId: In(ratePlanIds)
        }
      }),

      this.ratePlanDailyExtraServiceRepository.find({
        where: {
          ratePlanId: In(ratePlanIds),
          date: In(dateRange)
        }
      })
    ]);

    const resultIds = new Set<string>();
    const resultCodes = new Set<string>();
    const resultRatePlanExtraServices: RatePlanExtraService[] = [];

    for (const date of dateRange) {
      const includeRatePlanExtraServices = ratePlanExtraServices.filter(
        (item) =>
          item.ratePlanId === followRatePlanId && item.type === RatePlanExtraServiceType.INCLUDED
      );

      const mandatoryRatePlanExtraServices = ratePlanExtraServices.filter(
        (item) =>
          item.ratePlanId === followRatePlanId && item.type === RatePlanExtraServiceType.MANDATORY
      );

      const extraRatePlanExtraServices = ratePlanExtraServices.filter(
        (item) => item.ratePlanId === ratePlanId && item.type === RatePlanExtraServiceType.EXTRA
      );

      resultRatePlanExtraServices.push(...includeRatePlanExtraServices);
      resultRatePlanExtraServices.push(...mandatoryRatePlanExtraServices);
      resultRatePlanExtraServices.push(...extraRatePlanExtraServices);

      const defaultHotelAmenityIds = [
        ...includeRatePlanExtraServices.map((item) => item.extrasId),
        ...mandatoryRatePlanExtraServices.map((item) => item.extrasId),
        ...extraRatePlanExtraServices.map((item) => item.extrasId)
      ];
      const ratePlanDailyExtraServicesInDate = ratePlanDailyExtraServices.find(
        (service) => service.date === date
      );

      const dailyHotelAmenityCodes = ratePlanDailyExtraServicesInDate?.extraServiceCodeList || [];

      if (dailyHotelAmenityCodes.length > 0) {
        for (const code of dailyHotelAmenityCodes) {
          resultCodes.add(code);
        }
      } else {
        for (const id of defaultHotelAmenityIds) {
          resultIds.add(id);
        }
      }
    }

    return {
      ratePlanExtraIds: Array.from(resultIds),
      dailyRatePlanExtraCodes: Array.from(resultCodes),
      ratePlanExtraServices
    };
  }

  /**
   * Map string rounding mode to Decimal.Rounding enum
   */
  private mapRoundingMode(mode: string): Decimal.Rounding {
    switch (mode?.toUpperCase()) {
      case 'UP':
        return Decimal.ROUND_UP;
      case 'DOWN':
        return Decimal.ROUND_DOWN;
      case 'HALF_UP':
      case 'HALF_ROUND_UP':
        return Decimal.ROUND_HALF_UP;
      case 'HALF_DOWN':
        return Decimal.ROUND_HALF_DOWN;
      case 'HALF_EVEN':
        return Decimal.ROUND_HALF_EVEN;
      default:
        return Decimal.ROUND_HALF_UP;
    }
  }

  /**
   * Get hotel tax settings for both accommodation (rate plan) and extras
   * @param hotelId - Hotel ID
   * @param ratePlanCode - Rate plan code for accommodation taxes
   * @param extraServiceCodes - Array of extra service codes for extras taxes
   * @param fromDate - Start date for tax validity (optional)
   * @param toDate - End date for tax validity (optional)
   * @returns Combined tax settings grouped by service type
   */
  async getHotelTaxSettings(
    hotelId: string,
    codeList: string[] | null = null,
    fromDate?: string,
    toDate?: string
  ): Promise<{
    accommodationTaxes: HotelTaxSetting[];
    extrasTaxes: HotelTaxSetting[];
  }> {
    // Early return for empty inputs
    if (!hotelId || !codeList || codeList.length === 0) {
      return {
        accommodationTaxes: [],
        extrasTaxes: []
      };
    }
    try {
      const where: any = {
        hotelId,
        hotelTax: {}
      };

      // Handle date filters if provided
      if (fromDate && toDate) {
        where.hotelTax.validFrom = Raw((alias) => `${alias} IS NULL OR ${alias} <= :toDate`, {
          toDate
        });
        where.hotelTax.validTo = Raw((alias) => `${alias} IS NULL OR ${alias} >= :fromDate`, {
          fromDate
        });
      }

      // Service code conditions
      let serviceCodes: string[] = [];

      if (codeList?.length) {
        serviceCodes.push(...codeList);
      }

      if (serviceCodes.length > 0) {
        where.serviceCode = In(serviceCodes);
      }

      // Find with relations - include all necessary fields for tax calculation
      const hotelTaxSettings = await this.hotelTaxSettingRepository.find({
        where,
        relations: ['hotelTax'],
        select: {
          id: true,
          hotelId: true,
          serviceCode: true,
          serviceType: true,
          taxCode: true,
          description: true,
          hotelTax: {
            id: true,
            rate: true,
            name: true,
            code: true,
            validFrom: true,
            validTo: true,
            description: true
          }
        }
      });

      // Separate by service type
      const accommodationTaxes = hotelTaxSettings.filter(
        (tax) => tax.serviceType === ServiceTypeEnum.ACCOMMODATION
      );

      const extrasTaxes = hotelTaxSettings.filter(
        (tax) => tax.serviceType === ServiceTypeEnum.EXTRAS
      );

      return {
        accommodationTaxes,
        extrasTaxes
      };
    } catch (error) {
      // Log error if needed
      return {
        accommodationTaxes: [],
        extrasTaxes: []
      };
    }
  }
}
