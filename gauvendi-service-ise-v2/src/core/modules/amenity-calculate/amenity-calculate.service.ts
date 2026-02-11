import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { PLATFORM_SERVICE } from 'src/core/clients/platform-client.module';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import {
  HotelAmenity,
  HotelAmenityAgeCategoryPricingDto,
  SellingTypeEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RoundingModeEnum } from 'src/core/enums/common';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { S3Service } from 'src/core/s3/s3.service';
import { CalculateAllocateCapacityResult } from 'src/core/services/calculate-allocation.service';
import { groupByToMap } from 'src/core/utils/group-by.util';
import {
  EXTRA_BED_ADULT_AMENITY_CODE,
  EXTRA_BED_KID_AMENITY_CODE,
  PET_AMENITY_CODE
} from 'src/modules/hotel-amenity/services/hotel-amenity.service';
import { CalculatePricingAmenityPayload } from '../../../modules/booking-calculate/dtos/calculate-pricing-amenity.dto';
import { HotelPricingDecimalRoundingRuleDto } from '../../../modules/booking-calculate/dtos/hotel-pricing-decimal-rounding-rule.dto';
import {
  AmenityPricingDto,
  ReservationAmenityComboItemPricingDto,
  ReservationAmenityPricingDateDto
} from '../../../modules/booking-calculate/dtos/reservation-pricing.dto';

// DTOs and Interfaces
export interface CalculateReservationAmenityInput {
  code: string;
  count: number;
}

export interface CalculateAmenityPriceInput {
  hotel: Hotel;
  extraServices: HotelAmenity[];
  taxSettings: HotelTaxSetting[];
  hotelAmenityPrices: HotelAmenityPrice[];
  fromDate: string;
  toDate: string;
  serviceChargeRate: number;
  serviceChargeTaxRate: number;
  adult: number;
  childrenAges: number[];
  pets: number;
  counts: {
    code?: HotelAmenity['code'];
    count?: number;
  }[];
  pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
}

@Injectable()
export class BookingAmenityCalculateService {
  private readonly logger = new Logger(BookingAmenityCalculateService.name);

  constructor(
    @Inject(PLATFORM_SERVICE) private readonly platformService: ClientProxy,
    private readonly s3Service: S3Service
  ) {}

  async calculateExtraAmenityPrices(
    input: CalculateAmenityPriceInput
  ): Promise<AmenityPricingDto[]> {
    const {
      extraServices,
      taxSettings,
      hotelAmenityPrices,
      hotel,
      counts,
      fromDate,
      toDate,
      serviceChargeRate,
      serviceChargeTaxRate,
      adult,
      childrenAges,
      pets,
      pricingDecimalRoundingRule,
    } = input;

    const result: AmenityPricingDto[] = [];
    const hotelAmenityPricesMap = groupByToMap(hotelAmenityPrices, (price) => price.hotelAmenityId);
    for (const extraService of extraServices) {
      const taxSettingsForService = taxSettings.filter((t) => t.serviceCode === extraService.code);

      const amenityPricesForService = hotelAmenityPricesMap.get(extraService.id) || [];

      const countForService = counts.find((c) => c.code === extraService.code)?.count || 1;

      // const fromDate = format(Helper.parseDateToUTC(reservation.arrival), DATE_FORMAT);
      // const toDate = format(subDays(Helper.parseDateToUTC(reservation.departure), 1), DATE_FORMAT);

      const calculatedAmenity = await this.remoteCalculatePricingAmenity({
        input: {
          hotel,
          includedDates: extraService.includedDates,
          hotelAmenity: {
            ...extraService,
            hotelAmenityPrices: amenityPricesForService,
            count: countForService,
            taxSettingList: taxSettingsForService
          },
          fromDate: fromDate,
          toDate: toDate,
          taxSettingList: taxSettingsForService,
          serviceChargeRate,
          serviceChargeTaxRate,
          adult: adult,
          childrenAgeList: childrenAges,
          allocatedPets: pets
        },
        hotelConfigRoundingMode: {
          roundingMode: pricingDecimalRoundingRule.roundingMode,
          decimalPlaces: pricingDecimalRoundingRule.decimalUnits
        }
      });

      for (const ageCategoryPricing of calculatedAmenity.ageCategoryPricingList) {
        ageCategoryPricing.totalSellingRate = Number(ageCategoryPricing.totalPrice) || 0;
      }

      result.push({
        includedDates: calculatedAmenity.includedDates,
        hotelAmenity: {
          ...extraService,
          iconImageUrl: extraService.iconImageUrl
            ? await this.s3Service.getPreSignedUrl(extraService.iconImageUrl)
            : ''
        },
        isSalesPlanIncluded: false,
        taxAmount: Number(calculatedAmenity.taxAmount) || 0,
        serviceChargeAmount: Number(calculatedAmenity.serviceChargeAmount) || 0,
        averageDailyRate: Number(calculatedAmenity.averageDailyRate) || 0,
        totalSellingRate: Number(calculatedAmenity.totalSellingRate) || 0,
        totalBaseAmount: Number(calculatedAmenity.totalBaseAmount) || 0,
        totalGrossAmount: Number(calculatedAmenity.totalGrossAmount) || 0,
        ageCategoryPricingList: calculatedAmenity.ageCategoryPricingList?.map((item) => {
          return {
            ...item,
            count: item.totalCount
          };
        }),
        amenityPricingDateList: [],
        comboItemPricingList: [],
        taxDetailsMap: calculatedAmenity.taxDetailsMap || {},
        taxSettingList: calculatedAmenity.taxSettingList || [],
        count: calculatedAmenity.count || 1,
        cityTaxAmount: 0,
        linkedAmenityInfoList: calculatedAmenity?.linkedAmenityInfoList || [],
        sellingType: calculatedAmenity?.sellingType || SellingTypeEnum.SINGLE
      });
    }

    return result;
  }

