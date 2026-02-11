import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { LogPerformance } from '@src/core/decorators/execution-time.decorator';
import { HotelPricingDecimalRoundingRuleDto } from '@src/core/dtos/hotel-pricing-decimal-rounding-rule.dto';
import { HotelAgeCategory } from '@src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCityTaxAgeGroup } from '@src/core/entities/hotel-entities/hotel-city-tax-age-group.entity';
import { HotelCityTax } from '@src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import {
  CityTaxStatusEnum,
  CityTaxUnitEnum,
  RatePlanExtraServiceType,
  RatePlanTypeEnum,
  RoomProductExtraType,
  RoundingModeEnum
} from '@src/core/enums/common';
import { CalculateAmenityPricingService } from '@src/modules/hotel/services/calculate-amenity-pricing.service';
import { RatePlanHotelExtrasDailyDto } from '@src/modules/rate-plan-settings/dtos/rate-plan-hotel-extras-daily.dto';
import { RatePlanSettingsService } from '@src/modules/rate-plan-settings/services/rate-plan-settings.service';
import { In, Repository } from 'typeorm';
import { CalculatedCityTaxBreakdownDto } from './city-tax/calculate-city-tax.dto';
import { CityTaxCalculateService } from './city-tax/city-tax-calculate.service';
import { CalculateAmenityPriceInput } from './dtos/amentity-calculate.dto';
import { CalculateExtraBedInput, CalculateExtraBedResult } from './dtos/calculate-extra-bed.dto';
import { ExtraBedCalculateService } from './services/extra-bed.service';
import {
  CalculateExtraOccupancySurchargeInput,
  DailyExtraOccupancyRateDto,
  ExtraOccupancySurchargePriceDto,
  OccupancySurchargeCalculateService
} from './services/occupancy-surcharge​-calculate.service';

export type RoomProductDailySellingPriceCalculatedDto = RoomProductDailySellingPrice & {
  occupancySurcharge: number;
  cityTaxAmount: number;
  cityTaxAmountBeforeAdjustment: number;
  extraBedAmount: number;
  cityTaxBreakdowns: CalculatedCityTaxBreakdownDto[];
  hotelAmenityPrices: HotelAmenityPriceCalculatedDto[];
};

export type HotelAmenityPriceCalculatedDto = HotelAmenity & {
  amount: number;
};

type PricingCalculateInput = {
  fromDate: string;
  toDate: string;
  adults: number;
  childrenAges: number[];
  taxSettings: HotelTaxSetting[];
  pets: number;
  hotel: Hotel;
  hotelAmenities?: (HotelAmenity & { count: number })[]; // relation: hotelAmenityPrices
  roomProductDailySellingPrices: RoomProductDailySellingPrice[];
  isIncludeCityTax: boolean;
  isIncludeOccupancySurcharge: boolean;
  isIncludeExtraBed: boolean;
  isIncludeService: boolean;
  ratePlanTypes?: RatePlanTypeEnum[];
  hotelConfigRoundingMode?: HotelPricingDecimalRoundingRuleDto;
  extraTypes?: RoomProductExtraType[];
};

type RoomProductId = string;
type RatePlanId = string;
type RoomProductMap = Map<RoomProductId, RoomProduct>;
type RatePlanMap = Map<RatePlanId, RatePlan>;
type RatePlanExtraServiceMap = Map<RatePlanId, RatePlanExtraService[]>;
type RoomProductExtraMap = Map<RoomProductId, RoomProductExtra[]>;
type DateString = string;
type RatePlanHotelExtrasDailyMap = Map<
  `${RatePlanId}_${DateString}`,
  RatePlanHotelExtrasDailyDto[]
>;
type RoomProductDailySellingPriceMap = Map<RoomProductId, RoomProductDailySellingPrice[]>;
type OccupancySurchargeMap = Map<
  `${RatePlanId}_${RoomProductId}_${DateString}`,
  ExtraOccupancySurchargePriceDto
>;

