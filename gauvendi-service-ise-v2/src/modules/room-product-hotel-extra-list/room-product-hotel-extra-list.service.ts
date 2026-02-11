import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format, subDays } from 'date-fns';
import Decimal from 'decimal.js';
import { DATE_FORMAT } from 'src/core/constants/date.constant';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAgeCategoryCodeEnum } from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import {
  AmenityStatusEnum,
  HotelAmenity,
  IsePricingDisplayModeEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import {
  HotelTaxSetting,
  ServiceTypeEnum
} from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RatePlan, RoundingModeEnum } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductExtraType } from 'src/core/entities/room-product-extra.entity';
import { DistributionChannel, RoomProduct } from 'src/core/entities/room-product.entity';
import { AmenityWithType, BookingHotelAmenityService, BookingRoomProductAmenity } from 'src/core/modules/amenity-calculate/booking-hotel-amentity.service';
import { S3Service } from 'src/core/s3/s3.service';
import { CalculateAllocationService } from 'src/core/services/calculate-allocation.service';
import { CalculateAmenityPricingService } from 'src/core/services/calculate-amenity-pricing.service';
import { groupByToMap } from 'src/core/utils/group-by.util';
import { In, Raw, Repository } from 'typeorm';
import { BookingAmenityCalculateService } from '../../core/modules/amenity-calculate/amenity-calculate.service';
import { HotelAmenityRepository } from '../hotel-amenity/repositories/hotel-amenity.repository';
import { HotelAmenityService } from '../hotel-amenity/services/hotel-amenity.service';
import { AvailableAmenityDto, HotelAmenityResponse } from './room-product-hotel-extra-list.dto';

@Injectable()
export class RoomProductHotelExtraListService {
  private readonly logger = new Logger(RoomProductHotelExtraListService.name);

  constructor(
    @InjectRepository(HotelAmenity, DB_NAME.POSTGRES)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>,

    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(HotelTaxSetting, DB_NAME.POSTGRES)
    private readonly hotelTaxSettingRepository: Repository<HotelTaxSetting>,

    private readonly calculateAmenityPricingService: CalculateAmenityPricingService,

    private readonly s3Service: S3Service,
    private readonly bookingAmenityCalculateService: BookingAmenityCalculateService,
    private readonly hotelAmenityService: HotelAmenityService,
    private readonly calculateAllocationService: CalculateAllocationService,
    private readonly bookingHotelAmenityService: BookingHotelAmenityService,
    private readonly hotelAmenityCustomRepository: HotelAmenityRepository
  ) {}

  async getAvailableAmenityV2(query: AvailableAmenityDto): Promise<HotelAmenityResponse[]> {
    const {
      hotelCode,
      fromTime,
      toTime,
      roomProductCode,
      salesPlanCode,
      translateTo,
      distributionChannelList,
      childrenAges,
      adults,
      pets
    } = query;

    if (isNaN(+fromTime) || isNaN(+toTime)) {
      throw new BadRequestException('Invalid date fromTime or toTime');
    }

    const fromDate = format(new Date(Number(fromTime)), DATE_FORMAT);
    const toDate = format(subDays(new Date(Number(toTime)), 1), DATE_FORMAT);

    const hotel = await this.hotelRepository.findOne({
      where: {
        code: hotelCode
      }
    });

    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }

    const [ratePlan, roomProduct] = await Promise.all([
      this.ratePlanRepository.findOne({
        where: {
          code: salesPlanCode,
          hotelId: hotel.id
        },
        select: {
          id: true
        }
      }),
      this.roomProductRepository.findOne({
        where: {
          code: roomProductCode,
          hotelId: hotel.id
        },
        select: {
          id: true,
          capacityDefault: true,
          maximumAdult: true,
          maximumKid: true,
          maximumPet: true,
          extraAdult: true,
          extraChildren: true,
          capacityExtra: true
        }
      })
    ]);

    if (!ratePlan) {
      throw new BadRequestException('Rate plan or room product not found');
    }

