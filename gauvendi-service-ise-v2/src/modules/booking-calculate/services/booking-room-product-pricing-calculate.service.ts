import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { differenceInDays } from 'date-fns';
import Decimal from 'decimal.js';
import { DB_NAME } from 'src/core/constants/db.const';
import { LogPerformance } from 'src/core/decorators/execution-time.decorator';
import {
  HotelAgeCategory,
  HotelAgeCategoryCodeEnum
} from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import {
  AmenityTypeEnum,
  HotelAmenity,
  IsePricingDisplayModeEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel, TaxSettingEnum } from 'src/core/entities/hotel-entities/hotel.entity';
import { RatePlanExtraServiceType } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import {
  RatePlan,
  RatePlanPricingMethodologyEnum,
  RoundingModeEnum
} from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { Helper } from 'src/core/helper/utils';
import { CalculateAllocateCapacityResult } from 'src/core/services/calculate-allocation.service';
import { groupByToMapSingle } from 'src/core/utils/group-by.util';
import {
  EXTRA_BED_ADULT_AMENITY_CODE,
  EXTRA_BED_KID_AMENITY_CODE,
  HotelAmenityService,
  PET_AMENITY_CODE
} from 'src/modules/hotel-amenity/services/hotel-amenity.service';
import { In, Not, Repository } from 'typeorm';
import { BookingAmenityCalculateService } from '../../../core/modules/amenity-calculate/amenity-calculate.service';
import {
  AmenityWithType,
  BookingHotelAmenityService
} from '../../../core/modules/amenity-calculate/booking-hotel-amentity.service';
import { RoomProductDailySellingPriceRepository } from '../../room-product-daily-selling-price/room-product-daily-selling-price.repository';
import { CalculateRoomProductPricingInputDto } from './../dtos/calculate-room-product-pricing-input.dto';
import { DailySellingRateDto } from './../dtos/daily-selling-rate.dto';
import { HotelPricingDecimalRoundingRuleDto } from './../dtos/hotel-pricing-decimal-rounding-rule.dto';
import { AmenityPricingDto, RoomProductSalesPlanDto } from './../dtos/reservation-pricing.dto';
import { BookingCityTaxCalculateService } from './../services/booking-city-tax-calculate.service';
import { OccupancySurchargeCalculateService } from './occupancy-surcharge​-calculate.service';

const SERVICE_CHARGE_TAX_SERVICE_CODE = 'SERVICE_CHARGE_TAX';
const SalesPlanAdjustmentScaleValue = 4;

type DateString = string;
type GuestCount = number;
type ExtraOccupancySurcharge = number;

type CalculateExtraOccupancySurchargeInput = {
  hotel: Hotel;
  ratePlans: RatePlan[];
  roomProductRatePlans: RoomProductRatePlan[];
  allRoomProductDailySellingPrices: RoomProductDailySellingPrice[];
  serviceChargeRate: number;
  serviceChargeTaxRate: number;
  fromDate: string;
  toDate: string;
  pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
  childrenAges: number[];
  adults: number;
  ageCategories: HotelAgeCategory[];
};

export type LinkedAmenityDto = {
  code: string;
  quantity: number;
};

export interface GetIncludedServicePriceMapOptions {
  petAmenityCode?: string; // default: 'PET'
}

@Injectable()
export class RoomProductPricingCalculateService {
  constructor(
    @InjectRepository(RoomProductRatePlan, DB_NAME.POSTGRES)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,
    private readonly roomProductDailySellingPriceRepository: RoomProductDailySellingPriceRepository,
    private readonly bookingAmenityCalculateService: BookingAmenityCalculateService,
    private readonly hotelAmenityService: HotelAmenityService,
    private readonly cityTaxService: BookingCityTaxCalculateService,
    private readonly bookingHotelAmenityService: BookingHotelAmenityService,
    private readonly occupancySurchargeCalculateService: OccupancySurchargeCalculateService,
    @InjectRepository(HotelAgeCategory, DB_NAME.POSTGRES)
    private readonly hotelAgeCategoryRepository: Repository<HotelAgeCategory>
  ) {}

