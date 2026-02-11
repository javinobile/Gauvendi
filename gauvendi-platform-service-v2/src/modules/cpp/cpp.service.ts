import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { DB_NAME } from '@src/core/constants/db.const';
import { ResponseData } from '@src/core/dtos/common.dto';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { Restriction } from '@src/core/entities/restriction.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import {
  DistributionChannel,
  RatePlanStatusEnum,
  RatePlanTypeEnum,
  RestrictionConditionType,
  RoomProductStatus,
  RoomUnitAvailabilityStatus,
  RoundingModeEnum
} from '@src/core/enums/common';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException
} from '@src/core/exceptions';
import { DecimalRoundingHelper } from '@src/core/helper/decimal-rounding.helper';
import { Helper } from '@src/core/helper/utils';
import {
  PricingCalculateResult,
  PricingCalculateService
} from '@src/core/modules/pricing-calculate/pricing-calculate.service';
import { S3Service } from '@src/core/s3/s3.service';
import { CppRestrictionUtil } from '@src/core/utils/cpp-restriction.util';
import { groupByToMap, groupByToMapSingle, mapToRecord } from '@src/core/utils/group-by.util';
import { format, subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Brackets, In, IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { BookingCalculateService } from '../booking/services/booking-calculate.service';
import { CountryRepository } from '../country/country.repository';
import { GuestRepository } from '../guest/repositories/guest.repository';
import { HotelTaxRepository } from '../hotel-tax/repositories/hotel-tax.repository';
import { HotelRepository } from '../hotel/repositories/hotel.repository';
import { StayOptionService } from '../ise-recommendation/stay-option.service';
import { RoomRequestUtils } from '../ise-recommendation/stay-option.util';
import { RatePlanSellabilityService } from '../rate-plan-sellability/services/rate-plan-sellability.service';
import { RatePlanSettingsService } from '../rate-plan-settings/services/rate-plan-settings.service';
import { RestrictionService } from '../restriction/restriction.service';
import { RoomProductRatePlanRepository } from '../room-product-rate-plan/room-product-rate-plan.repository';
import { RoomProductRepository } from '../room-product/room-product.repository';
import { RoomUnitRepository } from '../room-unit/room-unit.repository';
import {
  CppAssignRoomToProductAssignedStatus,
  CppAssignRoomToProductDto,
  CppAssignRoomToProductInputDto,
  CppAssignRoomToProductResponseDto,
  CppAssignRoomToProductRoomDto
} from './dtos/cpp-assign-room-to-product.dto';
import {
  CppCalculateRoomProductPriceFilterDto,
  CppCalculateRoomProductPriceV2ResponseDto,
  CppRestrictionDto,
  CppSellableOptionDto,
  CppSmartFindingPromoCodeDto,
  CppSmartFindingPromoCodeFilterDto
} from './dtos/cpp-calculate-room-product-price.dto';
import {
  CalendarRoomProductRatePlanDto,
  CppCalendarRoomProductFilterDto,
  CppCalendarRoomProductResultDto,
  CppDailySellingRateDto,
  RoomProductAvailabilityResultItemDto,
  RoomProductResultItemDto
} from './dtos/cpp-calendar-room-product.dto';
import {
  CppGuestDto as CppGuestDetailDto,
  CppGuestDetailFilterDto
} from './dtos/cpp-guest-detail.dto';
import { CppRatePlanFilterDto, CppRatePlanResultDto } from './dtos/cpp-rate-plan.dto';
import { CppSearchGuestDto, CppSearchGuestFilterDto } from './dtos/cpp-search-guest.dto';
import { IseRecommendedOffersDto } from './dtos/ise-recommended-offers.dto';
import { DailyRatePlanSellabilityDto } from '../rate-plan-sellability/dtos/daily-rate-plan-sellability.dto';

@Injectable()
export class CppService {
  constructor(
    private readonly ratePlanSellabilityService: RatePlanSellabilityService,
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,
    private readonly roomProductRepository: RoomProductRepository,
    private readonly hotelRepository: HotelRepository,
    private readonly roomUnitRepository: RoomUnitRepository,
    private readonly hotelTaxRepository: HotelTaxRepository,
    private readonly guestRepository: GuestRepository,
    private readonly countryRepository: CountryRepository,

    @InjectRepository(RoomProductDailyAvailability, DB_NAME.POSTGRES)
    private readonly roomProductDailyAvailabilityRepository: Repository<RoomProductDailyAvailability>,

    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private readonly roomProductEntityRepository: Repository<RoomProduct>,

    @InjectRepository(Restriction, DB_NAME.POSTGRES)
    private readonly restrictionRepository: Repository<Restriction>,

    @InjectRepository(RoomProductStandardFeature, DB_NAME.POSTGRES)
    private readonly roomProductStandardFeatureRepository: Repository<RoomProductStandardFeature>,

    private readonly pricingCalculateService: PricingCalculateService,
    private readonly ratePlanSettingService: RatePlanSettingsService,
    private readonly s3Service: S3Service,
    private readonly restrictionService: RestrictionService,
    private readonly stayOptionService: StayOptionService,
    private readonly bookingCalculateService: BookingCalculateService
  ) {}

  async cppSmartFindingPromoCode(
    filter: CppSmartFindingPromoCodeFilterDto
  ): Promise<ResponseData<CppSmartFindingPromoCodeDto>> {
    const { propertyCode, query } = filter;

    // Get hotel by property code
    const hotel = await this.hotelRepository.getHotelByCode(propertyCode);

    if (!hotel) {
      return new ResponseData(0, 0, []);
    }

    // Search for rate plans with promo codes matching the query
    const queryBuilder = this.ratePlanRepository
      .createQueryBuilder('rp')
      .where('rp.hotelId = :hotelId', { hotelId: hotel.id })
      .andWhere('rp.type IN (:...types)', {
        types: [RatePlanTypeEnum.PROMOTION, RatePlanTypeEnum.CORPORATE, RatePlanTypeEnum.GROUP]
      })
      .andWhere('rp.status = :status', { status: RatePlanStatusEnum.ACTIVE });

    if (query) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(
            `EXISTS (
              SELECT 1
              FROM unnest(rp.promoCodes) AS code
              WHERE code ILIKE :query
            )`,
            { query: `%${query}%` }
          )
            .orWhere('rp.code ILIKE :searchQuery', { searchQuery: `%${query}%` })
            .orWhere('rp.name ILIKE :searchQuery', { searchQuery: `%${query}%` });
        })
      );
    }

    const ratePlans = await queryBuilder
      .select(['rp.id', 'rp.code', 'rp.name', 'rp.type', 'rp.promoCodes'])
      .getMany();

    const result: CppSmartFindingPromoCodeDto[] = [];

    for (const ratePlan of ratePlans) {
      if (ratePlan.promoCodes && ratePlan.promoCodes.length > 0) {
        for (const promoCode of ratePlan.promoCodes) {
          if (!query || promoCode.toLowerCase().includes(query.toLowerCase())) {
            result.push({
              code: promoCode,
              type: ratePlan.type,
              salesPlanId: ratePlan.id,
              salesPlanName: ratePlan.name,
              salesPlanCode: ratePlan.code
            });
          }
        }
      }
    }

    return new ResponseData(result.length, 1, result);
  }

  async cppSearchGuest(filter: CppSearchGuestFilterDto): Promise<ResponseData<CppSearchGuestDto>> {
    const { propertyCode, query, pageIndex = 0, pageSize = 100 } = filter;

    const hotel = await this.hotelRepository.getHotelByCode(propertyCode);

    if (!hotel) {
      return new ResponseData(0, 0, []);
    }

    const { guests, count } = await this.guestRepository.searchGuests(
      hotel.id,
      query,
      pageIndex,
      pageSize
    );

    const data: CppSearchGuestDto[] = guests?.map((guest) => ({
      id: guest.id,
      name: `${guest.firstName || ''} ${guest.lastName || ''}`.trim(),
      email: guest.emailAddress || ''
    }));

    const totalPage = Math.ceil(count / pageSize);

    return new ResponseData(count, totalPage, data);
  }

  async cppGuestDetail(filter: CppGuestDetailFilterDto): Promise<ResponseData<CppGuestDetailDto>> {
    const { propertyCode, idList } = filter;

    const hotel = await this.hotelRepository.getHotelByCode(propertyCode);

    if (!hotel) {
      return new ResponseData(0, 0, []);
    }

    if (!idList || idList.length === 0) {
      return new ResponseData(0, 0, []);
    }

    // Get all guests from the list
    const guests = await this.guestRepository.getGuestsByIds(idList);

    if (!guests || guests.length === 0) {
      return new ResponseData(0, 0, []);
    }

    // Initialize in-memory country code map
    const countryCodeMap = await this.initializeCountryCodeMap();

    // Map all guests to CppGuestDetailDto
    const cppGuests: CppGuestDetailDto[] = await Promise.all(
      guests.map(async (guestData) => {
        const countryCode = guestData.countryId
          ? countryCodeMap[guestData.countryId] || 'US'
          : 'US';

        return {
          id: guestData.id,
          email: guestData.emailAddress || undefined,
          contact: {
            personal: {
              email: guestData.emailAddress || undefined,
              phoneNumber: guestData.phoneNumber || undefined,
              countryNumber: guestData.countryNumber || undefined,
              countryCode: countryCode,
              address: guestData.address || undefined,
              city: guestData.city || undefined,
              state: guestData.state || undefined,
              postalCode: guestData.postalCode || undefined
            },
            company: {
              email: guestData.companyEmail || undefined,
              phoneNumber: undefined,
              address: guestData.companyAddress || undefined,
              city: guestData.companyCity || undefined,
              state: undefined,
              country: guestData.companyCountry || undefined,
              postalCode: guestData.companyPostalCode || undefined
            }
          },
          particular: {
            firstName: guestData.firstName || undefined,
            lastName: guestData.lastName || undefined
          },
          preferredLanguage: guestData.preferredLanguage
        };
      })
    );

    return new ResponseData(cppGuests.length, 1, cppGuests);
  }

  private async initializeCountryCodeMap(): Promise<Record<string, string>> {
    try {
      // Fetch all countries from database (matching Java logic line 644: initializeInMemoryCountryCode)
      const countries = await this.countryRepository.getAllCountries();

      // Build a map of country ID to country code
      const countryCodeMap: Record<string, string> = {};
      countries.forEach((country) => {
        if (country.id && country.code) {
          countryCodeMap[country.id] = country.code;
        }
      });

      return countryCodeMap;
    } catch (error) {
      // If there's an error, return empty map and default to 'US'
      return {};
    }
  }

  async getCPPRatePlans(filter: CppRatePlanFilterDto): Promise<CppRatePlanResultDto[]> {
    try {
      const { arrival, departure, featureCodeList, promoCodeList, hotelId, roomRequestList } =
        filter;

      const dates = Helper.generateDateRange(arrival, departure);
      // Build query with all required conditions
      const { ratePlans } = await this.getCPPAvailableRatePlan({
        hotelId,
        fromDate: arrival,
        toDate: departure,
        promoCodes: promoCodeList
      });

      const ratePlanIds = ratePlans.map((item) => item.id);
      const [roomProductRatePlans] = await Promise.all([
        this.roomProductRatePlanRepository.findAll({
          hotelId,
          ratePlanIds: ratePlanIds
        })
      ]);

      const roomProductIds = Array.from(
        new Set(roomProductRatePlans.map((item) => item.roomProductId))
      );
      const roomProductRatePlanIds = roomProductRatePlans.map((item) => item.id);
      const [
        roomProducts,
        roomProductDailyAvailabilities,
        roomProductRatePlanAvailabilityAdjustments
      ] = await Promise.all([
        this.roomProductRepository.find(
          {
            roomProductIds,
            hotelId,
            status: [RoomProductStatus.ACTIVE],
            distributionChannels: [DistributionChannel.GV_VOICE],
            featureCodes: featureCodeList
          },
          [
            'roomProduct.id',
            'roomProduct.code',
            'roomProduct.name',
            'roomProduct.maximumAdult',
            'roomProduct.extraBedAdult',
            'roomProduct.maximumKid',
            'roomProduct.extraBedKid',
            'roomProduct.capacityDefault',
            'roomProduct.capacityExtra',
            'roomProduct.isSellable'
          ]
        ),
        this.roomProductRepository.findAvailabilities({
          roomProductIds,
          dates
        }),
        this.roomProductRatePlanRepository.findAvailabilities({
          hotelId: hotelId,
          ratePlanIds: ratePlanIds,
          isSellable: true,
          roomProductRatePlanIds: roomProductRatePlanIds,
          dates: dates
        })
      ]);

      const roomProductDailyAvailabilityMap = groupByToMap(
        roomProductDailyAvailabilities,
        (item) => item.roomProductId
      );
      const roomProductRatePlanAvailabilityAdjustmentMap = groupByToMap(
        roomProductRatePlanAvailabilityAdjustments,
        (item) => item.roomProductRatePlanId
      );

      const availableRoomProductIds: string[] = [];

      // Process each room request
      for (const targetRoomRequest of roomRequestList) {
        for (const roomProduct of roomProducts) {
          const adultsRequest = targetRoomRequest.adult || 1;
          const childrenRequest =
            targetRoomRequest.childrenAgeList && targetRoomRequest.childrenAgeList.length > 0
              ? targetRoomRequest.childrenAgeList.length
              : 0;
          const totalAdultsAndChildrenRequest = adultsRequest + childrenRequest;

          const rfcMaximumAdults = roomProduct.maximumAdult ?? 0;
          const rfcMaximumExtraBedAdults = roomProduct.extraBedAdult ?? 0;
          const totalRfcMaximumAdults = rfcMaximumAdults + rfcMaximumExtraBedAdults;

          const rfcMaximumChildren = roomProduct.maximumKid ?? 0;
          const rfcMaximumExtraBedChildren = roomProduct.extraBedKid ?? 0;
          const totalRfcMaximumChildren = rfcMaximumChildren + rfcMaximumExtraBedChildren;

          const rfcMaximumCapacityDefault = roomProduct.capacityDefault ?? 0;
          const rfcMaximumCapacityExtra = roomProduct.capacityExtra ?? 0;
          const totalRfcMaximumCapacity = rfcMaximumCapacityDefault + rfcMaximumCapacityExtra;

          // Check if RFC meets capacity requirements
          if (
            totalRfcMaximumAdults >= adultsRequest &&
            totalRfcMaximumChildren >= childrenRequest &&
            totalRfcMaximumCapacity >= totalAdultsAndChildrenRequest
          ) {
            availableRoomProductIds.push(roomProduct.id);
          }
        }
      }

      const availableProductCountMap = new Map<string, number>();
      for (const roomProductRatePlan of roomProductRatePlans) {
        const roomProductDailyAvailabilityInRoomProductRatePlan =
          roomProductDailyAvailabilityMap.get(roomProductRatePlan.roomProductId);
        const roomProductRatePlanAvailabilityAdjustmentInRoomProductRatePlan =
          roomProductRatePlanAvailabilityAdjustmentMap.get(roomProductRatePlan.id);

        const isSellable =
          roomProductRatePlan.isSellable === true ||
          (roomProductRatePlanAvailabilityAdjustmentInRoomProductRatePlan &&
            roomProductRatePlanAvailabilityAdjustmentInRoomProductRatePlan.length > 0 &&
            roomProductRatePlanAvailabilityAdjustmentInRoomProductRatePlan.some(
              (item) => item.isSellable === true
            ));

        const isAvailability =
          roomProductDailyAvailabilityInRoomProductRatePlan &&
          roomProductDailyAvailabilityInRoomProductRatePlan.length > 0 &&
          roomProductDailyAvailabilityInRoomProductRatePlan.some((item) => item.available > 0);

        if (
          availableRoomProductIds.includes(roomProductRatePlan.roomProductId) &&
          isAvailability &&
          isSellable
        ) {
          availableProductCountMap.set(
            roomProductRatePlan.ratePlanId,
            (availableProductCountMap.get(roomProductRatePlan.ratePlanId) || 0) + 1
          );
        }
      }

      const availableRatePlanIds = Array.from(availableProductCountMap.keys());
      const availableRatePlans = ratePlans?.filter((item) =>
        availableRatePlanIds.includes(item.id)
      );

      const resultAvailableRatePlan = availableRatePlans.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        description: item.description,
        promoCodeList: item.promoCodes,
        availableProducts: availableProductCountMap.get(item.id) || 0,
        appliedPromoCodeList:
          promoCodeList && promoCodeList.length > 0
            ? item.promoCodes?.filter((promoCode) => promoCodeList?.includes(promoCode))
            : null
      }));

      const resultAvailableRatePlanHasPromoCodes = resultAvailableRatePlan?.filter(
        (item) => item.appliedPromoCodeList && item.appliedPromoCodeList.length > 0
      );
      const resultAvailableRatePlanNoPromoCodes = resultAvailableRatePlan?.filter(
        (item) => !item.appliedPromoCodeList || item.appliedPromoCodeList.length === 0
      );

      return [
        ...resultAvailableRatePlanHasPromoCodes.sort(
          (a, b) => (b.appliedPromoCodeList?.length || 0) - (a.appliedPromoCodeList?.length || 0)
        ),
        ...resultAvailableRatePlanNoPromoCodes.sort((a, b) => a.name.localeCompare(b.name))
      ];
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getCPPCalendarRoomProducts(
    filter: CppCalendarRoomProductFilterDto
  ): Promise<CppCalendarRoomProductResultDto> {
    const {
      hotelId,
      fromDate,
      toDate,
      promoCodes,
      roomRequests,
      searchText,
      searchTextType,
      featureCodeList
    } = filter;

    const hotel = await this.hotelRepository.findHotelById(hotelId);

    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }

    const { totalAdults, totalChildren, totalPets, requestedCapacity, childrenAgeList } =
      RoomRequestUtils.calculateGuestCounts(
        roomRequests.map((item) => {
          return {
            adult: item.adult || 1,
            childrenAgeList: item.childrenAgeList || [],
            pets: item.pets || 0
          };
        })
      );
    const rangeDates = Helper.generateDateRange(fromDate, toDate);

    const [{ ratePlans, ratePlanSellabilityMap }, roomProducts] = await Promise.all([
      this.getCPPAvailableRatePlan({
        hotelId,
        fromDate,
        toDate,
        promoCodes,
        ratePlanIds: filter.ratePlanIds
      }),

      this.roomProductRepository.find({
        hotelId: hotelId,
        totalAdult: totalAdults,
        totalChildren: totalChildren,
        totalPets: totalPets,
        // featureCodes: featureCodeList,
        name: searchTextType === 'ProductName' ? searchText : undefined,
        // requestedCapacity: requestedCapacity,
        numberOfBedrooms: roomRequests && roomRequests.length > 0 ? roomRequests.length : 0,
        isHasAssignedUnits: true,
        status: [RoomProductStatus.ACTIVE],
        distributionChannels: [DistributionChannel.GV_VOICE]
        // isSellable: true
      })
    ]);
    const roomProductRatePlans =
      ratePlans.length > 0 && roomProducts.length > 0
        ? await this.roomProductRatePlanRepository.findAll(
            {
              hotelId,
              ratePlanIds: ratePlans.map((item) => item.id),
              roomProductIds: roomProducts.map((item) => item.id)
            },
            {
              id: true,
              ratePlanId: true,
              roomProductId: true,
              isSellable: true
            }
          )
        : [];

    const roomProductIds = Array.from(
      new Set(roomProductRatePlans.map((item) => item.roomProductId))
    );
    const ratePlanIds = Array.from(new Set(roomProductRatePlans.map((item) => item.ratePlanId)));
    const roomProductRatePlanIds = roomProductRatePlans.map((item) => item.id);

    const [
      roomProductAssignedUnits,
      closedToStayRestrictions,
      roomProductDailySellingPrices,
      hotelTaxSettings,
      roomProductDailyAvailabilities,

      roomProductMappingPms,
      roomProductRatePlanDailyAvailabilities
    ] = await Promise.all([
      this.roomProductRepository.findAssignedUnits(
        {
          roomProductIds: roomProducts.map((item) => item.id),
          roomNumber: searchTextType === 'RoomNumber' ? searchText : undefined
        },
        {
          id: true,
          roomProductId: true,
          roomUnitId: true,
          roomProduct: true
        }
      ),
      this.restrictionRepository.find({
        where: {
          hotelId: hotelId,
          type: RestrictionConditionType.ClosedToStay,
          fromDate: LessThanOrEqual(new Date(fromDate)),
          toDate: MoreThanOrEqual(new Date(toDate))
        }
      }),
      filter?.ratePlanIds && filter?.ratePlanIds?.length > 0
        ? this.roomProductRatePlanRepository.findDailySellingPrices(
            {
              ratePlanIds: ratePlanIds,
              roomProductIds: roomProductIds,
              dates: rangeDates,
              hotelId: hotelId
            },
            {
              id: true,
              roomProductId: true,
              ratePlanId: true,
              date: true,
              grossPrice: true,
              netPrice: true,
              taxAmount: true,
              basePrice: true,
              featureAdjustments: true
            }
          )
        : [],
      filter?.ratePlanIds && filter?.ratePlanIds?.length > 0
        ? this.hotelTaxRepository.findTaxSettings({ hotelId })
        : [],
      this.roomProductRepository.findAvailabilities({
        hotelId,
        roomProductIds,
        dates: rangeDates
      }),
      this.roomProductRepository.findMappingPms(
        {
          hotelId: hotelId,
          roomProductIds: roomProductIds
        },
        {
          id: true,
          roomProductId: true,
          roomProductMappingPmsCode: true
        }
      ),
      this.roomProductRatePlanRepository.findAvailabilities(
        {
          hotelId,
          roomProductRatePlanIds: roomProductRatePlanIds,
          isSellable: true,
          dates: rangeDates
        },
        {
          id: true,
          roomProductRatePlanId: true,
          date: true,
          ratePlanId: true
        }
      )
    ]);

    const closedToStayDates: string[] = [];
    for (const restriction of closedToStayRestrictions) {
      const dates = Helper.generateDateRange(
        format(restriction.fromDate, DATE_FORMAT),
        format(restriction.toDate, DATE_FORMAT)
      );
      closedToStayDates.push(...dates);
    }

    const uniqueRoomUnitIds = Array.from(
      new Set(roomProductAssignedUnits.map((item) => item.roomUnitId))
    );
    const [uniqueRoomUnit, roomUnitAvailabilities, pricingCalculateResult, matchingPercentages] =
      await Promise.all([
        this.roomUnitRepository.find(
          {
            hotelId: hotelId,
            roomUnitIds: uniqueRoomUnitIds
          },
          ['roomUnit.id', 'roomUnit.roomNumber', 'roomUnit.mappingPmsCode']
        ),
        this.roomUnitRepository.findAvailabilities({
          hotelId: hotelId,
          roomUnitIds: uniqueRoomUnitIds,
          dates: rangeDates
        }),
        filter?.ratePlanIds && filter?.ratePlanIds?.length > 0
          ? this.pricingCalculateService.calculateWithBatch({
              fromDate: fromDate,
              toDate: toDate,
              adults: totalAdults,
              childrenAges: childrenAgeList,
              hotel: hotel,
              isIncludeCityTax: true,
              isIncludeExtraBed: true,
              isIncludeOccupancySurcharge: true,
              isIncludeService: true,
              pets: totalPets,
              roomProductDailySellingPrices: roomProductDailySellingPrices,
              taxSettings: hotelTaxSettings
            })
          : ({
              hotelAmenityPrices: [],
              roomProductDailySellingPrices: [],
              occupancySurcharges: [],
              totalCityTaxAmount: 0,
              totalExtraBedAmount: 0,
              totalCityTaxAmountBeforeAdjustment: 0
            } as PricingCalculateResult),
        this.roomProductRepository.findMatchingPercentage({
          roomProductIds: roomProductIds,
          featureCodes: featureCodeList,
          hotelId: hotelId
        })
      ]);
    const matchingPercentageMap = groupByToMapSingle(
      matchingPercentages,
      (item) => item.roomProductId
    );
    const roomProductMap = groupByToMapSingle(roomProducts, (item) => item.id);
    const roomProductMappingPmsMap = groupByToMapSingle(
      roomProductMappingPms,
      (item) => item.roomProductId
    );
    const assignedUnitMapByRoomUnitId = groupByToMap(
      roomProductAssignedUnits,
      (item) => item.roomUnitId
    );

    const roomProductDailyAvailabilityMapRoomProduct = groupByToMap(
      roomProductDailyAvailabilities,
      (item) => `${item.roomProductId}`
    );
    const roomProductDailySellingPriceMapRoomProductRatePlan = groupByToMap(
      pricingCalculateResult?.roomProductDailySellingPrices,
      (item) => `${item.roomProductId}_${item.ratePlanId}`
    );

    const roomProductDailySellingPriceMapRoomProduct = groupByToMap(
      pricingCalculateResult?.roomProductDailySellingPrices,
      (item) => `${item.roomProductId}`
    );

    const roomProductRatePlanMap = groupByToMap(roomProductRatePlans, (item) => item.roomProductId);
    const roomUnitAvailabilityMap = groupByToMap(roomUnitAvailabilities, (item) => item.roomUnitId);
    const roomProductRatePlanDailyAvailabilityMap = groupByToMap(
      roomProductRatePlanDailyAvailabilities,
      (item) => `${item.roomProductRatePlanId}`
    );

    // build room product result map
    const roomProductResultMap = new Map<string, RoomProductResultItemDto>();
    for (const roomProduct of roomProducts) {
      const matchingPercentage = matchingPercentageMap.get(roomProduct.id);
      const roomProductResult: RoomProductResultItemDto = roomProductResultMap.get(
        roomProduct.id
      ) || {
        roomProductId: roomProduct.id,
        roomProductCode: roomProduct.code,
        roomProductName: roomProduct.name,
        roomProductFeatureList: matchingPercentage?.features || [],
        allocationType: roomProduct.rfcAllocationSetting,
        roomProductType: roomProduct.type,
        capacityDefault: roomProduct.capacityDefault,
        capacityExtra: roomProduct.capacityExtra,
        extraBedKid: roomProduct.extraBedKid,
        extraBedAdult: roomProduct.extraBedAdult,
        maximumPet: roomProduct.maximumPet,
        capacityChildren: roomProduct.maximumKid,
        capacityAdult: roomProduct.maximumAdult,
        numberOfBedrooms: roomProduct.numberOfBedrooms,
        space: roomProduct.space,
        cppCalendarRoomProductSalesPlanList: [],
        matchingPercentage: DecimalRoundingHelper.applyRounding(
          (matchingPercentage?.matchingPercentage || 0) * 100,
          RoundingModeEnum.HALF_UP,
          2
        )
      };

      const cppCalendarRoomProductSalesPlanList: CalendarRoomProductRatePlanDto[] = [];
      const roomProductRatePlanInProduct = roomProductRatePlanMap.get(roomProduct.id) || [];
      for (const roomProductRatePlan of roomProductRatePlanInProduct) {
        const dailySellingRateList: CppDailySellingRateDto[] = [];

        const roomProductDailySellingPrice =
          roomProductDailySellingPriceMapRoomProductRatePlan.get(
            `${roomProduct.id}_${roomProductRatePlan.ratePlanId}`
          ) || [];
        for (const item of roomProductDailySellingPrice) {
          dailySellingRateList.push({
            date: item.date,
            sellingRate: item.grossPrice + item.occupancySurcharge,
            netPrice: item.netPrice,
            grossPrice: item.grossPrice,
            taxAmount: item.taxAmount,
            cityTaxAmount: item.cityTaxAmount
          });
        }

        cppCalendarRoomProductSalesPlanList.push({
          roomProductSalesPlanId: roomProductRatePlan.id,
          roomProductSalesPlanCode: roomProductRatePlan.code,
          roomProductSalesPlanName: roomProductRatePlan.name,
          dailySellingRateList: dailySellingRateList
        });
      }

      roomProductResult['cppCalendarRoomProductSalesPlanList'] =
        cppCalendarRoomProductSalesPlanList;
      roomProductResultMap.set(roomProduct.id, roomProductResult);
    }

    // build room product availability result map
    // <roomUnitId, RoomUnitAvailability[]>
    const roomUnitAvailabilityResultMap = new Map<string, RoomProductAvailabilityResultItemDto[]>();

    for (const roomUnit of uniqueRoomUnit) {
      const roomProductAvailabilityResult = roomUnitAvailabilityResultMap.get(roomUnit.id) || [];

      const assignedUnits = assignedUnitMapByRoomUnitId.get(roomUnit.id) || [];

      for (const assignedUnit of assignedUnits) {
        const roomProduct = roomProductMap.get(assignedUnit.roomProductId);

        if (!roomProduct) {
          continue;
        }

        const roomProductDailySellingPrices =
          roomProductDailySellingPriceMapRoomProduct.get(roomProduct.id) || [];
        const roomUnitAvailability = roomUnitAvailabilityMap.get(assignedUnit.roomUnitId) || [];
        const roomProductRatePlanInProduct = roomProductRatePlanMap.get(roomProduct.id) || [];
        const roomProductDailyAvailabilitiesInProduct =
          roomProductDailyAvailabilityMapRoomProduct.get(roomProduct.id) || [];
        const roomProductMappingPms = roomProductMappingPmsMap.get(roomProduct.id);

        let available: boolean = true;

        if (roomProduct.status !== RoomProductStatus.ACTIVE) {
          available = false;
        }

        // if (
        //   searchText &&
        //   searchTextType === 'ProductName' &&
        //   roomProduct.name &&
        //   !roomProduct.name.includes(searchText)
        // ) {
        //   available = false;
        // }

        if (roomProductDailySellingPrices.length === 0) {
          // available = false;
        }

        const isGuestCapacityAvailable = this.roomProductRepository.checkGuestCapacity({
          roomProduct: roomProduct,
          totalAdult: totalAdults,
          totalChildren: totalChildren,
          totalPets: totalPets,
          requestedCapacity: requestedCapacity,
          numberOfBedrooms: roomRequests && roomRequests.length > 0 ? roomRequests.length : 0
        });
        if (!isGuestCapacityAvailable) {
          available = false;
        }

        if (roomProductRatePlanInProduct.length === 0) {
          available = false;
        }

        if (roomProductDailyAvailabilitiesInProduct.every((item) => item.available == 0)) {
          available = false;
        }

        if (
          roomUnitAvailability.length === 0 ||
          roomUnitAvailability.every(
            (item) =>
              item.status !== RoomUnitAvailabilityStatus.AVAILABLE ||
              closedToStayDates.includes(item.date)
          )
        ) {
          available = false;
        }

        if (!roomUnit.mappingPmsCode) {
          available = false;
        }

        let availableRoomProductRatePlanIds = new Set<string>();
        let availableRoomProductIds = new Set<string>();
        for (const roomProductRatePlan of roomProductRatePlanInProduct) {
          const roomProductRatePlanDailyAvailabilities =
            roomProductRatePlanDailyAvailabilityMap.get(roomProductRatePlan.id) || [];

          for (const date of rangeDates) {
            const ratePlanSellability =
              ratePlanSellabilityMap.get(roomProductRatePlan.ratePlanId) || [];
            const isRatePlanSellable = ratePlanSellability.find(
              (item) => item.date === date
            )?.isSellable;

            if (!isRatePlanSellable) {
              continue;
            }

            const roomProductRatePlanDailyAvailability =
              roomProductRatePlanDailyAvailabilities.find((item) => item.date === date);
            let isSellable = roomProductRatePlan.isSellable;
            if (roomProductRatePlanDailyAvailability) {
              isSellable = roomProductRatePlanDailyAvailability.isSellable;
            }
            if (isSellable) {
              availableRoomProductRatePlanIds.add(`${roomProductRatePlan.id}_${date}`);
              availableRoomProductIds.add(`${roomProductRatePlan.roomProductId}_${date}`);
            }
          }
        }

        if (availableRoomProductRatePlanIds.size === 0) {
          available = false;
        }

        roomProductAvailabilityResult.push({
          available: available,
          roomId: roomUnit.roomNumber,
          roomProductId: assignedUnit.roomProductId,
          dailyRoomAvailabilityList: roomUnitAvailability.map((item) => {
            let availableRooms: 0 | 1 = 1;
            if (
              roomProduct?.numberOfBedrooms === 0 ||
              item.status !== RoomUnitAvailabilityStatus.AVAILABLE ||
              closedToStayDates.includes(item.date) ||
              !availableRoomProductIds.has(`${assignedUnit.roomProductId}_${item.date}`)
            ) {
              availableRooms = 0;
            }

            return {
              date: item.date,
              availableRooms: availableRooms,
              hasRate: true
            };
          })
        });
      }

      roomUnitAvailabilityResultMap.set(roomUnit.id, roomProductAvailabilityResult);
    }

    return {
      rooms: uniqueRoomUnit,
      roomProductAvailabilities: mapToRecord(roomUnitAvailabilityResultMap),
      roomProducts: mapToRecord(roomProductResultMap)
    };
  }

  async getCppCalculateRoomProductPriceListV2(filter: CppCalculateRoomProductPriceFilterDto) {
    const {
      arrival,
      departure,
      excludedList,
      featureCodeList,
      promoCodeList,
      hotelId,
      roomId,
      roomRequestList,
      salesPlanIdList
    } = filter;

    const hotel = await this.hotelRepository.findHotelById(hotelId);

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const dates = Helper.generateDateRange(arrival, departure).slice(0, -1);

    // filter excluded list
    for (const excluded of excludedList || []) {
      if (excluded.roomId === roomId) {
        const d = Helper.generateDateRange(excluded.arrival!, excluded.departure!).slice(0, -1);
        if (dates.some((item) => d.includes(item))) {
          console.log('Room is not available for the excluded dates');
          return [];
        }
      }
    }

    const [assignedUnits] = await Promise.all([
      this.roomProductRepository.findAssignedUnits(
        {
          roomUnitIds: [roomId],
          relations: {
            roomUnit: true
          }
        },
        {
          id: true,
          roomUnitId: true,
          roomProductId: true,
          roomUnit: {
            id: true,
            roomNumber: true,
            mappingPmsCode: true
          }
        }
      )
    ]);
    if (!assignedUnits.length) {
      console.log('Room unit not assigned to any room product');
      return [];
    }
    const { totalAdults, totalChildren, totalPets, childrenAgeList } =
      RoomRequestUtils.calculateGuestCounts(
        roomRequestList.map((item) => {
          return {
            adult: item.adult || 1,
            childrenAgeList: item.childrenAgeList || [],
            pets: item.pets || 0
          };
        })
      );

    const [roomProducts, ratePlans] = await Promise.all([
      this.roomProductRepository.find({
        roomProductIds: Array.from(new Set(assignedUnits.map((item) => item.roomProductId))),
        hotelId: hotelId,
        totalAdult: totalAdults,
        totalChildren: totalChildren,
        totalPets: totalPets,
        numberOfBedrooms:
          roomRequestList && roomRequestList.length > 0 ? roomRequestList.length : 0,
        featureCodes: featureCodeList || [],
        status: [RoomProductStatus.ACTIVE],
        distributionChannels: [DistributionChannel.GV_VOICE]
      }),
      this.getCPPAvailableRatePlanWithSellabilities({
        hotelId,
        isMatchAllRanges: true,
        fromDate: dates[0],
        toDate: dates[dates.length - 1],
        promoCodes: promoCodeList || [],
        ratePlanIds: salesPlanIdList || []
      })
    ]);

    const ratePlanIds = ratePlans.map((item) => item.id);
    const roomProductIds = roomProducts.map((item) => item.id);

    const roomProductRatePlans = await this.roomProductRatePlanRepository.findAll({
      roomProductIds: roomProductIds,
      hotelId: hotelId,
      ratePlanIds: ratePlanIds
    });

    const roomProductRatePlanIds = roomProductRatePlans.map((item) => item.id);

    const [allRoomProductRatePlanNotAvailabilityAdjustments] = await Promise.all([
      this.roomProductRatePlanRepository.findAvailabilities({
        hotelId,
        ratePlanIds: ratePlanIds,
        roomProductRatePlanIds: roomProductRatePlanIds,
        dates: dates
      })
    ]);

    const roomProductRatePlanNotAvailabilityAdjustmentMap = groupByToMap(
      allRoomProductRatePlanNotAvailabilityAdjustments,
      (item) => `${item.roomProductRatePlanId}`
    );

    const validRoomProductRatePlans: RoomProductRatePlan[] = [];
    for (const roomProductRatePlan of roomProductRatePlans) {
      let isSellable = roomProductRatePlan.isSellable;
      const roomProductRatePlanAvailabilityAdjustments =
        roomProductRatePlanNotAvailabilityAdjustmentMap.get(roomProductRatePlan.id) || [];

      if (roomProductRatePlanAvailabilityAdjustments.length > 0) {
        if (
          dates.every(
            (date) =>
              roomProductRatePlanAvailabilityAdjustments.find((item) => item.date === date)
                ?.isSellable === true
          )
        ) {
          isSellable = true;
        } else {
          isSellable = false;
        }
      }

      if (isSellable) {
        validRoomProductRatePlans.push(roomProductRatePlan);
      }
    }
    let validRoomProductIds = [
      ...new Set(validRoomProductRatePlans.map((item) => item.roomProductId))
    ];
    const validRatePlanIds = [...new Set(validRoomProductRatePlans.map((item) => item.ratePlanId))];

    // check te
    const roomProductAvailability = await this.roomProductDailyAvailabilityRepository.find({
      where: {
        hotelId: hotelId,
        date: In(dates),
        deletedAt: IsNull(),
        roomProduct: {
          hotelId: hotelId,
          deletedAt: IsNull(),
          status: RoomProductStatus.ACTIVE,
          id: In(validRoomProductIds)
        }
      }
    });

    // Group adjustments by date
    for (const roomProductId of validRoomProductIds) {
      const roomProductAvailabilityList = roomProductAvailability.filter(
        (item) => item.roomProductId === roomProductId
      );
      for (const date of dates) {
        const roomProductAvailability = roomProductAvailabilityList.find(
          (item) => item.date === date
        );
        // room product is not available
        if (!roomProductAvailability || roomProductAvailability.available === 0) {
          validRoomProductIds = validRoomProductIds.filter((item) => item !== roomProductId);
          continue;
        }

        //TODO: check room product mapping pms
        // const roomProductMappingPms = roomProductMappingPmsMap.get(roomProductId);
        // if (!roomProductMappingPms) {
        //   validRoomProductIds = validRoomProductIds.filter((item) => item !== roomProductId);
        //   continue;
        // }
      }
    }

    const [
      beneficialCxlPolicies,
      beneficialPaymentTerms,
      roomProductImages,
      roomProductStandardFeatures,
      roomProductRetailFeatures,
      ratePlanRestrictions,
      roomProductRestrictions,
      hotelRestrictions
    ] = await Promise.all([
      this.ratePlanSettingService.getMostBeneficialCxlPolicy({
        hotelId,
        ratePlans: ratePlans.filter((item) => validRatePlanIds.includes(item.id)),
        fromDate: dates[0],
        toDate: dates[dates.length - 1]
      }),
      this.ratePlanSettingService.getMostBeneficialPaymentTerm({
        hotelId,
        ratePlans: ratePlans.filter((item) => validRatePlanIds.includes(item.id)),
        fromDate: dates[0],
        toDate: dates[dates.length - 1]
      }),
      this.roomProductRepository.findImages({
        roomProductIds: validRoomProductIds
      }),
      this.roomProductRepository.findStandardFeatures(
        {
          roomProductIds: validRoomProductIds,
          hotelId: hotelId,
          relations: {
            standardFeature: true
          }
        },
        {
          id: true,
          roomProductId: true,
          standardFeature: true
        }
      ),
      this.roomProductRepository.findRetailFeatures(
        {
          roomProductIds: validRoomProductIds,
          hotelId: hotelId,
          relations: {
            retailFeature: true
          }
        },
        {
          id: true,
          roomProductId: true,
          retailFeature: true
        }
      ),
      this.restrictionService.getRatePlanRestrictions({
        hotelId: hotelId,
        ratePlanIds: validRatePlanIds,
        fromDate: filter.arrival,
        toDate: filter.departure
      }),
      this.restrictionService.getRoomProductRestrictions({
        hotelId: hotelId,
        roomProductIds: validRoomProductIds,
        fromDate: filter.arrival,
        toDate: filter.departure
      }),
      this.restrictionService.getHotelRestrictions({
        hotelId: hotelId,
        fromDate: filter.arrival,
        toDate: filter.departure
      })
    ]);

    const filteredValidRoomProductRatePlans = roomProductRatePlans.filter(
      (item) =>
        validRoomProductIds.includes(item.roomProductId) &&
        validRatePlanIds.includes(item.ratePlanId)
    );

    const pricingCalculation = await this.bookingCalculateService.calculateBookingPricing({
      hotelId: hotelId,
      reservations: filteredValidRoomProductRatePlans.map((item) => ({
        arrival: filter.arrival,
        departure: filter.departure,
        adults: totalAdults,
        childrenAges: childrenAgeList,
        pets: totalPets,
        roomProductId: item.roomProductId,
        ratePlanId: item.ratePlanId,
        amenityList: []
      })),
      isSkipCancellationPolicy: true,
      isSkipPaymentTerm: true,
      hotelCode: hotel.code,
      isCityTaxIncluded: true
    });

    // const pricingCalculation = await this.pricingCalculateService.calculateWithBatch({
    //   fromDate: dates[0],
    //   toDate: dates[dates.length - 1],
    //   adults: totalAdults,
    //   childrenAges: childrenAgeList,
    //   pets: totalPets,
    //   hotel,
    //   roomProductDailySellingPrices: roomProductDailySellingPrices,
    //   taxSettings: hotelTaxSettings,
    //   isIncludeCityTax: true,
    //   isIncludeOccupancySurcharge: true,
    //   isIncludeExtraBed: true,
    //   isIncludeService: true,
    //   extraTypes: [RoomProductExtraType.INCLUDED, RoomProductExtraType.MANDATORY]
    // });

    const validRoomProductRatePlanMap = groupByToMap(
      validRoomProductRatePlans,
      (item) => item.roomProductId
    );
    const roomProductImageMap = groupByToMap(roomProductImages, (item) => item.roomProductId);
    const roomProductStandardFeatureMap = groupByToMap(
      roomProductStandardFeatures,
      (item) => item.roomProductId
    );
    const roomProductRetailFeatureMap = groupByToMap(
      roomProductRetailFeatures,
      (item) => item.roomProductId
    );

    const result: CppCalculateRoomProductPriceV2ResponseDto[] = [];

    const hotelRestrictionMap = groupByToMapSingle(hotelRestrictions, (item) => item.hotelId);
    const ratePlanRestrictionMap = groupByToMapSingle(
      ratePlanRestrictions,
      (item) => item.ratePlanId
    );
    const roomProductRestrictionMap = groupByToMapSingle(
      roomProductRestrictions,
      (item) => item.rfcId
    );

    const cppHotelRestrictions: CppRestrictionDto[] = CppRestrictionUtil.toCppHotelRestrictionList(
      hotelId,
      hotelRestrictionMap
    );

    for (const roomProduct of roomProducts) {
      const roomProductRatePlansByRoomProduct =
        validRoomProductRatePlanMap.get(roomProduct.id) || [];
      const roomProductImagesByRoomProduct = roomProductImageMap.get(roomProduct.id) || [];
      const roomProductStandardFeaturesByRoomProduct =
        roomProductStandardFeatureMap.get(roomProduct.id) || [];
      const roomProductRetailFeaturesByRoomProduct =
        roomProductRetailFeatureMap.get(roomProduct.id) || [];

      if (!roomProductRatePlansByRoomProduct || roomProductRatePlansByRoomProduct.length === 0) {
        continue;
      }

      const sellableRoomProductRatePlans: CppSellableOptionDto[] = [];
      for (const roomProductRatePlan of roomProductRatePlansByRoomProduct) {
        const reservationPricing = pricingCalculation.reservationPricingList.find(
          (item) =>
            item.roomProductSalesPlan.rfcId === roomProductRatePlan.roomProductId &&
            item.roomProductSalesPlan.ratePlanId === roomProductRatePlan.ratePlanId
        );

        if (!reservationPricing) {
          continue;
        }

        const beneficialCxlPolicy = beneficialCxlPolicies.find(
          (item) => item.ratePlanId === roomProductRatePlan.ratePlanId
        );
        const beneficialPaymentTerm = beneficialPaymentTerms.find(
          (item) => item.ratePlanId === roomProductRatePlan.ratePlanId
        );
        const ratePlan = ratePlans.find((item) => item.id === roomProductRatePlan.ratePlanId);

        if (!ratePlan) {
          continue;
        }

        const includeServiceMap = new Map<string, any>();

        for (const extraService of reservationPricing?.amenityPricingList) {
          includeServiceMap.set(extraService.hotelAmenity.id, {
            id: extraService.hotelAmenity.id,
            code: extraService.hotelAmenity.code,
            name: extraService.hotelAmenity.name,
            pricingUnit: extraService.hotelAmenity.pricingUnit
          });
        }

        const totalCityTaxAmount = reservationPricing?.cityTaxAmount ?? 0;
        const totalGrossAmount = reservationPricing?.totalGrossAmount ?? 0;
        const totalBaseAmount = reservationPricing?.totalBaseAmount ?? 0;
        const totalTaxAmount = reservationPricing?.taxAmount ?? 0;

        const cppRatePlanRestrictions =
          CppRestrictionUtil.toCppRatePlanOrRoomProductRestrictionList(
            ratePlan?.id,
            ratePlanRestrictionMap
          );
        const cppRoomProductRestrictions =
          CppRestrictionUtil.toCppRatePlanOrRoomProductRestrictionList(
            roomProduct.id,
            roomProductRestrictionMap
          );

        sellableRoomProductRatePlans.push({
          roomProductId: roomProduct.id,
          roomProductCode: roomProduct.code,
          salesPlanId: ratePlan?.id,
          salesPlanCode: ratePlan?.code,
          salesPlanName: ratePlan?.name,
          salesPlanDescription: ratePlan?.description,
          roomProductSalesPlanId: roomProductRatePlan.id,
          roomProductSalesPlanCode: roomProductRatePlan.code,
          totalBaseAmount: totalBaseAmount,
          totalTaxAmount: totalTaxAmount,
          totalCityTaxAmount: totalCityTaxAmount,
          totalGrossAmount: totalGrossAmount,
          promoCode: '',
          paymentTerm: beneficialPaymentTerm?.hotelPaymentTerm?.description,
          cxlPolicy: beneficialCxlPolicy?.hotelCancellationPolicy?.description,
          includedServiceList: Array.from(includeServiceMap.values()),
          restrictionList: CppRestrictionUtil.buildCppRestrictionList({
            cppHotelRestrictionList: cppHotelRestrictions,
            cppRatePlanRestrictionList: cppRatePlanRestrictions,
            cppRoomProductRestrictionList: cppRoomProductRestrictions,
            fromDate: filter.arrival,
            toDate: format(subDays(filter.departure, 1), DATE_FORMAT)
          })
        });
      }

      result.push({
        assignedRoomList:
          assignedUnits
            ?.filter((item) => item.roomProductId === roomProduct.id)
            ?.map((item) => ({
              roomId: item.roomUnit.id,
              roomNumber: item.roomUnit.roomNumber
            })) || [],
        restrictionList: [],
        roomProductList: [
          {
            roomProductId: roomProduct.id,
            roomProductCode: roomProduct.code,
            roomProductName: roomProduct.name,
            allocatedAdults: roomProduct.capacityDefault,
            allocatedChildren: roomProduct.capacityExtra,
            allocatedExtraAdults: roomProduct.extraAdult,
            allocatedExtraChildren: roomProduct.extraChildren,
            allocatedStrategy: roomProduct.rfcAllocationSetting,
            isLockedUnit: roomProduct.isLockedUnit,
            maximumPet: roomProduct.maximumPet,
            numberOfBedrooms: roomProduct.numberOfBedrooms,
            space: roomProduct.space,
            matchingPercentage: null,
            imageList: await Promise.all(
              roomProductImagesByRoomProduct?.map(async (item) => ({
                url: await this.s3Service.getPreSignedUrl(item.imageUrl)
                // ...item
              })) || []
            ),
            retailFeatureList: roomProductRetailFeaturesByRoomProduct.map((retailFeature) => ({
              code: retailFeature.retailFeature.code,
              name: retailFeature.retailFeature.name,
              iconUrl: retailFeature.retailFeature.imageUrl,
              isMatched: featureCodeList?.includes(retailFeature.retailFeature.code)
            })),
            additionalRetailFeatureList: roomProductRetailFeaturesByRoomProduct
              ?.filter((item) => !featureCodeList?.includes(item.retailFeature.code))
              ?.map((retailFeature) => ({
                code: retailFeature.retailFeature.code,
                name: retailFeature.retailFeature.name,
                iconUrl: retailFeature.retailFeature.imageUrl,
                isMatched: true
              })),
            standardFeatureList: roomProductStandardFeaturesByRoomProduct.map(
              (standardFeature) => ({
                code: standardFeature.standardFeature.code,
                name: standardFeature.standardFeature.name,
                iconUrl: standardFeature.standardFeature.imageUrl,
                isMatched: featureCodeList?.includes(standardFeature.standardFeature.code)
              })
            )
          }
        ],
        sellableOptionList: sellableRoomProductRatePlans.sort(
          (a, b) => a.totalGrossAmount - b.totalGrossAmount
        )
      });
    }

    return result.filter((item) => item.sellableOptionList.length > 0);
  }

  private async getCPPAvailableRatePlan(filter: {
    hotelId: string;
    promoCodes?: string[];
    fromDate: string;
    toDate: string;
    ratePlanIds?: string[];
    isMatchAllRanges?: boolean;
    isMappingPms?: boolean;
  }): Promise<{
    ratePlans: RatePlan[];
    ratePlanSellabilityMap: Map<string, DailyRatePlanSellabilityDto[]>;
  }> {
    const { hotelId, promoCodes, fromDate, toDate, ratePlanIds, isMatchAllRanges, isMappingPms } =
      filter;
    const ranges = Helper.generateDateRange(fromDate, toDate);
    const queryBuilder = this.ratePlanRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.ratePlanPaymentTermSettings', 'rpts')
      .where('rp.hotelId = :hotelId', { hotelId })
      .andWhere('rp.deletedAt IS NULL')
      .andWhere(':channel = ANY(rp.distributionChannel)', {
        channel: DistributionChannel.GV_VOICE
      })
      .andWhere('rp.status = :status', { status: RatePlanStatusEnum.ACTIVE })
      // Phải có Payment Term Setting
      .andWhere(
        'EXISTS (SELECT 1 FROM rate_plan_payment_term_setting rpts2 WHERE rpts2.rate_plan_id = rp.id)'
      )
      // Phải có ít nhất 1 Payment Method được support
      .andWhere(
        'EXISTS (SELECT 1 FROM rate_plan_payment_term_setting rpts3 WHERE rpts3.rate_plan_id = rp.id AND rpts3.supported_payment_method_codes IS NOT NULL AND array_length(rpts3.supported_payment_method_codes, 1) > 0)'
      );

    if (isMappingPms !== undefined && isMappingPms !== null) {
      if (isMappingPms) {
        queryBuilder.andWhere('rp.pmsMappingRatePlanCode IS NOT NULL');
      } else {
        queryBuilder.andWhere('rp.pmsMappingRatePlanCode IS NULL');
      }
    }

    if (ratePlanIds && ratePlanIds.length > 0) {
      queryBuilder.andWhere('rp.id IN (:...ratePlanIds)', { ratePlanIds });
    }

    // Logic xử lý PROMOTION type với promo code
    const notInRatePlanTypes = [RatePlanTypeEnum.PROMOTION, RatePlanTypeEnum.CORPORATE];
    if (promoCodes && promoCodes.length > 0) {
      // Nếu có promo code:
      // - Giữ lại tất cả type không phải PROMOTION
      // - HOẶC type = PROMOTION và có promo code matching

      queryBuilder.andWhere('rp.promoCodes && ARRAY[:...promoCodes]::text[]', {
        promoCodes
      });

      // queryBuilder.andWhere(
      //   new Brackets((qb) => {
      //     qb.where('rp.type NOT IN (:...notInRatePlanTypes)', {
      //       notInRatePlanTypes
      //     }).orWhere(
      //       new Brackets((qb2) => {
      //         qb2
      //           .where('rp.type IN (:...notInRatePlanTypes)', { notInRatePlanTypes })
      //           .andWhere('rp.promoCodes && ARRAY[:...promoCodes]::text[]', {
      //             promoCodes
      //           });
      //       })
      //     );
      //   })
      // );

      // queryBuilder.andWhere(
      //   new Brackets((qb) => {
      //     qb.where('rp.type NOT IN (:...notInRatePlanTypes)', {
      //       notInRatePlanTypes
      //     }).orWhere(
      //       new Brackets((qb2) => {
      //         qb2
      //           .where('rp.type IN (:...notInRatePlanTypes)', { notInRatePlanTypes })
      //           .andWhere('rp.promoCodes && ARRAY[:...promoCodes]::text[]', {
      //             promoCodes
      //           });
      //       })
      //     );
      //   })
      // );
    } else {
      // Nếu KHÔNG có promo code:
      // - Chỉ giữ lại rate plans không phải PROMOTION type
      queryBuilder.andWhere('rp.type NOT IN (:...notInRatePlanTypes)', {
        notInRatePlanTypes
      });
    }

    // Lấy toàn bộ thông tin về rate plan
    const ratePlans = await queryBuilder
      .select([
        'rp.id',
        'rp.code',
        'rp.name',
        'rp.description',
        'rp.type',
        'rp.promoCodes',
        'rp.distributionChannel',
        'rp.status',
        'rp.hotelCxlPolicyCode',
        'rpts.id',
        'rpts.hotelPaymentTermId',
        'rpts.supportedPaymentMethodCodes',
        'rpts.isDefault'
      ])
      .getMany();

    // if (!promoCodes || promoCodes?.length === 0) {
    //   return {
    //     ratePlans,
    //     ratePlanSellabilityMap: new Map()
    //   };
    // }

    const filterRatePlanIds = ratePlans.map((item) => item.id);
    const ratePlanSellabilities = await this.ratePlanSellabilityService.getDailyRatePlanSellability(
      {
        hotelId: hotelId,
        salesPlanIdList: filterRatePlanIds,
        distributionChannelList: [DistributionChannel.GV_VOICE],
        fromDate: fromDate,
        toDate: toDate
      }
    );

    const ratePlanSellabilityMap = groupByToMap(ratePlanSellabilities, (item) => item.salePlanId);

    const sellableRatePlans = ratePlans.filter((item) => {
      const ratePlanSellability = ratePlanSellabilityMap.get(item.id) || [];
      if (!ratePlanSellability) {
        return false;
      }

      if (isMatchAllRanges) {
        return (
          ratePlanSellability.filter(
            (ratePlanSellabilityItem) => ratePlanSellabilityItem.isSellable
          ).length === ranges.length
        );
      }

      return (
        ratePlanSellability.filter((ratePlanSellabilityItem) => ratePlanSellabilityItem.isSellable)
          .length > 0
      );
    });

    return {
      ratePlans: sellableRatePlans,
      ratePlanSellabilityMap
    };
  }

  private async getCPPAvailableRatePlanWithSellabilities(filter: {
    hotelId: string;
    promoCodes?: string[];
    fromDate: string;
    toDate: string;
    ratePlanIds?: string[];
    isOnlyPromoCodes?: boolean;
    isMatchAllRanges?: boolean;
    isMappingPms?: boolean;
  }) {
    const {
      hotelId,
      promoCodes,
      fromDate,
      toDate,
      ratePlanIds,
      isOnlyPromoCodes,
      isMatchAllRanges,
      isMappingPms
    } = filter;
    const ranges = Helper.generateDateRange(fromDate, toDate);
    const queryBuilder = this.ratePlanRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.ratePlanPaymentTermSettings', 'rpts')
      .where('rp.hotelId = :hotelId', { hotelId })
      .andWhere('rp.deletedAt IS NULL')
      .andWhere(':channel = ANY(rp.distributionChannel)', {
        channel: DistributionChannel.GV_VOICE
      })
      .andWhere('rp.status = :status', { status: RatePlanStatusEnum.ACTIVE })
      // Phải có Payment Term Setting
      .andWhere(
        'EXISTS (SELECT 1 FROM rate_plan_payment_term_setting rpts2 WHERE rpts2.rate_plan_id = rp.id)'
      )
      // Phải có ít nhất 1 Payment Method được support
      .andWhere(
        'EXISTS (SELECT 1 FROM rate_plan_payment_term_setting rpts3 WHERE rpts3.rate_plan_id = rp.id AND rpts3.supported_payment_method_codes IS NOT NULL AND array_length(rpts3.supported_payment_method_codes, 1) > 0)'
      );

    if (isMappingPms !== undefined && isMappingPms !== null) {
      if (isMappingPms) {
        queryBuilder.andWhere('rp.pmsMappingRatePlanCode IS NOT NULL');
      } else {
        queryBuilder.andWhere('rp.pmsMappingRatePlanCode IS NULL');
      }
    }

    if (ratePlanIds && ratePlanIds.length > 0) {
      queryBuilder.andWhere('rp.id IN (:...ratePlanIds)', { ratePlanIds });
    }

    // Logic xử lý PROMOTION type với promo code
    const notInRatePlanTypes = [RatePlanTypeEnum.PROMOTION, RatePlanTypeEnum.CORPORATE];
    if (promoCodes && promoCodes.length > 0) {
      // Nếu có promo code:
      // - Giữ lại tất cả type không phải PROMOTION
      // - HOẶC type = PROMOTION và có promo code matching

      queryBuilder.andWhere('rp.promoCodes && ARRAY[:...promoCodes]::text[]', {
        promoCodes
      });

      // queryBuilder.andWhere(
      //   new Brackets((qb) => {
      //     qb.where('rp.type NOT IN (:...notInRatePlanTypes)', {
      //       notInRatePlanTypes
      //     }).orWhere(
      //       new Brackets((qb2) => {
      //         qb2
      //           .where('rp.type IN (:...notInRatePlanTypes)', { notInRatePlanTypes })
      //           .andWhere('rp.promoCodes && ARRAY[:...promoCodes]::text[]', {
      //             promoCodes
      //           });
      //       })
      //     );
      //   })
      // );
    } else {
      // Nếu KHÔNG có promo code:
      // - Chỉ giữ lại rate plans không phải PROMOTION type
      queryBuilder.andWhere('rp.type NOT IN (:...notInRatePlanTypes)', {
        notInRatePlanTypes
      });
    }

    // Lấy toàn bộ thông tin về rate plan
    const ratePlans = await queryBuilder
      .select([
        'rp.id',
        'rp.code',
        'rp.name',
        'rp.description',
        'rp.type',
        'rp.promoCodes',
        'rp.distributionChannel',
        'rp.status',
        'rp.hotelCxlPolicyCode',
        'rpts.id',
        'rpts.hotelPaymentTermId',
        'rpts.supportedPaymentMethodCodes',
        'rpts.isDefault'
      ])
      .getMany();

    const filterRatePlanIds = ratePlans.map((item) => item.id);
    const ratePlanSellabilities = await this.ratePlanSellabilityService.getDailyRatePlanSellability(
      {
        hotelId: hotelId,
        salesPlanIdList: filterRatePlanIds,
        distributionChannelList: [DistributionChannel.GV_VOICE],
        fromDate: fromDate,
        toDate: toDate
      }
    );

    const ratePlanSellabilityMap = groupByToMap(ratePlanSellabilities, (item) => item.salePlanId);

    return ratePlans.filter((item) => {
      const ratePlanSellability = ratePlanSellabilityMap.get(item.id) || [];
      if (!ratePlanSellability) {
        return false;
      }

      if (isMatchAllRanges) {
        return ratePlanSellability.filter((item) => item.isSellable).length >= ranges.length;
      }

      return ratePlanSellability.filter((item) => item.isSellable).length > 0;
    });
  }

  async iseRecommendedOffers(body: IseRecommendedOffersDto) {
    const hotel = await this.hotelRepository.findByCode(body.hotelCode);
    if (!hotel) {
      throw new Error('Hotel not found');
    }
    body.priorityCategoryCodeList = body.preferredFeatureList;

    // parse date string like ise
    body.arrival = `${body.arrival}T00:00:00.000Z`;
    body.departure = `${body.departure}T00:00:00.000Z`;

    const stayOptions = await this.stayOptionService.getIseRecommendationStayOptions(body, true);

    // Get all rate plan IDs from stay options
    const ratePlanIds = [
      ...new Set(
        stayOptions.flatMap((option) =>
          (option.availableRfcRatePlanList || []).map((rp: any) => rp.ratePlan?.id).filter(Boolean)
        )
      )
    ];

    // Get rate plans for beneficial policies and payment terms
    const ratePlans = await this.ratePlanRepository.find({
      where: { id: In(ratePlanIds) },
      select: ['id', 'code', 'name', 'description', 'hotelId']
    });

    // Get beneficial cancellation policies and payment terms (matching Java logic)
    const dates = Helper.generateDateRange(
      format(body.arrival, DATE_FORMAT),
      format(body.departure, DATE_FORMAT)
    );

    const [beneficialCxlPolicies, beneficialPaymentTerms] = await Promise.all([
      this.ratePlanSettingService.getMostBeneficialCxlPolicy({
        hotelId: hotel.id,
        ratePlans: ratePlans,
        fromDate: dates[0],
        toDate: dates[dates.length - 1]
      }),
      this.ratePlanSettingService.getMostBeneficialPaymentTerm({
        hotelId: hotel.id,
        ratePlans: ratePlans,
        fromDate: dates[0],
        toDate: dates[dates.length - 1]
      })
    ]);

    // Transform the data to match CppRecommendationOffer schema
    const data = await this.mapStayOptionsToCppRecommendationOffers(
      stayOptions,
      hotel.id,
      beneficialCxlPolicies,
      beneficialPaymentTerms
    );

    return {
      count: data.length,
      totalPage: 1,
      data
    };
  }

  /**
   * Maps stay options data to CppRecommendationOffer format
   * @private
   */
  private async mapStayOptionsToCppRecommendationOffers(
    stayOptions: any[],
    hotelId: string,
    beneficialCxlPolicies: any[],
    beneficialPaymentTerms: any[]
  ): Promise<any[]> {
    if (!stayOptions || stayOptions.length === 0) {
      return [];
    }

    const roomProductCodes = stayOptions.flatMap((option) =>
      option.availableRfcList.map((rfc: any) => rfc.code)
    );
    const [roomProducts] = await Promise.all([
      this.roomProductEntityRepository.find({
        where: {
          code: In(roomProductCodes),
          hotelId: hotelId
        }
      })
    ]);
    const roomProductStandardFeatures = await this.roomProductStandardFeatureRepository.find({
      where: {
        hotelId: hotelId,
        roomProductId: In(roomProducts.map((product) => product.id))
      },
      select: {
        standardFeature: {
          id: true,
          code: true,
          name: true,
          imageUrl: true,
          description: true
        }
      },
      relations: {
        standardFeature: true
      }
    });

    return stayOptions.map((option) => {
      // Map availableRfcList to roomProductList
      const roomProductList = (option.availableRfcList || [])
        .map((rfc: any) => {
          const roomProduct = roomProducts.find((product) => product.code === rfc.code);
          if (!roomProduct) {
            return null;
          }
          const roomProductStandardFeaturesFiltered = roomProductStandardFeatures.filter(
            (feature) => feature.roomProductId === roomProduct.id
          );
          return {
            roomProductId: roomProduct?.id,
            roomProductCode: roomProduct?.code,
            roomProductName: roomProduct?.name,
            isLockedUnit: roomProduct?.isLockedUnit || false,
            allocatedAdults: rfc.allocatedAdultCount || 0,
            allocatedChildren: rfc.allocatedChildCount || 0,
            allocatedExtraAdults: rfc.allocatedExtraBedAdultCount || 0,
            allocatedExtraChildren: rfc.allocatedExtraBedChildCount || 0,
            allocatedStrategy: rfc.rfcAllocationSetting,
            numberOfBedrooms: rfc.numberOfBedrooms || 1,
            space: roomProduct.space || 0,
            maximumPet: roomProduct.maximumPet || 0,
            matchingPercentage: rfc.matchingPercentage || null,
            imageList: (rfc.rfcImageList || []).map((img: any) => ({
              url: img.imageUrl || null
            })),
            retailFeatureList: (rfc.retailFeatureList || []).map((feature: any) => ({
              id: feature.id,
              code: feature.code,
              name: feature.name,
              displayName: feature.displayName || feature.name,
              iconUrl: feature.iconUrl || feature.iconImageUrl,
              description: feature.description || '',
              popularity: feature.popularity,
              isMatched: feature.matched || false,
              quantity: feature.quantity
            })),
            standardFeatureList: roomProductStandardFeaturesFiltered?.map(
              (roomProductStandardFeature) => ({
                id: roomProductStandardFeature.standardFeature?.id,
                code: roomProductStandardFeature.standardFeature?.code,
                name: roomProductStandardFeature.standardFeature?.name,
                displayName: roomProductStandardFeature.standardFeature?.name,
                iconUrl: roomProductStandardFeature.standardFeature?.imageUrl || '',
                description: roomProductStandardFeature.standardFeature?.description || ''
              })
            ),
            restrictionList: this.mapRestrictionList(rfc.restrictionValidationList || [])
          };
        })
        .filter((item) => !!item);

      // Map availableRfcRatePlanList to sellableOptionList
      const sellableOptionList = (option.availableRfcRatePlanList || []).map((rfcRatePlan: any) => {
        // Find beneficial policy and payment term by ratePlanId (matching Java logic lines 1157-1162)
        const beneficialCxlPolicy = beneficialCxlPolicies.find(
          (item) => item.ratePlanId === rfcRatePlan.ratePlan?.id
        );
        const beneficialPaymentTerm = beneficialPaymentTerms.find(
          (item) => item.ratePlanId === rfcRatePlan.ratePlan?.id
        );

        return {
          roomProductId: rfcRatePlan.roomProductId || '',
          roomProductCode: rfcRatePlan.roomProductCode || '',
          salesPlanId: rfcRatePlan.ratePlan?.id || '',
          salesPlanCode: rfcRatePlan.ratePlan?.code || '',
          salesPlanName: rfcRatePlan.ratePlan?.name || '',
          salesPlanDescription: rfcRatePlan.ratePlan?.description || '',
          roomProductSalesPlanId: rfcRatePlan.id || '',
          roomProductSalesPlanCode: rfcRatePlan.code || '',
          totalBaseAmount: rfcRatePlan.totalBaseAmount || 0,
          totalTaxAmount: rfcRatePlan.totalTaxAmount || 0,
          totalCityTaxAmount: rfcRatePlan.totalCityTaxAmount || 0,
          totalGrossAmount: rfcRatePlan.totalGrossAmount || 0,
          totalSellingAmount: rfcRatePlan.totalSellingRate || 0,
          nightlySellingAmount: rfcRatePlan.averageDailyRate || 0,
          promoCode: rfcRatePlan.promoCode || null,
          // Get payment term and cancellation policy from beneficial data (matching Java logic line 1219-1220)
          paymentTerm: beneficialPaymentTerm?.hotelPaymentTerm?.description || '',
          cxlPolicy: beneficialCxlPolicy?.hotelCancellationPolicy?.description || '',
          includedServiceList: (rfcRatePlan.ratePlan?.includedHotelExtrasList || []).map(
            (service: any) => ({
              id: service.id,
              name: service.name,
              code: service.code,
              pricingUnit: service.pricingUnit || '',
              quantity: service.quantity || 1,
              includedDates: service.includedDates || []
            })
          ),
          restrictionList: this.mapRestrictionList(rfcRatePlan.restrictionValidationList || [])
        };
      });

      // Get room product level restrictions
      const restrictionList = this.mapRestrictionList(option.restrictionValidationList || []);

      return {
        label: option.label,
        roomProductList,
        sellableOptionList,
        restrictionList
      };
    });
  }

  /**
   * Maps restriction validation list to restriction DTO format
   * @private
   */
  private mapRestrictionList(restrictions: any[]): any[] {
    if (!restrictions || restrictions.length === 0) {
      return [];
    }

    return restrictions.map((restriction: any) => ({
      code: restriction.code,
      value: String(restriction.value || ''),
      fromDate: restriction.fromDate ? format(new Date(restriction.fromDate), DATE_FORMAT) : '',
      toDate: restriction.toDate ? format(new Date(restriction.toDate), DATE_FORMAT) : ''
    }));
  }

  async cppAssignRoomToProducts(
    input: CppAssignRoomToProductInputDto
  ): Promise<CppAssignRoomToProductResponseDto> {
    // Step 1: Validate property exists (matching Java lines 697-703)
    const hotel = await this.hotelRepository.getHotelByCode(input.propertyCode);
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    // Step 2: Validate request list (matching Java lines 704-710)
    if (!input.requestList || input.requestList.length === 0) {
      throw new BadRequestException('Request list is required');
    }

    const propertyId = hotel.id;
    const excludedList = input.excludedList || [];

    // Step 3: Process each request to assign rooms
    const responseData: CppAssignRoomToProductDto[] = [];

    for (const request of input.requestList) {
      // Get room product
      const roomProduct = await this.roomProductEntityRepository.findOne({
        where: { id: request.roomProductId, hotelId: propertyId }
      });

      if (!roomProduct) {
        // Matching Java logic line 729-733: if assignment fails, return ERROR immediately
        throw new NotFoundException(`Room product not found for id: ${request.roomProductId}`);
      }

      // Get available units for this room product (matching Java logic lines 739-750)
      const availableRooms = await this.roomUnitRepository.getAvailableRoomUnits(
        propertyId,
        roomProduct.id,
        format(toZonedTime(request.arrival, hotel.timeZone), DATE_FORMAT),
        format(toZonedTime(request.departure, hotel.timeZone), DATE_FORMAT)
      );

      if (!availableRooms || availableRooms.length === 0) {
        // Matching Java logic line 729-733: if no rooms available, return ERROR immediately
        throw new BadRequestException('Room not available');
      }

      // Filter out excluded rooms (matching Java logic lines 721-726)
      const filteredRooms = availableRooms.filter((room) => {
        return !excludedList.some(
          (excluded) =>
            excluded.roomId === room.id &&
            excluded.arrival === request.arrival &&
            excluded.departure === request.departure
        );
      });

      if (filteredRooms.length === 0) {
        // All available rooms are excluded
        throw new BadRequestException('All available rooms are excluded');
      }

      // Assign the first available room (matching Java logic lines 752-766)
      const assignedRoom = filteredRooms[0];
      const assignedRoomList: CppAssignRoomToProductRoomDto[] = [
        {
          assignedRoomId: assignedRoom.id,
          assignedRoomNumber: assignedRoom.roomNumber || ''
        }
      ];

      responseData.push({
        id: request.id,
        roomProductId: request.roomProductId,
        arrival: request.arrival,
        departure: request.departure,
        assignedStatus: CppAssignRoomToProductAssignedStatus.ASSIGNED,
        assignedRoomList,
        message: undefined
      });
    }

    // Return success response (matching Java lines 768-772)
    // Only reach here if ALL assignments succeeded
    return {
      code: 'PLATFORM_MODULE-CALL_PRO_PLUS-201',
      message: 'Complete Assigning Process',
      status: 'SUCCESS',
      dataList: responseData
    };
  }
}