type PreComputeOptimizedData = {
  roomProductDailySellingPrices: RoomProductDailySellingPrice[];
  roomProducts: RoomProduct[];
  ratePlans: RatePlan[];
  roomProductExtras: RoomProductExtra[];
  ratePlanExtras: RatePlanExtraService[];
  roomProductRatePlans: RoomProductRatePlan[];
  allHotelAmenities: HotelAmenity[];
  hotelCityTaxes: HotelCityTax[];
  dailyExtraOccupancyRates: DailyExtraOccupancyRateDto[];
  includedService: HotelAmenity[];
  ratePlanHotelExtrasDailyList: RatePlanHotelExtrasDailyDto[];
  occupancySurcharges: ExtraOccupancySurchargePriceDto[];
};

// type PricingCalculateV2Input = {
//   fromDate: string; // date: format: yyyy-mm-dd
//   toDate: string; // date: format: yyyy-mm-dd
//   adults: number; // number of adults
//   childrenAges: number[]; // list of children ages
//   pets: number;
//   hotel: Hotel;
//   hotelTaxSettings: HotelTaxSetting[]; // tax settings query by hotel_id
//   hotelAmenities?: (HotelAmenity & { count: number })[]; // relation: hotelAmenityPrices query by hotel_id
//   roomProductDailySellingPrices: RoomProductDailySellingPrice[];
//   includedAmenities: HotelAmenity[]; // combine from [rate plan extras + room product extras] include price also
//   roundingConfig: { roundingMode: RoundingModeEnum; decimalPlaces: number }; // of hotel or rateplan

//   // isIncludeCityTax: boolean;
//   // isIncludeOccupancySurcharge: boolean;
//   // isIncludeExtraBed: boolean;
//   // isIncludeService: boolean;
// };

export type PricingCalculateResult = {
  roomProductDailySellingPrices: RoomProductDailySellingPriceCalculatedDto[];
  occupancySurcharges: ExtraOccupancySurchargePriceDto[];
  totalCityTaxAmount: number;
  totalExtraBedAmount: number;
  totalCityTaxAmountBeforeAdjustment: number;
  hotelAmenityPrices: (HotelAmenityPriceCalculatedDto & { date: string })[];
};

@Injectable()
export class PricingCalculateService {
  constructor(
    private readonly cityTaxCalculateService: CityTaxCalculateService,
    private readonly occupancySurchargeCalculateService: OccupancySurchargeCalculateService,
    private readonly calculateAmenityPricingService: CalculateAmenityPricingService,
    private readonly extraBedCalculateService: ExtraBedCalculateService,
    private readonly ratePlanSettingsService: RatePlanSettingsService,
    @InjectRepository(RoomProductRatePlan, DbName.Postgres)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,

    @InjectRepository(HotelCityTax, DbName.Postgres)
    private readonly hotelCityTaxRepository: Repository<HotelCityTax>,

    @InjectRepository(HotelCityTaxAgeGroup, DbName.Postgres)
    private readonly hotelCityTaxAgeGroupRepository: Repository<HotelCityTaxAgeGroup>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(HotelAmenity, DbName.Postgres)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(RoomProductExtra, DbName.Postgres)
    private readonly roomProductExtraRepository: Repository<RoomProductExtra>,

    @InjectRepository(RatePlanDerivedSetting, DbName.Postgres)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>
  ) {}

  async calculateBookingAmenityPrices(
    input: CalculateAmenityPriceInput
  ): Promise<HotelAmenityPriceCalculatedDto[]> {
    const {
      hotelAmenityWithCounts,
      taxSettings,
      hotelAmenityPrices,
      hotel,
      fromDate,
      toDate,
      adult,
      childrenAges,
      pets,
      hotelConfigRoundingMode,
      serviceChargeRate = 0,
      serviceChargeTaxRate = 0
    } = input;

    const result: HotelAmenityPriceCalculatedDto[] = [];
    for (const hotelAmenity of hotelAmenityWithCounts) {
      const taxSettingsForAmenity = taxSettings.filter((t) => t.serviceCode === hotelAmenity.code);

      const amenityPricesForAmenity = hotelAmenityPrices.filter(
        (a) => a.hotelAmenityId === hotelAmenity.id
      );

      // const fromDate = format(Helper.parseDateToUTC(reservation.arrival), DATE_FORMAT);
      // const toDate = format(subDays(Helper.parseDateToUTC(reservation.departure), 1), DATE_FORMAT);
      const calculatedAmenity = await this.calculateAmenityPricingService.calculatePricingAmenity(
        {
          hotel,
          hotelAmenity: {
            ...hotelAmenity,
            hotelAmenityPrices: amenityPricesForAmenity,
            count: hotelAmenity.count,
            taxSettingList: taxSettingsForAmenity
          },
          fromDate: fromDate,
          toDate: toDate,
          taxSettingList: taxSettingsForAmenity,
          serviceChargeRate,
          serviceChargeTaxRate,
          adult: adult,
          childrenAgeList: childrenAges,
          allocatedPets: pets
        },
        {
          roundingMode: hotelConfigRoundingMode?.roundingMode || RoundingModeEnum.HALF_ROUND_UP,
          decimalPlaces: hotelConfigRoundingMode?.decimalUnits || 6
        }
      );

      result.push({
        ...calculatedAmenity,
        amount: Number(calculatedAmenity.totalGrossAmount) || 0
      });
    }

    return result;
  }