  @LogPerformance({ loggerName: 'RoomProductPricingCalculateService' })
  async calculateRoomProductPricing(input: CalculateRoomProductPricingInputDto) {
    const {
      ratePlans,
      roomProducts,
      serviceChargeRate,
      serviceChargeTaxRate,
      hotelAmenities,
      hotelAmenityPrices,
      taxSettingList,
      fromDate, // inclusive yyyy-mm-dd
      toDate, // inclusive yyyy-mm-dd
      pricingDecimalRoundingRule,
      hotel,
      adult,
      childrenAges,
      amenityList,
      hotelCityTaxList,
      hotelCityTaxAgeGroups,
      pets,
      isCalculateCityTax,
      bookingRatePlanAmenities,
      bookingRoomProductAmenities
    } = input;
    const ratePlanIds = ratePlans.map((r) => r.id);
    const roomProductIds = roomProducts.map((r) => r.id);

    // // get all hotel amenities
    // const hotelAmenities = await this.hotelAmenityRepository.findAll(
    //   {
    //     hotelId: hotel.id
    //   },
    //   undefined,
    //   {
    //     hotelAmenityPrices: {
    //       hotelAgeCategory: true
    //     }
    //   }
    // );

    // add tax setting list to hotel amenities
    const hotelAmenitiesWithTax = hotelAmenities.map((s) => {
      const amenityPrices = hotelAmenityPrices.filter((price) => price.hotelAmenityId === s.id);
      return {
        ...s,
        taxSettingList: taxSettingList.extrasTaxes.filter((t) => t.serviceCode === s.code),
        hotelAmenityPrices: amenityPrices
      };
    });

    const los = differenceInDays(toDate, fromDate) + 1;
    // return this.hotelConfigurationRepository.getHotelCoCalculateRoomProductPricingInputDtonfigurationByTypes(input);

    const [roomProductRatePlans, allRoomProductDailySellingPrices, ageCategories] =
      await Promise.all([
        this.roomProductRatePlanRepository.find({
          where: [
            {
              hotelId: hotel.id,
              roomProductId: In(roomProductIds),
              ratePlanId: In(ratePlanIds)
            }
          ]
        }),
        this.roomProductDailySellingPriceRepository.findAll({
          hotelId: hotel.id,
          roomProductIds: roomProductIds,
          ratePlanIds: ratePlanIds,
          fromDate: fromDate,
          toDate: toDate
        }),
        this.hotelAgeCategoryRepository.find({
          where: {
            hotelId: hotel.id,
            isIncludeExtraOccupancyRate: true,
            code: Not(HotelAgeCategoryCodeEnum.DEFAULT)
          }
        })
      ]);

    const roomProductRatePlanPricings = await this.calculateExtraOccupancySurcharge({
      hotel,
      ratePlans: ratePlans,
      allRoomProductDailySellingPrices,
      pricingDecimalRoundingRule,
      roomProductRatePlans,
      fromDate: fromDate,
      toDate: toDate,
      adults: adult ?? 0,
      childrenAges: childrenAges || [],
      ageCategories: ageCategories,
      serviceChargeRate: 0, // TODO Booking Calculate: Check if this is correct
      serviceChargeTaxRate: 0 // TODO Booking Calculate: Check if this is correct
    });

    // const roomProductRatePlanResults = new Map<
    //   `${RoomProduct['id']}-${RatePlan['id']}`,
    //   {
    //     roomProductRatePlanId: string;
    //     ratePlanId: string;
    //     roomProductId: string;
    //     dailySellingRateList: DailySellingRateDto[];
    //     totalNetPrice: number;
    //     totalGrossPrice: number;
    //     averageDailyRate: number;
    //     dailyPricesCount: number;
    //   }
    // >();

    const result: RoomProductSalesPlanDto[] = [];
    const amenityPricingList: AmenityPricingDto[] = [];
    for (const roomProductInput of input.roomProductInputs || []) {
      const roomProduct = roomProducts.find((r) => r.id === roomProductInput.id);
      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }

      const totalRoom = this.cityTaxService.getTotalRoom(
        roomProduct.rfcAllocationSetting,
        roomProduct.roomProductAssignedUnits.length
      );

      const surchargeAmenities = this.hotelAmenityService.getAllowSurchargeAmenities(
        hotelAmenitiesWithTax,
        {
          allocatedAdultCount: roomProductInput.allocatedAdultCount ?? 0,
          allocatedChildCount: roomProductInput.allocatedChildCount ?? 0,
          allocatedExtraBedAdultCount: roomProductInput.allocatedExtraBedAdultCount ?? 0,
          allocatedExtraBedChildCount: roomProductInput.allocatedExtraBedChildCount ?? 0,
          allocatedPetCount: roomProductInput.allocatedPetCount ?? 0
        }
      );

      const surchargeAmenityIds = surchargeAmenities.map((s) => s.id);
      const surchargeAmenityPrices = hotelAmenityPrices.filter((price) =>
        surchargeAmenityIds.includes(price.hotelAmenityId)
      );
      const surchargeAmenityPricingList =
        await this.bookingAmenityCalculateService.calculateSurchargeAmenityPrices({
          hotel,
          hotelAmenityPrices: surchargeAmenityPrices,

          childrenAgeList: childrenAges || [],
          extraServices: surchargeAmenities,
          fromDate: fromDate,
          toDate: toDate,
          taxSettings: taxSettingList.extrasTaxes,
          serviceChargeRate: serviceChargeRate,
          serviceChargeTaxRate: serviceChargeTaxRate,
          pricingDecimalRoundingRule,
          calculateAllocateCapacityResult: {
            allocatedAdultCount: roomProductInput.allocatedAdultCount ?? 0,
            allocatedChildCount: roomProductInput.allocatedChildCount ?? 0,
            allocatedExtraBedAdultCount: roomProductInput.allocatedExtraBedAdultCount ?? 0,
            allocatedExtraBedChildCount: roomProductInput.allocatedExtraBedChildCount ?? 0,
            allocatedPetCount: roomProductInput.allocatedPetCount ?? 0
          }
        });

      const roomProductRatePlansInRoomProduct = roomProductRatePlans.filter(
        (r) => r.roomProductId === roomProduct.id
      );

      for (const roomProductRatePlan of roomProductRatePlansInRoomProduct) {
        const ratePlan = ratePlans.find((r) => r.id === roomProductRatePlan.ratePlanId);

        if (!ratePlan) {
          throw new BadRequestException('rate plan not found');
        }

        const dto: RoomProductSalesPlanDto = {
          ...roomProductRatePlan,
          rfcId: roomProductRatePlan.roomProductId,
          totalSellingRate: 0,
          totalBaseAmount: 0,
          totalGrossAmount: 0,
          taxAmount: 0,
          averageDailyRate: 0,
          // dailySellingRateList: [],

          dailyRoomRateList: [],
          serviceChargeAmount: 0,
          ratePlan: {
            ...ratePlan,
            id: ratePlan?.id || '',
            code: ratePlan?.code || '',
            name: ratePlan?.name || '',
            hotelExtrasCodeList: [],
            payAtHotel: false,
            payOnConfirmation: false,
            description: roomProductRatePlan.ratePlan?.description || '',
            includedHotelExtrasList: []
          }
        };

        const dailySellingRates = roomProductRatePlanPricings
          .filter(
            (r) =>
              r.ratePlanId === roomProductRatePlan.ratePlanId &&
              r.roomProductId === roomProductRatePlan.roomProductId &&
              r.roomProductRatePlanId === roomProductRatePlan.id
          )
          .flatMap((r) => r.dailySellingRateList);

        // calculate extra service price and tax (not included service)
        // let taxAmount = 0;

        const { addOnAmenityPricingList, mandatoryAmenityPricingList, includedAmenityPricingList } =
          await this.calculateExtraAmenityPrices({
            hotel,
            fromDate,
            toDate,
            serviceChargeTaxRate,
            adult: adult ?? 0,
            childrenAges: childrenAges ?? [],
            pets: pets ?? 0,
            bookingRatePlanAmenities,
            bookingRoomProductAmenities,
            hotelAmenities,
            hotelAmenityPrices,
            extrasTaxes: taxSettingList.extrasTaxes,
            pricingDecimalRoundingRule,
            counts: amenityList || []
          });

        for (const addOnAmenityPricing of addOnAmenityPricingList) {
          addOnAmenityPricing.isSalesPlanIncluded = false;
          addOnAmenityPricing.extraServiceType = RatePlanExtraServiceType.EXTRA;
          amenityPricingList.push(addOnAmenityPricing);
        }

        for (const mandatoryAmenityPricing of mandatoryAmenityPricingList) {
          mandatoryAmenityPricing.isSalesPlanIncluded = false;
          mandatoryAmenityPricing.extraServiceType = RatePlanExtraServiceType.MANDATORY;
          amenityPricingList.push(mandatoryAmenityPricing);
        }

        for (const amenityPricing of includedAmenityPricingList) {
          amenityPricing.hotelAmenity['isIncluded'] = true;
          amenityPricing.isSalesPlanIncluded = true;
          amenityPricing.extraServiceType = RatePlanExtraServiceType.INCLUDED;
          amenityPricingList.push(amenityPricing);
        }

        for (const surchargeAmenityPricing of surchargeAmenityPricingList) {
          if (
            surchargeAmenityPricing.hotelAmenity.isePricingDisplayMode ===
            IsePricingDisplayModeEnum.INCLUSIVE
          ) {
            surchargeAmenityPricing.hotelAmenity['isIncluded'] = true;
            surchargeAmenityPricing.isSalesPlanIncluded = true;
            includedAmenityPricingList.push(surchargeAmenityPricing);
          } else {
            surchargeAmenityPricing.isSalesPlanIncluded = false;
            addOnAmenityPricingList.push(surchargeAmenityPricing);
          }

          amenityPricingList.push(surchargeAmenityPricing);
        }

        const baseNetPrice = dailySellingRates.reduce((acc, curr) => acc + curr.baseNetPrice, 0);
        const baseGrossPrice = dailySellingRates.reduce(
          (acc, curr) => acc + curr.baseGrossPrice,
          0
        );

        const totalRatePlanAdjustments = dailySellingRates.reduce(
          (sum, price) => sum + (Number(price.ratePlanAdjustmentRate) || 0),
          0
        );

        const totalIncludedExtraServiceAmount = includedAmenityPricingList.reduce(
          (acc, curr) => acc + curr.totalGrossAmount,
          0
        );

        const hotelTaxAmount = dailySellingRates.reduce(
          (acc, curr) => acc + (curr.taxAmount ?? 0),
          0
        );
        const currentRatePlanTaxes = this.getRatePlanTaxes({
          ratePlanCode: ratePlan.code,
          hotelTaxSettings: taxSettingList.accommodationTaxes,
          fromDate,
          toDate
        });
        const totalTaxRate = currentRatePlanTaxes.reduce(
          (acc, curr) => acc + (curr.hotelTax.rate ?? 0) * (curr.intersectionDays ?? 0),
          0
        );

        dto.roomTaxDetailsMap = currentRatePlanTaxes.reduce((acc, curr) => {
          const value =
            totalTaxRate > 0
              ? (((curr.hotelTax.rate ?? 0) * (curr.intersectionDays ?? 0)) / totalTaxRate) *
                hotelTaxAmount
              : 0;
          acc[curr.hotelTax.code] = Number(
            new Decimal(value).toFixed(pricingDecimalRoundingRule.decimalUnits)
          );
          return acc;
        }, {});

        const totalOccupancySurchargeAmount = dailySellingRates.reduce(
          (acc, curr) => acc + (curr.extraOccupancySurchargeAmount ?? 0),
          0
        );

        const extraTaxAmount = addOnAmenityPricingList.reduce(
          (acc, curr) => acc + curr.taxAmount,
          0
        );

        const totalNetPrice = DecimalRoundingHelper.sumWithRounding(
          [baseNetPrice, totalIncludedExtraServiceAmount, totalOccupancySurchargeAmount],
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        );

        const totalGrossPrice = DecimalRoundingHelper.sumWithRounding(
          [baseGrossPrice, totalIncludedExtraServiceAmount, totalOccupancySurchargeAmount],
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        );

        const averageDailyRate =
          dailySellingRates.length > 0
            ? DecimalRoundingHelper.conditionalRounding(
                totalGrossPrice / dailySellingRates.length,
                pricingDecimalRoundingRule.roundingMode,
                pricingDecimalRoundingRule.decimalUnits
              )
            : 0;

        for (const dailySellingRate of dailySellingRates) {
          const originalTotalSellingRate = dailySellingRate.originalTotalSellingRate;

          const extraBedAdultSurcharge = surchargeAmenityPricingList.find(
            (s) => s.hotelAmenity.code === EXTRA_BED_ADULT_AMENITY_CODE
          );

          const petSurcharge = surchargeAmenityPricingList.find(
            (s) => s.hotelAmenity.code === PET_AMENITY_CODE
          );

          dailySellingRate.extraBedAmount = extraBedAdultSurcharge?.totalGrossAmount;

          dailySellingRate.originalTotalSellingRate = originalTotalSellingRate;
          dailySellingRate.sellingRate = originalTotalSellingRate;
          dailySellingRate.addInPetAmenity = petSurcharge?.hotelAmenity;
        }

        const totalGrossPriceBeforeAdjustment = totalGrossPrice - totalRatePlanAdjustments;
        const totalNetPriceBeforeAdjustment = totalNetPrice - totalRatePlanAdjustments;
        const totalGrossAmount = Number(totalGrossPrice) || 0;
        const totalBaseAmount = Number(totalNetPrice) || 0;
        const ratePlanAverageDailyRate = Number(averageDailyRate) || 0;
        const totalGrossAmountBeforeAdjustment = Number(totalGrossPriceBeforeAdjustment) || 0;
        const totalBaseAmountBeforeAdjustment = Number(totalNetPriceBeforeAdjustment) || 0;

        dto.taxAmount = extraTaxAmount + hotelTaxAmount;
        dto.totalGrossAmount = totalGrossAmount;
        dto.totalBaseAmount = totalBaseAmount;
        dto.averageDailyRate = ratePlanAverageDailyRate;
        dto.totalGrossAmountBeforeAdjustment = totalGrossAmountBeforeAdjustment;
        dto.totalBaseAmountBeforeAdjustment = totalBaseAmountBeforeAdjustment;
        dto.adjustmentPercentage = totalRatePlanAdjustments;
        dto.shouldShowStrikeThrough = totalRatePlanAdjustments < 0;
        dto.totalSellingRate += totalGrossAmount;

        // Calculate daily room rate list (timeslice for each day)
        dto.dailyRoomRateList = this.calculateDailyRoomRateList({
          dailySellingRates,
          includedAmenityPricingList,
          pricingDecimalRoundingRule
        });

        if (isCalculateCityTax) {
          const calculatedCityTax = this.cityTaxService.calculateBookingCityTax({
            totalRooms: totalRoom,
            adults: adult || 1,
            childrenAgeList: childrenAges || [],
            pricingDecimalRoundingRule: pricingDecimalRoundingRule,
            dailySellingRateList: dailySellingRates,
            hotelCityTaxList: hotelCityTaxList || [],
            hotelCityTaxAgeGroups: hotelCityTaxAgeGroups || []
          });

          dto.calculatedCityTax = {
            fromDate,
            toDate,
            propertyId: hotel.id,
            totalCityTaxAmount: calculatedCityTax.totalCityTaxAmount,
            roomProductSalesPlanId: roomProductRatePlan.id,
            taxBreakdown: calculatedCityTax.cityTaxBreakdown.map((item) => ({
              ...item,
              amount: item.taxAmount,
              rate: item.value
            }))
          };

          dto.cityTaxAmount = calculatedCityTax.totalCityTaxAmount;

          dto.totalGrossAmountBeforeAdjustment +=
            calculatedCityTax.totalCityTaxAmountBeforeAdjustment;

          if (hotel.taxSetting === TaxSettingEnum.INCLUSIVE) {
            dto.totalGrossAmount += calculatedCityTax.totalCityTaxAmount;
            dto.totalSellingRate += calculatedCityTax.totalCityTaxAmount;
            dto.averageDailyRate += DecimalRoundingHelper.conditionalRounding(
              calculatedCityTax.totalCityTaxAmount / los,
              pricingDecimalRoundingRule.roundingMode,
              pricingDecimalRoundingRule.decimalUnits
            );
          }
        }

        // dto.dailySellingRateList = dailySellingRates;
        // dto = this.bookingCalculateAccommodationService.calculateAccommodationSellingPrice(dto);
        // dto = this.bookingCalculateAccommodationService.calculateAccommodationPricingByTax({
        //   hotel,
        //   rfcRatePlan: dto,
        //   fromDate: fromDate,
        //   toDate: toDate,
        //   los: los,
        //   pricingDecimalRoundingRule,
        //   salesPlanCode: ratePlans.find((d) => d.id === roomProductRatePlan.ratePlanId)?.code || '',
        //   serviceChargeRate: 0,
        //   serviceChargeTaxRate: 0,
        //   taxSettings: [...taxSettingList.accommodationTaxes, ...taxSettingList.extrasTaxes]
        // });

        result.push(dto);

        // roomProductRatePlanResults.set(
        //   `${roomProductRatePlan.roomProductId}-${roomProductRatePlan.ratePlanId}`,
        //   {
        //     roomProductRatePlanId: roomProductRatePlan.id,
        //     ratePlanId: roomProductRatePlan.ratePlanId,
        //     roomProductId: roomProductRatePlan.roomProductId,
        //     dailySellingRateList: dailySellingRates,
        //     totalNetPrice,
        //     totalGrossPrice,
        //     averageDailyRate,
        //     dailyPricesCount: dailySellingRates.length
        //   }
        // );
      }
    }