    const [bookingRatePlanAmenities, bookingRoomProductAmenities, bookingHotelAmenities] =
      await Promise.all([
        this.bookingHotelAmenityService.getBookingRatePlanAmenities({
          reservations: [
            {
              fromDate: fromDate,
              toDate: toDate,
              ratePlanId: ratePlan.id,
              index: '1'
            }
          ],
          hotelId: hotel.id
        }),
        roomProduct
          ? this.bookingHotelAmenityService.getRoomProductAmenities({
              reservations: [
                {
                  roomProductId: roomProduct.id,
                  index: '1'
                }
              ],
              hotelId: hotel.id
            })
          : [] as BookingRoomProductAmenity[],
        this.hotelAmenityCustomRepository.findAll({
          hotelId: hotel.id,
          statusList: [AmenityStatusEnum.ACTIVE],
          distributionChannelList: distributionChannelList
            ? (distributionChannelList as DistributionChannel[])
            : undefined
        })
      ]);

    const ratePlanAmenities = bookingRatePlanAmenities.find(
      (amenity) => amenity.ratePlanId === ratePlan.id
    )?.amenities;
    const roomProductAmenities = roomProduct
      ? bookingRoomProductAmenities.find((amenity) => amenity.roomProductId === roomProduct.id)
          ?.amenities
      : [] as AmenityWithType[];

    const { included, extra, mandatory } = this.bookingHotelAmenityService.combineBookingAmenities({
      ratePlanAmenities: ratePlanAmenities || [],
      roomProductAmenities: roomProductAmenities || [],
      hotelAmenities: bookingHotelAmenities
    });
    const includedIds = included.map((amenity) => amenity.id);
    const extraIds = extra.map((amenity) => amenity.id);
    const mandatoryIds = mandatory.map((amenity) => amenity.id);

    const hotelAmenityIds = bookingHotelAmenities.map((amenity) => amenity.id);
    const hotelAmenityCodes = bookingHotelAmenities.map((amenity) => amenity.code);

    const [hotelAmenityPrices, { extrasTaxes }] = await Promise.all([
      this.hotelAmenityCustomRepository.findPricesByAmenityIds(hotelAmenityIds),
      this.getHotelTaxSettings(hotel.id, hotelAmenityCodes, fromDate, toDate)
    ]);

    const hotelAmenityPricesMap = groupByToMap(hotelAmenityPrices, (price) => price.hotelAmenityId);
    for (const amenity of bookingHotelAmenities) {
      const prices = hotelAmenityPricesMap.get(amenity.id);
      if (prices) {
        amenity.hotelAmenityPrices = prices;
      }
    }

    const uniqueIds = new Set([...includedIds, ...extraIds, ...mandatoryIds]);
    const amenityPricingList =
      await this.bookingAmenityCalculateService.calculateExtraAmenityPrices({
        hotel: hotel,
        hotelAmenityPrices: hotelAmenityPrices,
        taxSettings: extrasTaxes,
        fromDate: fromDate,
        toDate: toDate,
        serviceChargeRate: 0,
        serviceChargeTaxRate: 0,
        adult: adults || 1,
        childrenAges: childrenAges || [],
        pets: pets || 0,
        extraServices: bookingHotelAmenities.filter((amenity) => uniqueIds.has(amenity.id)),
        pricingDecimalRoundingRule: {
          roundingMode: RoundingModeEnum.HALF_ROUND_UP,
          decimalUnits: 2
        },
        counts: []
      });

    if (translateTo && translateTo !== 'null' && translateTo !== 'undefined') {
      for (const amenity of bookingHotelAmenities) {
        const translation = amenity.translations?.find(
          (translation) => translation.languageCode === translateTo
        );
        if (translation) {
          amenity.name = translation.name;
          amenity.description = translation.description;
        }
      }
    }