  calculateOccupancySurcharge(
    input: CalculateExtraOccupancySurchargeInput
  ): ExtraOccupancySurchargePriceDto[] {
    return this.occupancySurchargeCalculateService.calculateExtraOccupancySurcharge(input);
  }

  calculateExtraBed(input: CalculateExtraBedInput): CalculateExtraBedResult {
    return this.extraBedCalculateService.calculateExtraBed(input);
  }

  /**
   * Process a single daily selling price item
   * Extracted for batch processing
   * @private
   */
  private async processSingleDailySellingPrice(
    roomProductDailySellingPrice: RoomProductDailySellingPrice,
    context: {
      roomProduct: RoomProduct;
      extraBedAmount: number;
      hotelCityTaxes: HotelCityTax[];
      countOnceCityTaxType: Map<CityTaxUnitEnum, boolean>;
      adults: number;
      childrenAges: number[];
      pets: number;
      hotel: Hotel;
      taxSettings: HotelTaxSetting[];
      isIncludeCityTax: boolean;
      isIncludeService: boolean;
      roomProductExtrasMap: Map<string, RoomProductExtra[]>;
      ratePlanHotelExtrasDailyMap: Map<string, RatePlanHotelExtrasDailyDto[]>;
      ratePlanMap: Map<string, RatePlan>;
      occupancySurchargeMap: Map<string, ExtraOccupancySurchargePriceDto>;
      allHotelAmenities: HotelAmenity[];
      hotelCityTaxAgeGroups: HotelCityTaxAgeGroup[];
    }
  ): Promise<{
    calculatedPrice: RoomProductDailySellingPriceCalculatedDto;
    cityTaxAmount: number;
    cityTaxAmountBeforeAdjustment: number;
    hotelAmenityPricesWithDate: (HotelAmenityPriceCalculatedDto & { date: string })[];
  }> {
    const {
      roomProduct,
      extraBedAmount,
      hotelCityTaxes,
      hotelCityTaxAgeGroups,
      countOnceCityTaxType,
      adults,
      childrenAges,
      pets,
      hotel,
      taxSettings,
      isIncludeCityTax,
      isIncludeService,
      roomProductExtrasMap,
      ratePlanHotelExtrasDailyMap,
      ratePlanMap,
      occupancySurchargeMap,
      allHotelAmenities
    } = context;

    const occupancySurcharge = occupancySurchargeMap.get(
      `${roomProductDailySellingPrice.ratePlanId}_${roomProductDailySellingPrice.roomProductId}_${roomProductDailySellingPrice.date}`
    );

    const cityTaxResult = this.calculateCityTaxForDailyPrice(
      isIncludeCityTax,
      roomProductDailySellingPrice,
      roomProduct,
      hotelCityTaxes,
      hotelCityTaxAgeGroups,
      // countOnceCityTaxType,
      adults,
      childrenAges
    );

    let hotelAmenityPrices: HotelAmenityPriceCalculatedDto[] = [];
    if (isIncludeService) {
      const filteredRoomProductExtras =
        roomProductExtrasMap.get(roomProductDailySellingPrice.roomProductId) || [];

      const filteredRatePlanHotelExtrasDailyList =
        ratePlanHotelExtrasDailyMap.get(
          `${roomProductDailySellingPrice.ratePlanId}_${roomProductDailySellingPrice.date}`
        ) || [];

      const extraIds = [
        ...filteredRoomProductExtras.map((r) => r.extrasId),
        ...filteredRatePlanHotelExtrasDailyList.flatMap((r) => r.hotelExtrasList.map((h) => h.id))
      ];

      const filteredIncludedService = allHotelAmenities.filter((h) => extraIds.includes(h.id));

      const rateplan = ratePlanMap.get(roomProductDailySellingPrice.ratePlanId);
      hotelAmenityPrices =await this.calculateBookingAmenityPrices({
        hotelAmenityWithCounts: filteredIncludedService.map((h) => ({ ...h, count: 1 })),
        hotelAmenityPrices: filteredIncludedService.map((h) => h.hotelAmenityPrices).flat(),
        hotel: hotel,
        taxSettings: taxSettings,
        fromDate: roomProductDailySellingPrice.date,
        toDate: roomProductDailySellingPrice.date,
        adult: adults,
        childrenAges: childrenAges,
        pets: pets,
        hotelConfigRoundingMode: {
          roundingMode: rateplan?.roundingMode ?? RoundingModeEnum.UP,
          decimalUnits: 2
        },
        serviceChargeRate: 0,
        serviceChargeTaxRate: 0
      });
    }

    const calculatedPrice: RoomProductDailySellingPriceCalculatedDto = {
      ...roomProductDailySellingPrice,
      occupancySurcharge: occupancySurcharge?.extraOccupancySurcharge ?? 0,
      cityTaxAmount: cityTaxResult.cityTaxAmount,
      cityTaxAmountBeforeAdjustment: cityTaxResult.cityTaxAmountBeforeAdjustment,
      cityTaxBreakdowns: cityTaxResult.cityTaxBreakdownForOnce,
      extraBedAmount: extraBedAmount,
      hotelAmenityPrices: hotelAmenityPrices
    };

    return {
      calculatedPrice,
      cityTaxAmount: cityTaxResult.cityTaxAmount,
      cityTaxAmountBeforeAdjustment: cityTaxResult.cityTaxAmountBeforeAdjustment,
      hotelAmenityPricesWithDate: hotelAmenityPrices.map((h) => ({
        ...h,
        date: roomProductDailySellingPrice.date
      }))
    };
  }