    return {
      roomProductRatePlanResults: Array.from(result.values()),
      amenityPricingList
    };
  }

  private async calculateExtraAmenityPrices(input: {
    bookingRatePlanAmenities: AmenityWithType[];
    bookingRoomProductAmenities: AmenityWithType[];
    hotelAmenities: HotelAmenity[];
    hotelAmenityPrices: HotelAmenityPrice[];
    extrasTaxes: HotelTaxSetting[];
    hotel: Hotel;
    fromDate: string;
    toDate: string;
    serviceChargeTaxRate: number;
    adult: number;
    childrenAges: number[];
    pets: number;
    counts: {
      code?: HotelAmenity['code'];
      count?: number;
    }[];
    pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
  }) {
    const {
      bookingRatePlanAmenities,
      bookingRoomProductAmenities,
      hotelAmenities,
      hotelAmenityPrices,
      extrasTaxes,
      hotel,
      fromDate,
      toDate,
      serviceChargeTaxRate,
      adult,
      childrenAges,
      pets,
      counts,
      pricingDecimalRoundingRule
    } = input;

    const { extra, included, mandatory } = this.bookingHotelAmenityService.combineBookingAmenities({
      ratePlanAmenities: bookingRatePlanAmenities,
      roomProductAmenities: bookingRoomProductAmenities,
      hotelAmenities: hotelAmenities
    });

    const mandatoryExtraServiceIds = mandatory.map((service) => service.id);
    const mandatoryExtraServicePrices = hotelAmenityPrices.filter((price) =>
      mandatoryExtraServiceIds.includes(price.hotelAmenityId)
    );

    const addOnExtraServiceIds = extra.map((service) => service.id);
    const addOnExtraServicePrices = hotelAmenityPrices.filter((price) =>
      addOnExtraServiceIds.includes(price.hotelAmenityId)
    );
    const includedExtraServiceIds = included.map((service) => service.id);
    const includedExtraServicePrices = hotelAmenityPrices.filter((price) =>
      includedExtraServiceIds.includes(price.hotelAmenityId)
    );

    const inputAddOnCodes = counts.map((service) => service.code);
    const [addOnAmenityPricingList, mandatoryAmenityPricingList, includedAmenityPricingList] =
      await Promise.all([
        this.bookingAmenityCalculateService.calculateExtraAmenityPrices({
          hotel,
          hotelAmenityPrices: addOnExtraServicePrices,
          adult: adult || 1,
          childrenAges: childrenAges || [],
          pets: pets || 0,
          extraServices: extra.filter((service) => inputAddOnCodes.includes(service.code)),
          fromDate: fromDate,
          toDate: toDate,
          taxSettings: extrasTaxes,
          serviceChargeRate: serviceChargeTaxRate,
          serviceChargeTaxRate: serviceChargeTaxRate,
          counts: counts,
          pricingDecimalRoundingRule
        }),
        this.bookingAmenityCalculateService.calculateExtraAmenityPrices({
          hotel,
          hotelAmenityPrices: mandatoryExtraServicePrices,
          adult: adult || 1,
          childrenAges: childrenAges || [],
          pets: pets || 0,
          extraServices: mandatory,
          fromDate: fromDate,
          toDate: toDate,
          taxSettings: extrasTaxes,
          serviceChargeRate: serviceChargeTaxRate,
          serviceChargeTaxRate: serviceChargeTaxRate,
          counts: [],
          pricingDecimalRoundingRule
        }),
        this.bookingAmenityCalculateService.calculateExtraAmenityPrices({
          hotel,
          hotelAmenityPrices: includedExtraServicePrices,
          adult: adult || 1,
          childrenAges: childrenAges || [],
          pets: pets || 0,
          extraServices: included,
          fromDate: fromDate,
          toDate: toDate,
          taxSettings: extrasTaxes,
          serviceChargeRate: serviceChargeTaxRate,
          serviceChargeTaxRate: serviceChargeTaxRate,
          counts: [],
          pricingDecimalRoundingRule
        })
      ]);

    return {
      addOnAmenityPricingList,
      mandatoryAmenityPricingList,
      includedAmenityPricingList
    };
  }

  private getRatePlanTaxes(input: {
    ratePlanCode: string;
    hotelTaxSettings: HotelTaxSetting[];
    fromDate: string;
    toDate: string;
  }) {
    const { ratePlanCode, hotelTaxSettings, fromDate, toDate } = input;
    const hotelTaxes = hotelTaxSettings
      .filter((item) => item.serviceCode === ratePlanCode)
      .map((item) => item.hotelTax);

    const rangeFromDate = new Date(fromDate);
    const rangeToDate = new Date(toDate);

    return hotelTaxes
      .map((item) => {
        // Kiểm tra giao nhau của 2 khoảng thời gian
        // Khoảng 1: [validFrom, validTo] (null = vô cùng)
        // Khoảng 2: [fromDate, toDate] (luôn có giá trị)

        const itemValidFrom = item.validFrom ? new Date(item.validFrom) : null;
        const itemValidTo = item.validTo ? new Date(item.validTo) : null;

        // Điều kiện giao nhau:
        // validFrom <= toDate (hoặc validFrom là null)
        // validTo >= fromDate (hoặc validTo là null)

        const matchFromDate = !itemValidFrom || itemValidFrom <= rangeToDate;
        const matchToDate = !itemValidTo || itemValidTo >= rangeFromDate;

        const hasIntersection = matchFromDate && matchToDate;

        if (!hasIntersection) {
          return null;
        }

        // Tính số ngày giao nhau
        // intersectionStart = max(validFrom, fromDate)
        // intersectionEnd = min(validTo, toDate)
        const intersectionStart = itemValidFrom
          ? new Date(Math.max(itemValidFrom.getTime(), rangeFromDate.getTime()))
          : rangeFromDate;

        const intersectionEnd = itemValidTo
          ? new Date(Math.min(itemValidTo.getTime(), rangeToDate.getTime()))
          : rangeToDate;

        const diffTime = intersectionEnd.getTime() - intersectionStart.getTime();
        const intersectionDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 để tính cả ngày đầu

        return {
          hotelTax: item,
          intersectionDays
        };
      })
      .filter((item) => item !== null);
  }

  private calculateExtraBed(
    hotelAmenities: HotelAmenity[],
    calculateAllocateCapacityResult: CalculateAllocateCapacityResult,
    childAgeList: number[],
    roundingMode: RoundingModeEnum,
    decimalUnits: number
  ) {
    const sortedChildAgeList = [...childAgeList].sort((a, b) => a - b);
    const extraBedKidAmenity = hotelAmenities.find(
      (a) => a.amenityType === AmenityTypeEnum.EXTRA_BED && a.code === EXTRA_BED_KID_AMENITY_CODE
    );
    const extraBedAdultAmenity = hotelAmenities.find(
      (a) => a.amenityType === AmenityTypeEnum.EXTRA_BED && a.code === EXTRA_BED_ADULT_AMENITY_CODE
    );

    const extraBedAdultRate = Number(
      extraBedAdultAmenity?.hotelAmenityPrices.find(
        (p) => p.hotelAgeCategory.code === HotelAgeCategoryCodeEnum.DEFAULT
      )?.price ?? 0
    );

    const petAmenity = hotelAmenities.find((a) => a.code === PET_AMENITY_CODE);

    const extraBedKidPrices = extraBedKidAmenity?.hotelAmenityPrices ?? [];

    const { allocatedExtraBedAdultCount, allocatedExtraBedChildCount, allocatedPetCount } =
      calculateAllocateCapacityResult;
    const extraAdult =
      allocatedExtraBedAdultCount && allocatedExtraBedAdultCount > 0
        ? allocatedExtraBedAdultCount
        : 0;

    const extraKid =
      allocatedExtraBedChildCount && allocatedExtraBedChildCount > 0
        ? allocatedExtraBedChildCount
        : 0;

    const extraAdultRate = DecimalRoundingHelper.conditionalRounding(
      extraBedAdultRate * extraAdult,
      roundingMode,
      decimalUnits
    );

    let extraKidRate = 0;

    if (extraKid > 0) {
      for (let i = 0; i < allocatedExtraBedChildCount; i++) {
        const childAge = sortedChildAgeList[i];

        let extraBedKidPrice = extraBedKidPrices.find(
          (p) =>
            p.hotelAgeCategory.fromAge <= childAge &&
            p.hotelAgeCategory.toAge > childAge &&
            p.hotelAgeCategory.code !== HotelAgeCategoryCodeEnum.DEFAULT
        );

        if (!extraBedKidPrice) {
          extraBedKidPrice = extraBedKidPrices.find(
            (p) => p.hotelAgeCategory.code === HotelAgeCategoryCodeEnum.DEFAULT
          );
        }

        const pricingForChild = extraBedKidPrice
          ? DecimalRoundingHelper.conditionalRounding(
              Number(extraBedKidPrice.price),
              roundingMode,
              decimalUnits
            )
          : null;

        if (pricingForChild) {
          extraKidRate += pricingForChild;
        }
      }
    }

    let includedPetAmenity: HotelAmenity | undefined = undefined;

    const allocatedPets = allocatedPetCount && allocatedPetCount > 0 ? allocatedPetCount : 0;
    if (allocatedPets > 0 && petAmenity) {
      includedPetAmenity = {
        ...petAmenity,
        count: allocatedPets
      };
    }

    const totalExtraBedRate = extraAdultRate + extraKidRate;

    return { totalExtraBedRate, includedPetAmenity };
  }

  // Calculate extra occupancy surcharge and return daily selling rate, extra occupancy surcharge, rate plan included services
  private async calculateExtraOccupancySurcharge(input: CalculateExtraOccupancySurchargeInput) {
    const {
      hotel,
      ratePlans,
      roomProductRatePlans,
      pricingDecimalRoundingRule,
      allRoomProductDailySellingPrices,

      serviceChargeRate,
      serviceChargeTaxRate,
      fromDate,
      toDate,
      childrenAges,
      adults,
      ageCategories
    } = input;

    const dailyRatePlanExtraOccupancyRates =
      await this.occupancySurchargeCalculateService.getDailyOccupancySurchargeRate({
        fromDate,
        toDate,
        roomProductRatePlans: roomProductRatePlans
      });

    const extraOccupancySurchargePrices =
      this.occupancySurchargeCalculateService.calculateExtraOccupancySurcharge({
        fromDate: fromDate,
        toDate: toDate,
        roomProductRatePlans: roomProductRatePlans,
        rates: dailyRatePlanExtraOccupancyRates,
        ageCategories: ageCategories,
        adults: adults,
        childrenAges: childrenAges
      });

    const extraOccupancySurchargePriceMap = groupByToMapSingle(
      extraOccupancySurchargePrices,
      (r) => `${r.roomProductId}-${r.ratePlanId}-${r.date}`
    );

    const roomProductRatePlanPricing: {
      roomProductRatePlanId: string;
      ratePlanId: string;
      roomProductId: string;
      dailySellingRateList: DailySellingRateDto[];
    }[] = [];

    for (const roomProductRatePlan of roomProductRatePlans) {
      const hotelId = roomProductRatePlan.hotelId;
      const ratePlanId = roomProductRatePlan.ratePlanId;
      const roomProductId = roomProductRatePlan.roomProductId;
      const ratePlan = ratePlans.find((r) => r.id === ratePlanId);

      const roundingMode = ratePlan?.roundingMode ?? pricingDecimalRoundingRule.roundingMode;
      const decimalUnits = pricingDecimalRoundingRule.decimalUnits;

      const roomProductDailySellingPrices = allRoomProductDailySellingPrices.filter(
        (r) =>
          r.ratePlanId === ratePlanId && r.roomProductId === roomProductId && r.hotelId === hotelId
      );

      const roomProductDailySellingPriceMap = new Map<DateString, RoomProductDailySellingPrice>();
      for (const roomProductDailySellingPrice of roomProductDailySellingPrices) {
        roomProductDailySellingPriceMap.set(
          roomProductDailySellingPrice.date,
          roomProductDailySellingPrice
        );
      }

      const rangeDates = Helper.generateDateRange(fromDate, toDate);

      const results: DailySellingRateDto[] = [];
      for (const date of rangeDates) {
        let doubleOccupancyRate: number | undefined = undefined;
        let originalTotalSellingRate: number | undefined = undefined;
        let baseSellingRate: number | undefined = undefined;

        const roomProductDailySellingPrice = roomProductDailySellingPriceMap.get(date);
        originalTotalSellingRate = roomProductDailySellingPrice?.grossPrice ?? 0; // gross price = base price + tax + adjustments;
        baseSellingRate = roomProductDailySellingPrice?.netPrice ?? 0; // net price = gross - tax;

        let extraOccupancySurchargeAmount =
          extraOccupancySurchargePriceMap.get(`${roomProductId}-${ratePlanId}-${date}`)
            ?.extraOccupancySurcharge ?? 0;
        /**
         * - Extra occupancy surcharge: 
          Có những product đc setup để charge thêm khi khách tới nhiều hơn 1. Ví dụ đi 2 người thì charge thêm $20, 3 ng thì $30.
          Data lấy từ 2 bảng rfc_extra_occupancy_rate(default) và rfc_rate_plan_extra_occupancy_rate_adjustment (pricing.daily adjustment)
      - Extra bed:
            Khi capacity request > default product capacity và phải dùng đến extra capacity, cần phải count thêm extra bed amount. Đối với children, mỗi nhóm tuổi sẽ tính giá khác nhau
              Data lấy từ hotel.hotel_amenity join với hotel_amenity_price
         */

        results.push({
          taxAmount: DecimalRoundingHelper.applyRounding(
            roomProductDailySellingPrice?.taxAmount ?? 0,
            pricingDecimalRoundingRule.roundingMode,
            pricingDecimalRoundingRule.decimalUnits
          ),
          baseNetPrice: DecimalRoundingHelper.applyRounding(
            roomProductDailySellingPrice?.netPrice ?? 0,
            pricingDecimalRoundingRule.roundingMode,
            pricingDecimalRoundingRule.decimalUnits
          ),
          baseGrossPrice: DecimalRoundingHelper.applyRounding(
            roomProductDailySellingPrice?.grossPrice ?? 0,
            pricingDecimalRoundingRule.roundingMode,
            pricingDecimalRoundingRule.decimalUnits
          ),
          baseSellingRate: DecimalRoundingHelper.applyRounding(
            baseSellingRate,
            pricingDecimalRoundingRule.roundingMode,
            pricingDecimalRoundingRule.decimalUnits
          ),
          originalTotalSellingRate: DecimalRoundingHelper.applyRounding(
            originalTotalSellingRate,
            pricingDecimalRoundingRule.roundingMode,
            pricingDecimalRoundingRule.decimalUnits
          ),
          doubleOccupancyRate: DecimalRoundingHelper.applyRounding(
            doubleOccupancyRate ?? 0,
            pricingDecimalRoundingRule.roundingMode,
            pricingDecimalRoundingRule.decimalUnits
          ),
          extraOccupancySurchargeAmount: DecimalRoundingHelper.applyRounding(
            extraOccupancySurchargeAmount ?? 0,
            pricingDecimalRoundingRule.roundingMode,
            pricingDecimalRoundingRule.decimalUnits
          ),
          roomProductRatePlanId: roomProductRatePlan.id,
          ratePlanId: roomProductRatePlan.ratePlanId,
          roomProductId: roomProductRatePlan.roomProductId,
          date: date,
          isDerived:
            ratePlans.find((r) => r.id === ratePlanId)?.pricingMethodology ===
            RatePlanPricingMethodologyEnum.DERIVED_PRICING,
          ratePlanAdjustmentRate: DecimalRoundingHelper.applyRounding(
            roomProductDailySellingPrice?.ratePlanAdjustments ?? 0,
            pricingDecimalRoundingRule.roundingMode,
            pricingDecimalRoundingRule.decimalUnits
          )
        });
      }

      roomProductRatePlanPricing.push({
        roomProductRatePlanId: roomProductRatePlan.id,
        ratePlanId: roomProductRatePlan.ratePlanId,
        roomProductId: roomProductRatePlan.roomProductId,
        dailySellingRateList: results
      });
    }

    return roomProductRatePlanPricing;
  }

  /**
   * Calculate daily room rate list (timeslice) for each day in the booking period
   * @param options - Configuration object containing daily selling rates, included amenities, and rounding rules
   * @returns Array of daily room rates with base amount, tax amount, and gross amount for each day
   */
  private calculateDailyRoomRateList(options: {
    dailySellingRates: DailySellingRateDto[];
    includedAmenityPricingList: AmenityPricingDto[];
    pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
  }) {
    const { dailySellingRates, includedAmenityPricingList, pricingDecimalRoundingRule } = options;

    return dailySellingRates.map((dailyRate) => {
      // Calculate included extra service gross amount for this specific day
      // const dailyIncludedExtraGrossAmount = includedAmenityPricingList.reduce((sum, amenity) => {
      //   // Try to find the exact daily pricing
      //   const dailyAmenityPricing = amenity.includedDates?.includes(dailyRate.date)
      //     ? amenity.totalGrossAmount / (amenity.includedDates?.length ?? 1)
      //     : 0;

      //   return sum + dailyAmenityPricing;
      // }, 0);

      // Calculate included extra service base amount for this specific day
      // const dailyIncludedExtraBaseAmount = includedAmenityPricingList.reduce((sum, amenity) => {
      //   const dailyAmenityPricing = amenity.includedDates?.includes(dailyRate.date)
      //     ? amenity.totalBaseAmount / (amenity.includedDates?.length ?? 1)
      //     : 0;

      //   return sum + dailyAmenityPricing;
      // }, 0);

      // Calculate included extra service tax amount for this specific day
      // const dailyIncludedExtraTaxAmount = includedAmenityPricingList.reduce((sum, amenity) => {
      //   const dailyAmenityPricing = amenity.includedDates?.includes(dailyRate.date)
      //     ? amenity.taxAmount / (amenity.includedDates?.length ?? 1)
      //     : 0;

      //   return sum + (dailyAmenityPricing ?? 0);
      // }, 0);

      // Calculate total amounts for this day
      const dailyBaseAmount =
        dailyRate.baseNetPrice + (dailyRate.extraOccupancySurchargeAmount || 0);
      const dailyGrossAmount =
        dailyRate.baseGrossPrice + (dailyRate.extraOccupancySurchargeAmount || 0);
      const dailyTaxAmount = dailyRate.taxAmount ?? 0;

      // Calculate amounts before adjustment (discount/promotion)
      const dailyBaseAmountBeforeAdjustment =
        dailyBaseAmount - (Number(dailyRate.ratePlanAdjustmentRate) || 0);
      const dailyGrossAmountBeforeAdjustment =
        dailyGrossAmount - (Number(dailyRate.ratePlanAdjustmentRate) || 0);

      return {
        date: dailyRate.date,
        baseAmount: DecimalRoundingHelper.conditionalRounding(
          dailyBaseAmount,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        ),
        taxAmount: DecimalRoundingHelper.conditionalRounding(
          dailyTaxAmount,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        ),
        grossAmount: DecimalRoundingHelper.conditionalRounding(
          dailyGrossAmount,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        ),
        baseAmountBeforeAdjustment: DecimalRoundingHelper.conditionalRounding(
          dailyBaseAmountBeforeAdjustment,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        ),
        taxAmountBeforeAdjustment: DecimalRoundingHelper.conditionalRounding(
          dailyTaxAmount,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        ),
        grossAmountBeforeAdjustment: DecimalRoundingHelper.conditionalRounding(
          dailyGrossAmountBeforeAdjustment,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        )
      };
    });
  }
}