    const processedAmenityList: HotelAmenityResponse[] = [];
    for (const amenity of bookingHotelAmenities) {
      const amenityPricing = amenityPricingList.find((p) => p.hotelAmenity.id === amenity.id);


      let type: RoomProductExtraType | null = null;
      if (includedIds.includes(amenity.id)) {
        type = RoomProductExtraType.INCLUDED;
      } else if (extraIds.includes(amenity.id)) {
        type = RoomProductExtraType.EXTRA;
      } else if (mandatoryIds.includes(amenity.id)) {
        type = RoomProductExtraType.MANDATORY;
      }

      if (type) {

        
        const totalBaseAmount = amenityPricing
          ? parseFloat(amenityPricing.totalBaseAmount.toFixed(4)) / amenityPricing.count
          : 0;
        const totalGrossAmount = amenityPricing
          ? parseFloat(amenityPricing.totalGrossAmount.toFixed(4)) / amenityPricing.count
          : 0;
        const taxAmount = amenityPricing ? parseFloat(amenityPricing.taxAmount.toFixed(4)) / amenityPricing.count : 0;
        const serviceChargeAmount = amenityPricing
          ? parseFloat(amenityPricing.serviceChargeAmount.toFixed(4)) / amenityPricing.count : 0;



        // Format the amenity response
        const processedAmenity: HotelAmenityResponse = {
          id: amenity.id,
          name: amenity.name,
          code: amenity.code,
          description: amenity.description,
          amenityType: amenity.amenityType,
          pricingUnit: amenity.pricingUnit,
          iconImageUrl: amenity.iconImageUrl,
          totalBaseAmount: totalBaseAmount,
          totalGrossAmount: totalGrossAmount,
          taxAmount: taxAmount,
          serviceChargeAmount: serviceChargeAmount,
          baseRate: amenity.baseRate?.toString() || undefined,
          hotelAmenityPriceList:
            amenity.hotelAmenityPrices?.map((price) => ({
              hotelAgeCategory: {
                code: price.hotelAgeCategory?.code,
                name: price.hotelAgeCategory?.name,
                fromAge: price.hotelAgeCategory?.fromAge,
                toAge: price.hotelAgeCategory?.toAge
              },
              price: parseFloat(price.price)
            })) || [],
          type: type
        };

        processedAmenityList.push(processedAmenity);
      }


    }

    if (roomProduct) {
      const calculateAllocateCapacityResult =
        this.calculateAllocationService.calculateAllocateCapacity({
          capacityDefault: roomProduct.capacityDefault,
          maximumAdult: roomProduct.maximumAdult,
          maximumChild: roomProduct.maximumKid,
          requestedAdult: adults || 1,
          requestedChild: childrenAges?.length || 0,
          requestedPet: pets || 0
        });

      const surchargeAmenities = this.hotelAmenityService.getAllowSurchargeAmenities(
        bookingHotelAmenities,
        calculateAllocateCapacityResult
      );

      const surchargeAmenityPricingList =
        await this.bookingAmenityCalculateService.calculateSurchargeAmenityPrices({
          hotel,
          hotelAmenityPrices: surchargeAmenities.flatMap((s) => s.hotelAmenityPrices),
          childrenAgeList: childrenAges || [],
          extraServices: surchargeAmenities,
          fromDate: fromDate,
          toDate: toDate,
          taxSettings: extrasTaxes,
          serviceChargeRate: 0,
          serviceChargeTaxRate: 0,
          pricingDecimalRoundingRule: {
            roundingMode: RoundingModeEnum.HALF_ROUND_UP,
            decimalUnits: 2
          },
          calculateAllocateCapacityResult: {
            allocatedAdultCount: calculateAllocateCapacityResult.allocatedAdultCount ?? 0,
            allocatedChildCount: calculateAllocateCapacityResult.allocatedChildCount ?? 0,
            allocatedExtraBedAdultCount:
              calculateAllocateCapacityResult.allocatedExtraBedAdultCount ?? 0,
            allocatedExtraBedChildCount:
              calculateAllocateCapacityResult.allocatedExtraBedChildCount ?? 0,
            allocatedPetCount: calculateAllocateCapacityResult.allocatedPetCount ?? 0
          }
        });

      for (const surchargeAmenityPricing of surchargeAmenityPricingList) {
        const amenity = surchargeAmenities.find(
          (s) => s.id === surchargeAmenityPricing.hotelAmenity.id
        );

        if (amenity) {
          const totalBaseAmount =
            surchargeAmenityPricing.totalBaseAmount / surchargeAmenityPricing.count;
          const totalGrossAmount =
            surchargeAmenityPricing.totalGrossAmount / surchargeAmenityPricing.count;
          const taxAmount = surchargeAmenityPricing.taxAmount / surchargeAmenityPricing.count;
          const serviceChargeAmount =
            surchargeAmenityPricing.serviceChargeAmount / surchargeAmenityPricing.count;

          const processedAmenity = {
            id: amenity.id,
            name: amenity.name,
            code: amenity.code,
            description: amenity.description,
            amenityType: amenity.amenityType,
            pricingUnit: amenity.pricingUnit,
            iconImageUrl: amenity.iconImageUrl,
            totalBaseAmount: totalBaseAmount,
            totalGrossAmount: totalGrossAmount,
            taxAmount: taxAmount,
            serviceChargeAmount: serviceChargeAmount,
            baseRate: amenity.baseRate?.toString() || undefined,
            hotelAmenityPriceList:
              amenity.hotelAmenityPrices?.map((price) => ({
                hotelAgeCategory: {
                  code: price.hotelAgeCategory?.code,
                  name: price.hotelAgeCategory?.name,
                  fromAge: price.hotelAgeCategory?.fromAge,
                  toAge: price.hotelAgeCategory?.toAge
                },
                price: parseFloat(price.price)
              })) || []
          };

          processedAmenityList.push({
            ...processedAmenity,
            type:
              amenity.isePricingDisplayMode === IsePricingDisplayModeEnum.INCLUSIVE
                ? RoomProductExtraType.INCLUDED
                : RoomProductExtraType.MANDATORY
          });
        }
      }
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

    return processedAmenityList;
  }