  /**
   * Calculate city tax for a specific room product daily selling price
   * @private
   */
  private calculateCityTaxForDailyPrice(
    isIncludeCityTax: boolean,
    roomProductDailySellingPrice: RoomProductDailySellingPrice,
    roomProduct: RoomProduct,
    hotelCityTaxes: HotelCityTax[],
    hotelCityTaxAgeGroups: HotelCityTaxAgeGroup[],
    // countOnceCityTaxType: Map<CityTaxUnitEnum, boolean>,
    adults: number,
    childrenAges: number[]
  ): {
    cityTaxAmount: number;
    cityTaxAmountBeforeAdjustment: number;
    cityTaxBreakdownForOnce: CalculatedCityTaxBreakdownDto[];
  } {
    const onceCityTaxType = [
      CityTaxUnitEnum.PERCENTAGE_ON_GROSS_AMOUNT_ROOM,
      CityTaxUnitEnum.PERCENTAGE_ON_NET_AMOUNT_ROOM,
      CityTaxUnitEnum.PER_PERSON_PER_STAY_FIXED,
      CityTaxUnitEnum.FIXED_ON_GROSS_AMOUNT_ROOM
    ];
    const countOnceCityTaxTypeMap = new Map<CityTaxUnitEnum, boolean>([
      // [CityTaxUnitEnum.PER_PERSON_PER_NIGHT, false],
      // CityTaxUnitEnum.PER_PERSON_PER_STAY_PERCENTAGE,
    ]);

    // TODO city tax
    if (!isIncludeCityTax) {
      return {
        cityTaxAmount: 0,
        cityTaxAmountBeforeAdjustment: 0,
        cityTaxBreakdownForOnce: []
      };
    }
    const appliedCityTaxList = this.cityTaxCalculateService.getHotelCityTaxInRange(
      hotelCityTaxes,
      roomProductDailySellingPrice.date,
      roomProductDailySellingPrice.date
    );

    const uniqueCityTaxList: HotelCityTax[] = [];

    for (const cityTax of appliedCityTaxList) {
      if (onceCityTaxType.includes(cityTax.unit)) {
        const hasCountOnce = countOnceCityTaxTypeMap.get(cityTax.unit);
        if (!hasCountOnce) {
          uniqueCityTaxList.push(cityTax);
          countOnceCityTaxTypeMap.set(cityTax.unit, true);
        }
      } else {
        uniqueCityTaxList.push(cityTax);
      }
    }

    if (!appliedCityTaxList.length) {
      return {
        cityTaxAmount: 0,
        cityTaxAmountBeforeAdjustment: 0,
        cityTaxBreakdownForOnce: []
      };
    }

    const cityTaxBreakdowns = this.cityTaxCalculateService.calculateAllCityTaxForRange({
      adults: adults,
      childrenAgeList: childrenAges,
      totalRooms: roomProduct?.roomProductAssignedUnits?.length ?? 0,
      hotelCityTaxList: uniqueCityTaxList || [],
      fromDate: roomProductDailySellingPrice.date,
      toDate: roomProductDailySellingPrice.date,
      defaultPriceBeforeHotelTax: roomProductDailySellingPrice.netPrice,
      defaultPriceAfterHotelTax: roomProductDailySellingPrice.grossPrice,
      defaultPriceBeforeHotelTaxBeforeAdjustment:
        roomProductDailySellingPrice.netPrice -
        Number(roomProductDailySellingPrice.ratePlanAdjustments || 0),
      defaultPriceAfterHotelTaxBeforeAdjustment:
        roomProductDailySellingPrice.grossPrice -
        Number(roomProductDailySellingPrice.ratePlanAdjustments || 0),
      prices: [
        {
          date: roomProductDailySellingPrice.date,
          priceBeforeHotelTaxBeforeAdjustment:
            roomProductDailySellingPrice.netPrice -
            Number(roomProductDailySellingPrice.ratePlanAdjustments || 0),
          priceAfterHotelTaxBeforeAdjustment:
            roomProductDailySellingPrice.grossPrice -
            Number(roomProductDailySellingPrice.ratePlanAdjustments || 0),
          priceBeforeHotelTax: roomProductDailySellingPrice.netPrice,
          priceAfterHotelTax: roomProductDailySellingPrice.grossPrice
        }
      ],
      hotelCityTaxAgeGroups: hotelCityTaxAgeGroups
    });

    const cityTaxAmount = cityTaxBreakdowns.reduce((acc, curr) => acc + curr.taxAmount, 0);
    const cityTaxAmountBeforeAdjustment = cityTaxBreakdowns.reduce(
      (acc, curr) => acc + curr.taxAmountBeforeAdjustment,
      0
    );

    return {
      cityTaxAmount,
      cityTaxAmountBeforeAdjustment,
      cityTaxBreakdownForOnce: cityTaxBreakdowns
    };
  }