  async calculateSurchargeAmenityPrices(input: {
    extraServices: HotelAmenity[];
    taxSettings: HotelTaxSetting[];
    hotelAmenityPrices: HotelAmenityPrice[];
    hotel: Hotel;
    fromDate: string;
    toDate: string;
    serviceChargeRate: number;
    serviceChargeTaxRate: number;
    childrenAgeList: number[];
    pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
    calculateAllocateCapacityResult: CalculateAllocateCapacityResult;
  }): Promise<AmenityPricingDto[]> {
    const {
      extraServices,
      taxSettings,
      hotelAmenityPrices,
      hotel,
      fromDate,
      toDate,
      serviceChargeRate,
      serviceChargeTaxRate,
      pricingDecimalRoundingRule,
      calculateAllocateCapacityResult,
      childrenAgeList
    } = input;

    const adultCount = calculateAllocateCapacityResult.allocatedExtraBedAdultCount || 0;
    const childCount = calculateAllocateCapacityResult.allocatedExtraBedChildCount || 0;
    const petCount = calculateAllocateCapacityResult.allocatedPetCount || 0;

    if (adultCount === 0 && childCount === 0 && petCount === 0) {
      return [];
    }

    const result: AmenityPricingDto[] = [];
    for (const extraService of extraServices) {
      const taxSettingsForService = taxSettings.filter((t) => t.serviceCode === extraService.code);

      const amenityPricesForService = hotelAmenityPrices.filter(
        (a) => a.hotelAmenityId === extraService.id
      );

      // const fromDate = format(Helper.parseDateToUTC(reservation.arrival), DATE_FORMAT);
      // const toDate = format(subDays(Helper.parseDateToUTC(reservation.departure), 1), DATE_FORMAT);

      let calculatedAmenity: HotelAmenity | undefined;
      if (extraService.code === PET_AMENITY_CODE) {
        calculatedAmenity = await this.remoteCalculatePricingAmenity({
          input: {
            hotel,
            hotelAmenity: {
              ...extraService,
              hotelAmenityPrices: amenityPricesForService,
              count: calculateAllocateCapacityResult.allocatedPetCount,
              taxSettingList: taxSettingsForService
            },
            fromDate: fromDate,
            toDate: toDate,
            taxSettingList: taxSettingsForService,
            serviceChargeRate,
            serviceChargeTaxRate,
            adult: 0,
            childrenAgeList: [],
            allocatedPets: calculateAllocateCapacityResult.allocatedPetCount
          },
          hotelConfigRoundingMode: {
            roundingMode: pricingDecimalRoundingRule.roundingMode,
            decimalPlaces: pricingDecimalRoundingRule.decimalUnits
          }
        });
      } else if (extraService.code === EXTRA_BED_ADULT_AMENITY_CODE) {
        calculatedAmenity = await this.remoteCalculatePricingAmenity({
          input: {
            hotel,
            hotelAmenity: {
              ...extraService,
              hotelAmenityPrices: amenityPricesForService,
              count: adultCount,
              taxSettingList: taxSettingsForService
            },
            fromDate: fromDate,
            toDate: toDate,
            taxSettingList: taxSettingsForService,
            serviceChargeRate,
            serviceChargeTaxRate,
            adult: adultCount,
            childrenAgeList: [],
            allocatedPets: 0
          },
          hotelConfigRoundingMode: {
            roundingMode: pricingDecimalRoundingRule.roundingMode,
            decimalPlaces: pricingDecimalRoundingRule.decimalUnits
          }
        });
      } else if (extraService.code === EXTRA_BED_KID_AMENITY_CODE) {
        calculatedAmenity = await this.remoteCalculatePricingAmenity({
          input: {
            hotel,
            hotelAmenity: {
              ...extraService,
              hotelAmenityPrices: amenityPricesForService,
              count: childCount,
              taxSettingList: taxSettingsForService
            },
            fromDate: fromDate,
            toDate: toDate,
            taxSettingList: taxSettingsForService,
            serviceChargeRate,
            serviceChargeTaxRate,
            adult: 0,
            childrenAgeList: childrenAgeList.slice(0, childCount),
            allocatedPets: 0
          },
          hotelConfigRoundingMode: {
            roundingMode: pricingDecimalRoundingRule.roundingMode,
            decimalPlaces: pricingDecimalRoundingRule.decimalUnits
          }
        });
      }

      for (const ageCategoryPricing of calculatedAmenity?.ageCategoryPricingList || []) {
        ageCategoryPricing.totalSellingRate = Number(ageCategoryPricing.totalPrice) || 0;
      }

      if (calculatedAmenity) {
        result.push({
          hotelAmenity: {
            ...extraService,
            iconImageUrl: extraService.iconImageUrl
              ? await this.s3Service.getPreSignedUrl(extraService.iconImageUrl)
              : ''
          },
          isSalesPlanIncluded: false,
          taxAmount: Number(calculatedAmenity.taxAmount) || 0,
          serviceChargeAmount: Number(calculatedAmenity.serviceChargeAmount) || 0,
          averageDailyRate: Number(calculatedAmenity.averageDailyRate) || 0,
          totalSellingRate: Number(calculatedAmenity.totalSellingRate) || 0,
          totalBaseAmount: Number(calculatedAmenity.totalBaseAmount) || 0,
          totalGrossAmount: Number(calculatedAmenity.totalGrossAmount) || 0,
          ageCategoryPricingList: calculatedAmenity.ageCategoryPricingList?.map((item) => {
            return {
              ...item,
              count: item.totalCount
            };
          }),
          includedDates: calculatedAmenity.includedDates,
          amenityPricingDateList: [],
          comboItemPricingList: [],
          taxDetailsMap: calculatedAmenity.taxDetailsMap || {},
          taxSettingList: calculatedAmenity.taxSettingList || [],
          count: calculatedAmenity.count || 1,
          cityTaxAmount: 0
        });
      }
    }

    return result;
  }