  async getAvailableAmenity(query: AvailableAmenityDto): Promise<HotelAmenityResponse[]> {
    try {
      const {
        hotelCode,
        fromTime,
        toTime,
        roomProductCode,
        salesPlanCode,
        translateTo,
        distributionChannelList,
        childrenAges,
        adults,
        pets
      } = query;

      if (isNaN(+fromTime) || isNaN(+toTime)) {
        throw new BadRequestException('Invalid date fromTime or toTime');
      }

      const fromDate = format(new Date(Number(fromTime)), DATE_FORMAT);
      const toDate = format(subDays(new Date(Number(toTime)), 1), DATE_FORMAT);

      const hotel = await this.hotelRepository.findOne({
        where: {
          code: hotelCode
        }
      });

      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }

      let qbRoomProduct = this.roomProductRepository
        .createQueryBuilder('roomProduct')
        .leftJoinAndSelect('roomProduct.roomProductExtras', 'roomProductExtra')
        .where('roomProduct.hotelId = :hotelId', { hotelId: hotel.id });

      if (roomProductCode) {
        qbRoomProduct = qbRoomProduct.andWhere('roomProduct.code = :roomProductCode', {
          roomProductCode
        });
      }

      let qbRatePlan = this.ratePlanRepository
        .createQueryBuilder('ratePlan')
        .leftJoinAndSelect('ratePlan.ratePlanExtraServices', 'ratePlanExtraService')
        .leftJoinAndSelect(
          'ratePlan.ratePlanDailyExtraServices',
          'ratePlanDailyExtraService',
          'ratePlanDailyExtraService.date >= :fromDate AND ratePlanDailyExtraService.date <= :toDate'
        )
        .where('ratePlan.hotelId = :hotelId', { hotelId: hotel.id })
        .setParameters({ fromDate, toDate });

      if (salesPlanCode) {
        qbRatePlan = qbRatePlan.andWhere('ratePlan.code = :salesPlanCode', { salesPlanCode });
      }

      // Run queries concurrently for better performance
      const [roomProductExtraList, ratePlanData] = await Promise.all([
        // Find room product extra list based on room product code:
        qbRoomProduct.getMany(),
        qbRatePlan.getMany()
        // Find rate plan with both extra services and daily extra services in one query:
      ]);

      // Mapping type for hotel amenity
      // key: extraId or code,
      // value: type: 'INCLUDED', 'EXTRA', 'MANDATORY'
      const typeMapping = new Map<string, string>();

      // Extract extrasId & extraServiceCodeList
      const extraIdListFromRoomProduct = new Set(
        roomProductExtraList.flatMap((e) =>
          e?.roomProductExtras?.map((extra) => {
            typeMapping.set(extra.extrasId, extra.type);

            return extra.extrasId;
          })
        )
      );
      const extraIdListFromRatePlan = new Set(
        ratePlanData.flatMap((ratePlan) =>
          ratePlan.ratePlanExtraServices.map((extra) => {
            typeMapping.set(extra.extrasId, extra.type);

            return extra.extrasId;
          })
        )
      );
      const extraIdList = new Set([...extraIdListFromRoomProduct, ...extraIdListFromRatePlan]);

      if (extraIdList.size === 0) {
        return [];
      }

      const extraServiceCodeList = new Set(
        ratePlanData.flatMap((ratePlan) =>
          ratePlan.ratePlanDailyExtraServices.map((extra) => extra.extraServiceCodeList)
        )
      );

      // Find HotelAmenity based on roomProductExtraList, ratePlanExtraServiceList/ratePlanDailyExtraServiceList
      const queryBuilder = this.hotelAmenityRepository
        .createQueryBuilder('hotelAmenity')
        .leftJoinAndSelect('hotelAmenity.hotelAmenityPrices', 'hotelAmenityPrices')
        .leftJoinAndSelect(
          'hotelAmenityPrices.hotelAgeCategory',
          'hotelAgeCategory',
          'hotelAgeCategory.code = :defaultAgeCategory'
        )
        .setParameter('defaultAgeCategory', HotelAgeCategoryCodeEnum.DEFAULT);

      // Only add WHERE conditions if we have data to filter by
      let hasConditions = false;

      if (extraIdList.size > 0) {
        queryBuilder.where('hotelAmenity.id IN (:...extraIdList)', {
          extraIdList: Array.from(extraIdList)
        });
        hasConditions = true;
      }

      if (extraServiceCodeList.size > 0) {
        if (hasConditions) {
          queryBuilder.orWhere('hotelAmenity.code IN (:...extraServiceCodeList)', {
            extraServiceCodeList: Array.from(extraServiceCodeList)
          });
        } else {
          queryBuilder.where('hotelAmenity.code IN (:...extraServiceCodeList)', {
            extraServiceCodeList: Array.from(extraServiceCodeList)
          });
        }
      }

      if (distributionChannelList && distributionChannelList.length > 0) {
        queryBuilder.andWhere('hotelAmenity.distributionChannel && :distributionChannelList', {
          distributionChannelList: distributionChannelList
        });
      }

      const hotelAmenityList = await queryBuilder.getMany();

      // Get hotel tax settings for all amenities in one optimized query
      const amenityCodes = hotelAmenityList.map((amenity) => amenity.code).filter(Boolean);

      this.logger.debug(
        `Fetching tax settings for ${amenityCodes.length} amenities in single query`
      );
      const taxStartTime = Date.now();

      // Apply translations
      if (translateTo && translateTo !== 'null' && translateTo !== 'undefined') {
        for (const amenity of hotelAmenityList) {
          const translation = amenity.translations?.find(
            (translation) => translation.languageCode === translateTo
          );
          if (translation) {
            amenity.name = translation.name;
            amenity.description = translation.description;
          }
        }
      }

      const { extrasTaxes } = await this.getHotelTaxSettings(
        hotel.id,
        amenityCodes,
        fromDate,
        toDate
      );

      this.logger.debug(
        `Tax settings fetched in ${Date.now() - taxStartTime}ms, found ${extrasTaxes.length} tax settings`
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
        const hotelAmenityPrice = amenity.hotelAmenityPrices.find(
          (price) => price?.hotelAgeCategory?.code === HotelAgeCategoryCodeEnum.DEFAULT
        );

        if (!hotelAmenityPrice) {
          continue;
        }

        const sellingRate = hotelAmenityPrice.price ? parseFloat(hotelAmenityPrice.price) : 0;

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
              hotel.taxSetting,
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
          baseRate: amenity.baseRate?.toString() || undefined,
          hotelAmenityPriceList:
            amenity.hotelAmenityPrices?.map((price) => ({
              hotelAgeCategory: {
                code: price.hotelAgeCategory?.code,
                name: price.hotelAgeCategory?.name,
                fromAge: price.hotelAgeCategory?.fromAge,
                toAge: price.hotelAgeCategory?.toAge
              },
              price: parseFloat(price.price)
            })) || []
        };

        processedAmenityList.push(processedAmenity);
      }