  /**
   * Calculate with batch processing for better performance
   * Processes multiple daily selling prices concurrently in batches
   */
  @LogPerformance({
    loggerName: 'PricingCalculateService.calculateWithBatch',
    logLevel: 'log',
    slowThreshold: 2000,
    includeArgs: false
  })
  async calculateWithBatch(
    input: PricingCalculateInput,
    batchSize: number = 50
  ): Promise<PricingCalculateResult> {
    const {
      fromDate,
      toDate,
      adults,
      childrenAges,
      pets,
      hotel,
      taxSettings,
      roomProductDailySellingPrices,
      isIncludeCityTax,
      isIncludeOccupancySurcharge,
      isIncludeExtraBed,
      isIncludeService,
      extraTypes
    } = input;

    // Fetch all data once
    const {
      roomProductMap,
      ratePlanMap,
      roomProductExtrasMap,
      ratePlanHotelExtrasDailyMap,
      roomProductDailySellingPriceMap,
      occupancySurchargeMap,
      allHotelAmenities,
      hotelCityTaxes,
      hotelCityTaxAgeGroups
    } = await this.fetchAllPricingData(input);

    const countOnceCityTaxType = new Map<CityTaxUnitEnum, boolean>([
      // [CityTaxUnitEnum.PER_PERSON_PER_NIGHT, false],
      [CityTaxUnitEnum.FIXED_ON_GROSS_AMOUNT_ROOM, false]
    ]);

    // Calculate extra bed amounts for all room products (fast operation)
    const extraBedAmountMap = new Map<string, number>();
    if (isIncludeExtraBed) {
      for (const roomProduct of roomProductMap.values()) {
        const extraBed = this.extraBedCalculateService.calculateExtraBed({
          hotelAmenities: allHotelAmenities,
          roomProduct,
          adult: adults,
          childrenAges: childrenAges,
          pets: pets
        });
        extraBedAmountMap.set(roomProduct.id, extraBed.totalExtraBedRate);
      }
    }

    // Prepare processing context (shared across all items)
    const processingContext = {
      adults,
      childrenAges,
      pets,
      hotel,
      taxSettings,
      isIncludeCityTax,
      isIncludeService,
      roomProductExtrasMap,
      ratePlanHotelExtrasDailyMap,
      ratePlanMap,
      occupancySurchargeMap,
      hotelCityTaxes,
      hotelCityTaxAgeGroups,
      countOnceCityTaxType,
      allHotelAmenities
    };

    // Collect all items to process with their context
    interface ProcessingItem {
      roomProductDailySellingPrice: RoomProductDailySellingPrice;
      roomProduct: RoomProduct;
      extraBedAmount: number;
    }

    const itemsToProcess: ProcessingItem[] = [];
    for (const roomProduct of roomProductMap.values()) {
      const dailyPrices = roomProductDailySellingPriceMap.get(roomProduct.id) || [];
      const extraBedAmount = extraBedAmountMap.get(roomProduct.id) || 0;

      for (const roomProductDailySellingPrice of dailyPrices) {
        itemsToProcess.push({
          roomProductDailySellingPrice,
          roomProduct,
          extraBedAmount
        });
      }
    }

    // Process in batches with Promise.all for concurrency
    const result: RoomProductDailySellingPriceCalculatedDto[] = [];
    let totalCityTaxAmount = 0;
    let totalCityTaxAmountBeforeAdjustment = 0;
    let totalExtraBedAmount = 0;
    const allHotelAmenityPrices: (HotelAmenityPriceCalculatedDto & { date: string })[] = [];

    // Process items in batches
    for (let i = 0; i < itemsToProcess.length; i += batchSize) {
      const batch = itemsToProcess.slice(i, i + batchSize);

      // Process batch concurrently
      const batchResults = await Promise.all(
        batch.map((item) =>
          this.processSingleDailySellingPrice(item.roomProductDailySellingPrice, {
            ...processingContext,
            roomProduct: item.roomProduct,
            extraBedAmount: item.extraBedAmount
          })
        )
      );

      // Aggregate results
      for (const batchResult of batchResults) {
        result.push(batchResult.calculatedPrice);
        totalCityTaxAmount += batchResult.cityTaxAmount;
        totalCityTaxAmountBeforeAdjustment += batchResult.cityTaxAmountBeforeAdjustment;
        allHotelAmenityPrices.push(...batchResult.hotelAmenityPricesWithDate);
      }
    }

    // Calculate total extra bed amount
    totalExtraBedAmount = Array.from(extraBedAmountMap.values()).reduce(
      (sum, amount) => sum + amount,
      0
    );

    return {
      roomProductDailySellingPrices: result,
      occupancySurcharges: Array.from(occupancySurchargeMap.values()),
      totalExtraBedAmount,
      totalCityTaxAmount,
      hotelAmenityPrices: allHotelAmenityPrices,
      totalCityTaxAmountBeforeAdjustment
    };
  }