  private async remoteCalculatePricingAmenity(
    params: CalculatePricingAmenityPayload
  ): Promise<HotelAmenity> {
    try {
      return await lastValueFrom(
        this.platformService.send({ cmd: 'calculate_amenity_pricing' }, params)
      );
    } catch (error) {
      console.log('🚀 ~ AmenityService ~ calculatePricingAmenity ~ error:', error);
      throw new BadRequestException('Failed to calculate pricing amenity');
    }
  }

  /**
   * Convert hotel amenity to reservation amenity pricing
   * Converted from Java CalculateBookingPricingServiceImpl.convertToReservationAmenityPricing
   */
  convertToReservationAmenityPricing(
    reservationAmenity: HotelAmenity,
    translateTo?: string,
    pricingDecimalRoundingRule?: HotelPricingDecimalRoundingRuleDto
  ): AmenityPricingDto {
    const decimalUnits = pricingDecimalRoundingRule?.decimalUnits || 2;
    const roundingMode = pricingDecimalRoundingRule?.roundingMode || RoundingModeEnum.HALF_ROUND_UP;

    // Handle translation
    if (translateTo) {
      // TODO: Call remote service for amenity translation
      // const amenityTranslationFilter = {
      //   amenityIdList: [reservationAmenity.id],
      //   languageCodeList: [translateTo]
      // };
      // const amenityTranslationList = await this.hotelServiceRemote.amenityTranslationList(amenityTranslationFilter);
      // const amenityTranslation = amenityTranslationList.data?.[0];
      // if (amenityTranslation) {
      //   if (amenityTranslation.name) {
      //     reservationAmenity.name = amenityTranslation.name;
      //   }
      //   if (amenityTranslation.description) {
      //     reservationAmenity.description = amenityTranslation.description;
      //   }
      // }

      reservationAmenity.translations?.forEach((translation) => {
        if (translation.languageCode === translateTo) {
          if (translation.name) {
            reservationAmenity.name = translation.name;
          }
          if (translation.description) {
            reservationAmenity.description = translation.description;
          }
        }
      });
    }

    // Extract pricing data
    const reservationAmenityId = reservationAmenity.id;
    const totalSellingRate = reservationAmenity.totalSellingRate?.toNumber() || 0;
    const totalBaseAmount = reservationAmenity.totalBaseAmount?.toNumber() || 0;
    const totalGrossAmount = reservationAmenity.totalGrossAmount?.toNumber() || 0;
    const taxAmount = reservationAmenity.taxAmount?.toNumber() || 0;
    const serviceChargeAmount = reservationAmenity.serviceChargeAmount?.toNumber() || 0;
    const averageDailyRate = reservationAmenity.averageDailyRate?.toNumber() || 0;
    const taxDetailsMap = reservationAmenity.taxDetailsMap || {};

    reservationAmenity.isIncluded = true;
    // Build result object
    const result: AmenityPricingDto = {
      hotelAmenity: reservationAmenity,
      count: reservationAmenity.count || 1,
      isSalesPlanIncluded: reservationAmenity.isIncluded,
      totalSellingRate,
      totalBaseAmount,
      totalGrossAmount,
      taxAmount,
      serviceChargeAmount,
      averageDailyRate,
      ageCategoryPricingList: reservationAmenity.ageCategoryPricingList || [],
      amenityPricingDateList: [],
      comboItemPricingList: [],
      taxDetailsMap: taxDetailsMap,
      taxSettingList: []
    };

    // Build amenity pricing date list
    const dailyPricingList = reservationAmenity.dailyPricingList || [];
    const amenityPricingDateList: ReservationAmenityPricingDateDto[] = [];

    for (const dailyPricing of dailyPricingList) {
      const totalDatesUse = dailyPricingList.length;
      const dailyGrossAmount = this.divideWithRounding(
        totalGrossAmount,
        totalDatesUse,
        decimalUnits,
        roundingMode
      );
      const dailyBaseAmount = this.divideWithRounding(
        totalBaseAmount,
        totalDatesUse,
        decimalUnits,
        roundingMode
      );
      const dailyTaxAmount = this.divideWithRounding(
        taxAmount,
        totalDatesUse,
        decimalUnits,
        roundingMode
      );
      const dailyServiceChargeAmount = this.divideWithRounding(
        serviceChargeAmount,
        totalDatesUse,
        decimalUnits,
        roundingMode
      );

      const amenityPricingDate: ReservationAmenityPricingDateDto = {
        date: dailyPricing.date,
        count: dailyPricing.count,
        totalBaseAmount: dailyBaseAmount,
        totalGrossAmount: dailyGrossAmount,
        taxAmount: dailyTaxAmount,
        serviceChargeAmount: dailyServiceChargeAmount
      };

      amenityPricingDateList.push(amenityPricingDate);
    }
    result.amenityPricingDateList = amenityPricingDateList;

    // Build age category pricing list
    const reservationAgeCategoryPricingList: HotelAmenityAgeCategoryPricingDto[] = [];
    const ageCategoryPricingList = reservationAmenity.ageCategoryPricingList || [];

    for (const ageCategoryPricing of ageCategoryPricingList) {
      const reservationAgeCategoryPricing: HotelAmenityAgeCategoryPricingDto = {
        ageCategoryCode: ageCategoryPricing.ageCategoryCode,
        fromAge: ageCategoryPricing.fromAge,
        toAge: ageCategoryPricing.toAge,
        count: ageCategoryPricing.totalCount,
        totalSellingRate: ageCategoryPricing.totalPrice?.toNumber()
      };
      reservationAgeCategoryPricingList.push(reservationAgeCategoryPricing);
    }
    result.ageCategoryPricingList = reservationAgeCategoryPricingList;

    // Build combo item pricing list
    const comboItemPricingList: ReservationAmenityComboItemPricingDto[] = [];
    const linkedAmenityInfoList = reservationAmenity.linkedAmenityInfoList || [];

    if (linkedAmenityInfoList.length > 0) {
      for (const linkedAmenity of linkedAmenityInfoList) {
        const comboItem: ReservationAmenityComboItemPricingDto = {
          masterHotelAmenityId: reservationAmenityId,
          hotelAmenity: linkedAmenity,
          totalSellingRate: linkedAmenity.totalSellingRate?.toNumber() || 0,
          totalBaseAmount: linkedAmenity.totalBaseAmount?.toNumber() || 0,
          totalGrossAmount: linkedAmenity.totalGrossAmount?.toNumber() || 0,
          taxAmount: linkedAmenity.taxAmount?.toNumber() || 0,
          serviceChargeAmount: linkedAmenity.serviceChargeAmount?.toNumber() || 0
        };
        comboItemPricingList.push(comboItem);
      }
    }
    result.comboItemPricingList = comboItemPricingList;

    return result;
  }

  /**
   * Helper method to divide with rounding
   */
  private divideWithRounding(
    value: number,
    divisor: number,
    decimalUnits: number,
    roundingMode: RoundingModeEnum
  ): number {
    if (divisor === 0) return 0;

    const result = value / divisor;

    return DecimalRoundingHelper.conditionalRounding(result, roundingMode, decimalUnits);
    // Apply rounding based on rounding mode
  }

  private getLinkedAmenityCodes(amenity: HotelAmenity): string[] {
    if (amenity.linkedAmenityCode) {
      return amenity.linkedAmenityCode.split(',');
    }
    return [];
  }
}