      if (roomProductExtraList && roomProductExtraList.length > 0) {
        const roomProduct = roomProductExtraList[0];

        const result = this.calculateAllocationService.calculateAllocateCapacity({
          capacityDefault: roomProduct.capacityDefault,
          maximumAdult: roomProduct.maximumAdult,
          maximumChild: roomProduct.maximumKid,
          requestedAdult: adults || 1,
          requestedChild: childrenAges?.length || 0,
          requestedPet: pets || 0
        });

        const surchargeAmenities = this.hotelAmenityService.getAllowSurchargeAmenities(
          await this.hotelAmenityRepository.find({
            where: {
              hotelId: hotel.id
            },
            relations: ['hotelAmenityPrices', 'hotelAmenityPrices.hotelAgeCategory']
          }),
          result
        );

        const surchargeAmenityPricingList =
          await this.bookingAmenityCalculateService.calculateSurchargeAmenityPrices({
            hotel,
            hotelAmenityPrices: surchargeAmenities.flatMap((s) => s.hotelAmenityPrices),
            childrenAgeList: childrenAges || [],
            extraServices: surchargeAmenities,
            fromDate: fromDate,
            toDate: toDate,
            taxSettings: extrasTaxes,
            serviceChargeRate: 0,
            serviceChargeTaxRate: 0,
            pricingDecimalRoundingRule: {
              roundingMode: RoundingModeEnum.HALF_ROUND_UP,
              decimalUnits: 2
            },
            calculateAllocateCapacityResult: {
              allocatedAdultCount: result.allocatedAdultCount ?? 0,
              allocatedChildCount: result.allocatedChildCount ?? 0,
              allocatedExtraBedAdultCount: result.allocatedExtraBedAdultCount ?? 0,
              allocatedExtraBedChildCount: result.allocatedExtraBedChildCount ?? 0,
              allocatedPetCount: result.allocatedPetCount ?? 0
            }
          });

        for (const surchargeAmenityPricing of surchargeAmenityPricingList) {
          const amenity = surchargeAmenities.find(
            (s) => s.id === surchargeAmenityPricing.hotelAmenity.id
          );

          if (amenity) {
            const totalBaseAmount =
              surchargeAmenityPricing.totalBaseAmount / surchargeAmenityPricing.count;
            const totalGrossAmount =
              surchargeAmenityPricing.totalGrossAmount / surchargeAmenityPricing.count;
            const taxAmount = surchargeAmenityPricing.taxAmount / surchargeAmenityPricing.count;
            const serviceChargeAmount =
              surchargeAmenityPricing.serviceChargeAmount / surchargeAmenityPricing.count;

            const processedAmenity = {
              id: amenity.id,
              name: amenity.name,
              code: amenity.code,
              description: amenity.description,
              amenityType: amenity.amenityType,
              pricingUnit: amenity.pricingUnit,
              iconImageUrl: amenity.iconImageUrl,
              totalBaseAmount: totalBaseAmount,
              totalGrossAmount: totalGrossAmount,
              taxAmount: taxAmount,
              serviceChargeAmount: serviceChargeAmount,
              baseRate: amenity.baseRate?.toString() || undefined,
              hotelAmenityPriceList:
                amenity.hotelAmenityPrices?.map((price) => ({
                  hotelAgeCategory: {
                    code: price.hotelAgeCategory?.code,
                    name: price.hotelAgeCategory?.name,
                    fromAge: price.hotelAgeCategory?.fromAge,
                    toAge: price.hotelAgeCategory?.toAge
                  },
                  price: parseFloat(price.price)
                })) || []
            };

            typeMapping.set(
              amenity.id,
              amenity.isePricingDisplayMode === IsePricingDisplayModeEnum.INCLUSIVE
                ? RoomProductExtraType.INCLUDED
                : RoomProductExtraType.MANDATORY
            );

            processedAmenityList.push(processedAmenity);
          }
        }
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