  private async fetchAllPricingData(input: PricingCalculateInput) {
    const {
      fromDate,
      toDate,
      adults,
      childrenAges,
      pets,
      hotel,
      roomProductDailySellingPrices,
      isIncludeOccupancySurcharge,
      isIncludeService,
      ratePlanTypes,
      extraTypes
    } = input;

    // Use Set to get unique IDs (avoid duplicates)
    const ratePlanIds = [...new Set(roomProductDailySellingPrices.map((r) => r.ratePlanId))];
    const roomProductIds = [...new Set(roomProductDailySellingPrices.map((r) => r.roomProductId))];

    const ratePlans = await this.ratePlanRepository.find({
      where: {
        id: In(ratePlanIds),
        hotelId: hotel.id
      },
      select: {
        id: true,
        roundingMode: true,
        hotelId: true
      }
    });

    const ratePlanDerivedSettings = await this.ratePlanDerivedSettingRepository.find({
      where: {
        hotelId: hotel.id,
        ratePlanId: In(ratePlanIds),
        followDailyIncludedAmenity: true
      },
      select: {
        id: true,
        ratePlanId: true,
        derivedRatePlanId: true
      }
    });

    const masterRatePlanIds = ratePlanDerivedSettings.map((setting) => setting.derivedRatePlanId);

    // 🚀 OPTIMIZATION: Query everything in parallel (remove blocking query)
    const [
      roomProductRatePlans,
      roomProducts,
      allHotelAmenities,
      hotelCityTaxes,
      roomProductExtras,
      ratePlanHotelExtrasDailyList,
      ageCategories,
      hotelCityTaxAgeGroups
    ] = await Promise.all([
      // Query 1: Room Product Rate Plans
      this.roomProductRatePlanRepository.find({
        where: {
          hotelId: hotel.id,
          ratePlanId: In(ratePlanIds),
          roomProductId: In(roomProductIds)
        },
        select: {
          id: true,
          ratePlanId: true,
          roomProductId: true
        }
      }),

      // Query 2: Room Products (only needed fields)
      this.roomProductRepository.find({
        where: {
          id: In(roomProductIds),
          hotelId: hotel.id // Filter by hotel for security and performance
        },
        select: {
          id: true,
          capacityDefault: true,
          maximumAdult: true,
          maximumKid: true,
          maximumPet: true,
          capacityExtra: true,
          extraBedAdult: true,
          extraBedKid: true,
          roomProductAssignedUnits: {
            roomUnitId: true
          }
        },
        relations: {
          roomProductAssignedUnits: true
        }
      }),

      // Query 4: Hotel Amenities with Prices (combined query to avoid N+1)
      this.hotelAmenityRepository
        .createQueryBuilder('ha')
        .leftJoinAndSelect('ha.hotelAmenityPrices', 'hap')
        .leftJoinAndSelect('hap.hotelAgeCategory', 'hac')
        .where('ha.hotelId = :hotelId', { hotelId: hotel.id })
        .getMany(),

      // Query 5: Hotel City Taxes
      this.hotelCityTaxRepository.find({
        where: {
          hotelId: hotel.id,
          status: CityTaxStatusEnum.ACTIVE
        }
      }),

      // Query 6-8: Conditional queries (only fetch if needed)
      isIncludeService
        ? this.getRoomProductExtras(hotel.id, roomProductIds, true, extraTypes)
        : Promise.resolve([]),
      isIncludeService
        ? this.ratePlanSettingsService.getRatePlanHotelExtrasDailyList({
            hotelId: hotel.id,
            ratePlanIdList: ratePlanIds,
            fromDate: fromDate,
            toDate: toDate,
            types:
              extraTypes && extraTypes.length > 0
                ? (extraTypes as any[])
                : [RatePlanExtraServiceType.INCLUDED]
          })
        : Promise.resolve([]),
      // Query 7: Hotel Age Categories
      this.occupancySurchargeCalculateService.getAgeCategories(hotel.id),
      // Query 8: Hotel City Tax Age Groups
      this.hotelCityTaxAgeGroupRepository.find({
        where: {
          hotelId: hotel.id,

        }
      })
    ]);

    // Now fetch occupancy surcharge with IDs we got from roomProductRatePlans

    const occupancySurcharges = await this.calculateExtraOccupancySurcharge({
      roomProductRatePlans: roomProductRatePlans,
      fromDate: fromDate,
      toDate: toDate,
      adults: adults,
      childrenAges: childrenAges,
      isIncludeOccupancySurcharge: isIncludeOccupancySurcharge,
      ageCategories: ageCategories
    });

    const roomProductMap = new Map(roomProducts.map((rp) => [rp.id, rp]));
    const ratePlanMap = new Map(ratePlans.map((rp) => [rp.id, rp]));

    // Group room product extras by room product ID
    const roomProductExtrasMap: RoomProductExtraMap = new Map<RoomProductId, RoomProductExtra[]>();
    roomProductExtras.forEach((extra) => {
      if (!roomProductExtrasMap.has(extra.roomProductId)) {
        roomProductExtrasMap.set(extra.roomProductId, []);
      }
      roomProductExtrasMap.get(extra.roomProductId)!.push(extra);
    });

    // Group rate plan extras by rate plan ID

    const ratePlanHotelExtrasDailyMap: RatePlanHotelExtrasDailyMap = new Map<
      `${RatePlanId}_${DateString}`,
      RatePlanHotelExtrasDailyDto[]
    >();
    ratePlanHotelExtrasDailyList.forEach((extra) => {
      if (!ratePlanHotelExtrasDailyMap.has(`${extra.ratePlanId}_${extra.date}`)) {
        ratePlanHotelExtrasDailyMap.set(`${extra.ratePlanId}_${extra.date}`, []);
      }
      ratePlanHotelExtrasDailyMap.get(`${extra.ratePlanId}_${extra.date}`)!.push(extra);
    });

    const roomProductDailySellingPriceMap: RoomProductDailySellingPriceMap = new Map<
      RoomProductId,
      RoomProductDailySellingPrice[]
    >();
    roomProductDailySellingPrices.forEach((price) => {
      if (!roomProductDailySellingPriceMap.has(price.roomProductId)) {
        roomProductDailySellingPriceMap.set(price.roomProductId, []);
      }
      roomProductDailySellingPriceMap.get(price.roomProductId)!.push(price);
    });

    const occupancySurchargeMap: OccupancySurchargeMap = new Map<
      `${RatePlanId}_${RoomProductId}_${DateString}`,
      ExtraOccupancySurchargePriceDto
    >();

    occupancySurcharges.forEach((surcharge) => {
      occupancySurchargeMap.set(
        `${surcharge.ratePlanId}_${surcharge.roomProductId}_${surcharge.date}`,
        surcharge
      );
    });

    return {
      hotelCityTaxes,
      roomProductMap,
      ratePlanMap,
      roomProductExtrasMap,
      ratePlanHotelExtrasDailyMap,
      roomProductDailySellingPriceMap,
      occupancySurchargeMap,
      hotelCityTaxAgeGroups,
      allHotelAmenities
    };
  }

  private async getRoomProductExtras(
    hotelId: string,
    roomProductIds: string[],
    isIncludeService: boolean,
    extraTypes?: RoomProductExtraType[]
  ) {
    if (isIncludeService) {
      return await this.roomProductExtraRepository.find({
        where: {
          hotelId: hotelId,
          roomProductId: In(roomProductIds),
          type: extraTypes && extraTypes.length > 0 ? In(extraTypes) : RoomProductExtraType.INCLUDED
        }
      });
    }

    return [];
  }

  private async calculateExtraOccupancySurcharge(input: {
    roomProductRatePlans: RoomProductRatePlan[];
    fromDate: string;
    toDate: string;
    adults: number;
    childrenAges: number[];
    isIncludeOccupancySurcharge: boolean;
    ageCategories: HotelAgeCategory[];
  }): Promise<ExtraOccupancySurchargePriceDto[]> {
    const {
      roomProductRatePlans,
      fromDate,
      toDate,
      adults,
      childrenAges,
      isIncludeOccupancySurcharge,
      ageCategories
    } = input;

    if (isIncludeOccupancySurcharge) {
      const dailyExtraOccupancyRates =
        await this.occupancySurchargeCalculateService.getDailyOccupancySurchargeRate({
          roomProductRatePlans,
          fromDate: fromDate,
          toDate: toDate
        });

      const occupancySurcharges =
        dailyExtraOccupancyRates.length > 0
          ? this.occupancySurchargeCalculateService.calculateExtraOccupancySurcharge({
              fromDate: fromDate,
              toDate: toDate,
              roomProductRatePlans: roomProductRatePlans,
              rates: dailyExtraOccupancyRates,
              adults: adults,
              childrenAges: childrenAges,
              ageCategories: ageCategories
            })
          : [];

      return occupancySurcharges;
    }

    return [];
  }
}
