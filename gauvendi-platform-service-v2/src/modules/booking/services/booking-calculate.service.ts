import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HotelPricingDecimalRoundingRuleDto } from '@src/core/dtos/hotel-pricing-decimal-rounding-rule.dto';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { EntityTranslationConfigCodeEnum } from '@src/core/entities/translation-entities/translation-entity-config.entity';
import { Helper } from '@src/core/helper/utils';
import { AmenityDataProviderService } from '@src/core/modules/amenity-calculate/amenity-data-provider.service';
import { HotelCityTaxRepository } from '@src/modules/hotel-city-tax/hotel-city-tax.repository';
import { HotelConfigurationRepository } from '@src/modules/hotel-configuration/hotel-configuration.repository';
import { HotelTaxRepository } from '@src/modules/hotel-tax/repositories/hotel-tax.repository';
import { HotelAmenityRepository } from '@src/modules/hotel/repositories/hotel-amenity.repository';
import { HotelRepository } from '@src/modules/hotel/repositories/hotel.repository';
import { HotelService } from '@src/modules/hotel/services/hotel.service';
import { RatePlanExtraServiceRepository } from '@src/modules/rate-plan-extra-service/repositories/rate-plan-extra-service.repository';
import { RatePlanSettingsService } from '@src/modules/rate-plan-settings/services/rate-plan-settings.service';
import { RatePlanRepository } from '@src/modules/rate-plan/repositories/rate-plan.repository';
import { RoomProductRatePlanRepository } from '@src/modules/room-product-rate-plan/room-product-rate-plan.repository';
import { RoomProductRetailFeatureRepository } from '@src/modules/room-product-retail-feature/repositories/room-product-retail-feature.repository';
import { RoomProductStandardFeatureRepository } from '@src/modules/room-product-standard-feature/repositories/room-product-retail-feature.repository';
import { RoomProductRepository } from '@src/modules/room-product/room-product.repository';
import { TranslationService } from '@src/modules/translation/services/translation.service';
import { differenceInCalendarDays } from 'date-fns';
import Decimal from 'decimal.js';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAgeCategoryCodeEnum } from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import {
  AmenityStatusEnum,
  HotelAmenity
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCityTax } from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { RatePlanExtraService } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RoomProductExtra } from 'src/core/entities/room-product-extra.entity';
import { DistributionChannel, RoomProduct } from 'src/core/entities/room-product.entity';
import {
  CityTaxChargeMethodEnum,
  CityTaxStatusEnum,
  HotelConfigurationTypeEnum,
  LanguageCodeEnum,
  RoomProductStatus,
  RoomProductType,
  RoundingModeEnum,
  TaxSettingEnum
} from 'src/core/enums/common';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { S3Service } from 'src/core/s3/s3.service';
import { FindOptionsRelations, FindOptionsSelect, In, Repository } from 'typeorm';
import { RoomProductExtraRepository } from '../../room-product-extra/room-product-extra.repository';
import {
  AvailableRoomCapacityFilterDto,
  BookingPricingDto,
  CalculateBookingPricingInputDto,
  CalculateReservationPricingInputDto,
  ReservationPricingDto,
  TaxDto
} from '../dtos/booking.dto';
import { HotelRetailCategoryRepository } from '../repositories/hotel-retail-category.repository';
import { HotelTaxSettingRepository } from '../repositories/hotel-tax-setting.repository';
import { RoomProductPricingCalculateService } from './booking-room-product-pricing-calculate.service';
import { BookingTaxService } from './booking-tax.service';
import { CalculateAllocationService } from './calculate-allocation.service';
const SERVICE_CHARGE_TAX_SERVICE_CODE = 'SERVICE_CHARGE_TAX';

@Injectable()
export class BookingCalculateService {
  private readonly logger = new Logger(BookingCalculateService.name);

  constructor(
    private readonly roomProductPricingCalculateService: RoomProductPricingCalculateService,
    private readonly hotelConfigurationRepository: HotelConfigurationRepository,
    private readonly hotelRepository: HotelRepository,
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly roomProductRepository: RoomProductRepository,
    private readonly ratePlanRepository: RatePlanRepository,
    private readonly ratePlanExtraServicesRepository: RatePlanExtraServiceRepository,
    private readonly roomProductExtraRepository: RoomProductExtraRepository,
    private readonly calculateAllocationService: CalculateAllocationService,
    private readonly hotelService: HotelService,
    private readonly roomProductRetailFeatureRepository: RoomProductRetailFeatureRepository,
    private readonly roomProductStandardFeatureRepository: RoomProductStandardFeatureRepository,
    private readonly taxService: BookingTaxService,
    private readonly hotelTaxRepository: HotelTaxRepository,
    private readonly hotelTaxSettingRepository: HotelTaxSettingRepository,
    private readonly hotelCityTaxRepository: HotelCityTaxRepository,
    private readonly s3Service: S3Service,
    private readonly hotelRetailCategoryRepository: HotelRetailCategoryRepository,
    private readonly ratePlanSettingsService: RatePlanSettingsService,
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,

    @InjectRepository(HotelAmenityPrice, DB_NAME.POSTGRES)
    private readonly hotelAmenityPriceRepository: Repository<HotelAmenityPrice>,

    private readonly translationService: TranslationService,
    private readonly amenityDataProviderService: AmenityDataProviderService
  ) {}

  async calculateBookingPricing(input: CalculateBookingPricingInputDto) {
    try {
      const hotel = await this.hotelRepository.getHotelByIdOrCode(input.hotelId, input.hotelCode, {
        baseCurrency: true
      });

      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }

      const roomProductCodes: string[] = [];
      const ratePlanCodes: string[] = [];
      const originalRoomProductIds: string[] = [];
      const originalRatePlanIds: string[] = [];

      for (const reservation of input.reservations) {
        if (reservation.roomProductCode) {
          roomProductCodes.push(reservation.roomProductCode);
        }
        if (reservation.ratePlanCode) {
          ratePlanCodes.push(reservation.ratePlanCode);
        }
        if (reservation.roomProductId) {
          originalRoomProductIds.push(reservation.roomProductId);
        }
        if (reservation.ratePlanId) {
          originalRatePlanIds.push(reservation.ratePlanId);
        }
      }

      // const extraServiceCodes = this.getExtraServiceCodes(input);

      let [
        roomProducts,
        ratePlans,
        hotelAmenities,
        pricingDecimalRoundingRule,
        pricingConfiguration,
        hotelTaxMap,
        hotelCityTaxMap,
        hotelCityTaxAgeGroups,
        translationList
      ] = await Promise.all([
        this.roomProductRepository.findAll({
          hotelId: hotel.id,
          ...(roomProductCodes?.length ? { codeList: roomProductCodes } : {}),
          ...(originalRoomProductIds?.length ? { idList: originalRoomProductIds } : {}),
          relations: ['roomProductImages', 'roomProductAssignedUnits']
        }),
        this.ratePlanRepository.findAllNoRelations({
          hotelId: hotel.id,
          ...(ratePlanCodes?.length ? { codeList: ratePlanCodes } : {}),
          ...(originalRatePlanIds?.length ? { idList: originalRatePlanIds } : {})
        }),
        this.getHotelAmenities({
          hotelId: hotel.id
        }),
        this.getPricingDecimalRoundingRule(hotel.id),
        this.hotelConfigurationRepository.getPricingConfiguration(hotel.id),
        this.getTranslatedHotelTaxMap(hotel.id, input.translateTo),
        this.getTranslatedHotelCityTaxMap(hotel.id, input.translateTo),
        this.hotelCityTaxRepository.findAllAgeGroups({
          hotelId: hotel.id
        }),
        this.translationService.getStaticContentTranslations({
          code: EntityTranslationConfigCodeEnum.INTERNET_SALES_ENGINE_CONTENTS,
          translateTo: input.translateTo || LanguageCodeEnum.EN
        })
      ]);

      // const extraServiceIds = hotelAmenities
      //   .filter((amenity) => extraServiceCodes.includes(amenity.code))
      //   .map((amenity) => amenity.id);
      // const ratePlanIds = ratePlans.map((ratePlan) => ratePlan.id);
      // const roomProductIds = roomProducts.map((roomProduct) => roomProduct.id);

      if (input.translateTo) {
        roomProducts = roomProducts.map((roomProduct) => {
          const translatedRoomProduct = roomProduct.translations?.find(
            (translation) => translation.languageCode === input.translateTo
          );
          return {
            ...roomProduct,
            name: translatedRoomProduct?.name || roomProduct.name,
            description: translatedRoomProduct?.description || roomProduct.description
          };
        });

        ratePlans = ratePlans.map((ratePlan) => {
          const translatedRatePlan = ratePlan.translations?.find(
            (translation) => translation.languageCode === input.translateTo
          );
          return {
            ...ratePlan,
            name: translatedRatePlan?.name || ratePlan.name,
            description: translatedRatePlan?.description || ratePlan.description
          };
        });
      }

      const roomProductIdsMap = new Map(
        roomProducts.map((roomProduct) => [roomProduct.id, roomProduct])
      );
      const roomProductCodesMap = new Map(
        roomProducts.map((roomProduct) => [roomProduct.code, roomProduct])
      );
      const ratePlanIdsMap = new Map(ratePlans.map((ratePlan) => [ratePlan.id, ratePlan]));
      const ratePlanCodesMap = new Map(ratePlans.map((ratePlan) => [ratePlan.code, ratePlan]));

      let reservationIndex = 0;
      for (const reservation of input.reservations) {
        const roomProduct = roomProducts.find(
          (roomProduct) =>
            roomProduct.id === reservation.roomProductId ||
            roomProduct.code === reservation.roomProductCode
        );
        if (!roomProduct) {
          throw new BadRequestException('Room product not found');
        }
        reservation.roomProductId = roomProduct.id;

        const ratePlan = ratePlans.find(
          (ratePlan) =>
            ratePlan.id === reservation.ratePlanId || ratePlan.code === reservation.ratePlanCode
        );
        if (!ratePlan) {
          throw new BadRequestException('Rate plan not found');
        }
        reservation.ratePlanId = ratePlan.id;
        if (!reservation.index) {
          reservation.index = reservationIndex.toString();
          reservationIndex++;
        }
      }
      const [hotelAmenityPrices, bookingRatePlanAmenities, bookingRoomProductAmenities] =
        await Promise.all([
          this.getHotelAmenityPrices({
            hotelAmenityIds: hotelAmenities.map((amenity) => amenity.id),
            relations: {
              hotelAgeCategory: true
            }
          }),
          this.amenityDataProviderService.getBookingRatePlanAmenities({
            reservations: input.reservations.map((reservation) => ({
              fromDate: reservation.arrival,
              toDate: reservation.departure,
              ratePlanId: reservation.ratePlanId ?? '',
              index: reservation.index ?? ''
            })),
            hotelId: hotel.id
          }),
          this.amenityDataProviderService.getRoomProductAmenities({
            reservations: input.reservations.map((reservation) => ({
              roomProductId: reservation.roomProductId ?? '',
              index: reservation.index ?? ''
            })),
            hotelId: hotel.id
          })
        ]);

      const result: ReservationPricingDto[] = [];
      let index = 0;

      for (const reservation of input.reservations) {
        const lengthOfStay = Math.max(
          0,
          differenceInCalendarDays(reservation.departure, reservation.arrival)
        );
        const ranges = Helper.generateDateRange(reservation.arrival, reservation.departure).slice(
          0,
          -1
        );

        const fromDate = ranges[0];
        const toDate = ranges[ranges.length - 1];
        if (ranges.length === 0) {
          throw new BadRequestException('Range dates is empty');
        }

        const roomProduct = reservation.roomProductCode
          ? roomProductCodesMap.get(reservation.roomProductCode)
          : roomProductIdsMap.get(reservation.roomProductId ?? '');

        if (!roomProduct) {
          throw new BadRequestException('Room product not found');
        }

        const ratePlan = reservation.ratePlanCode
          ? ratePlanCodesMap.get(reservation.ratePlanCode)
          : ratePlanIdsMap.get(reservation.ratePlanId ?? '');

        if (!ratePlan) {
          throw new BadRequestException('Rate plan not found');
        }

        const serviceCodes = (reservation.amenityList?.map((amenity) => amenity.code) ?? [])
          .filter((code) => code !== null && code !== undefined)
          .concat(ratePlan.code);

        const taxSettings = await this.hotelService.getHotelTaxSettings(hotel.id, serviceCodes);

        reservation.roomProductCode = roomProduct.code;
        let reservationPricing = await this.createReservationPricing({
          input: reservation,
          hotel,
          roomProduct,
          translateTo: input.translateTo
        });

        const serviceChargeRate = this.taxService.getHotelServiceChargeRate(hotel.id);
        const serviceChargeTaxRate = this.taxService.getHotelTaxRateByCode(
          [...taxSettings.accommodationTaxes, ...taxSettings.extrasTaxes],
          SERVICE_CHARGE_TAX_SERVICE_CODE
        );

        const bookingRatePlanAmenity = bookingRatePlanAmenities.find(
          (amenity) => amenity.ratePlanId === ratePlan.id && amenity.index === reservation.index
        );
        const bookingRoomProductAmenity = bookingRoomProductAmenities.find(
          (amenity) =>
            amenity.roomProductId === roomProduct.id && amenity.index === reservation.index
        );

        const { roomProductRatePlanResults, amenityPricingList } =
          await this.roomProductPricingCalculateService.calculateRoomProductPricing({
            roomProductInputs: [
              {
                id: roomProduct.id,
                allocatedAdultCount: reservationPricing.allocatedAdults,
                allocatedChildCount: reservationPricing.allocatedChildren,
                allocatedExtraBedAdultCount: reservationPricing.allocatedExtraAdults,
                allocatedExtraBedChildCount: reservationPricing.allocatedExtraChildren,
                allocatedPetCount: reservationPricing.allocatedPets
              }
            ],
            ratePlanIds: [ratePlan.id],
            childrenAges: reservation.childrenAges,
            adult: reservation.adults,
            pets: reservation.pets,
            fromDate,
            toDate,
            hotel,
            hotelAmenities: hotelAmenities,
            hotelAmenityPrices: hotelAmenityPrices,
            hotelCityTaxAgeGroups: hotelCityTaxAgeGroups,
            taxSettingList: {
              accommodationTaxes: taxSettings.accommodationTaxes,
              extrasTaxes: taxSettings.extrasTaxes
            },
            amenityList: reservation.amenityList,
            ratePlans: [ratePlan],
            roomProducts: [roomProduct],
            pricingDecimalRoundingRule,
            serviceChargeRate: serviceChargeRate,
            serviceChargeTaxRate: serviceChargeTaxRate,
            hotelCityTaxList: Array.from(hotelCityTaxMap.values()),
            isCalculateCityTax: input.isCityTaxIncluded,
            bookingRatePlanAmenities: bookingRatePlanAmenity?.amenities ?? [],
            bookingRoomProductAmenities: bookingRoomProductAmenity?.amenities ?? []
          });

        if (roomProductRatePlanResults?.length) {
          // Find the specific room product rate plan combination
          // In current logic, we expect exactly 1 result since we pass 1 roomProduct + 1 ratePlan
          const roomProductSalesPlan = roomProductRatePlanResults.find(
            (result) => result.rfcId === roomProduct.id && result.ratePlanId === ratePlan.id
          );
          if (!roomProductSalesPlan) {
            throw new BadRequestException('Room product rate plan not found');
          }

          reservationPricing.roomProductSalesPlan = roomProductSalesPlan;
          reservationPricing.dailyRoomRateList = roomProductSalesPlan.dailyRoomRateList;
        }

        if (!input.isSkipCancellationPolicy) {
          const mostBeneficialCxlPolicies =
            await this.ratePlanSettingsService.getMostBeneficialCxlPolicy({
              ratePlans,
              hotelId: hotel.id,
              fromDate: fromDate,
              toDate: toDate,
              translateTo: input.translateTo
            });

          const mostBeneficialCxlPolicy = mostBeneficialCxlPolicies.find(
            (policy) => policy.ratePlanId === ratePlan.id
          );

          if (mostBeneficialCxlPolicy?.hotelCancellationPolicy) {
            reservationPricing.hotelCxlPolicy = {
              id: mostBeneficialCxlPolicy.hotelCancellationPolicy.id,
              name: mostBeneficialCxlPolicy.hotelCancellationPolicy.name,
              description: mostBeneficialCxlPolicy.hotelCancellationPolicy.description,
              hourPrior: mostBeneficialCxlPolicy.hotelCancellationPolicy.hourPrior
            };
          }
        }

        if (!input.isSkipPaymentTerm) {
          const mostBeneficialPaymentTerms =
            await this.ratePlanSettingsService.getMostBeneficialPaymentTerm({
              ratePlans,
              hotelId: hotel.id,
              fromDate: fromDate,
              toDate: toDate
            });

          const mostBeneficialPaymentTerm = mostBeneficialPaymentTerms.find(
            (term) => term.ratePlanId === ratePlan.id
          );

          if (mostBeneficialPaymentTerm?.hotelPaymentTerm) {
            reservationPricing.hotelPaymentTerm = {
              id: mostBeneficialPaymentTerm.hotelPaymentTerm.id,
              hotelId: mostBeneficialPaymentTerm.hotelPaymentTerm.hotelId,
              name: mostBeneficialPaymentTerm.hotelPaymentTerm.name,
              code: mostBeneficialPaymentTerm.hotelPaymentTerm.code,
              description: mostBeneficialPaymentTerm.hotelPaymentTerm.description,
              payAtHotel: mostBeneficialPaymentTerm.hotelPaymentTerm.payAtHotel,
              payOnConfirmation: mostBeneficialPaymentTerm.hotelPaymentTerm.payOnConfirmation,
              payAtHotelDescription:
                mostBeneficialPaymentTerm.hotelPaymentTerm.payAtHotelDescription,
              payOnConfirmationDescription:
                mostBeneficialPaymentTerm.hotelPaymentTerm.payOnConfirmationDescription
            };
          }
        }

        reservationPricing.amenityPricingList = amenityPricingList;

        reservationPricing = this.mergeTaxDetailsMap(reservationPricing, hotelTaxMap);

        reservationPricing = this.finalizeReservationPricing(
          hotel,
          reservationPricing,
          lengthOfStay,
          pricingDecimalRoundingRule,
          hotel.taxSetting,
          pricingConfiguration
        );

        reservationPricing.index = reservation.index?.toString() || index.toString();

        // Forward adults & children age to client:
        reservationPricing.adults = reservation?.adults || 0;
        reservationPricing.childrenAgeList = reservation?.childrenAges || [];

        result.push(reservationPricing);

        index++;
      }

      if (!hotel.baseCurrency) {
        throw new BadRequestException('Hotel base currency not found');
      }

      // Build the complete booking pricing response using the migrated buildBookingPricing function
      const bookingPricing = this.buildBookingPricing(
        result,
        hotel.id,
        hotel.baseCurrency.code,
        hotelTaxMap, // hotelTaxMap - not available in current context
        hotelCityTaxMap, // hotelCityTaxMap - not available in current context
        input.translateTo
      );

      return bookingPricing;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async availableRoomProductCapacity(filter: AvailableRoomCapacityFilterDto) {
    const roomProducts = await this.roomProductRepository.findAll({
      hotelId: filter.hotelId,
      codeList: filter.codes,
      statusList: [RoomProductStatus.ACTIVE],
      typeList: filter.typeList,
      distributionChannelList: [DistributionChannel.GV_SALES_ENGINE, DistributionChannel.GV_VOICE]
    });

    const requiredAdult = filter.adult ?? 1;
    const requiredChildren = filter.childrenAges != null ? filter.childrenAges.length : 0;
    const requiredPets = filter.pets ?? 0;

    const availableRoomProducts = roomProducts
      .filter((roomProduct) => {
        const maxAdult = (roomProduct.maximumAdult || 0) + (roomProduct.extraBedAdult || 0);
        const maxChildren = (roomProduct.maximumKid || 0) + (roomProduct.extraBedKid || 0);
        const maxCap = (roomProduct.capacityDefault || 0) + (roomProduct.capacityExtra || 0);

        return (
          maxAdult >= requiredAdult &&
          maxChildren >= requiredChildren &&
          maxCap >= requiredAdult + requiredChildren
        );
      })
      .map((roomProduct) => {
        const result = this.calculateAllocationService.calculateAllocateCapacity({
          capacityDefault: roomProduct.capacityDefault,
          maximumAdult: roomProduct.maximumAdult,
          maximumChild: roomProduct.maximumKid,
          requestedAdult: requiredAdult,
          requestedChild: requiredChildren,
          requestedPet: requiredPets
        });

        return {
          ...roomProduct,
          allocatedAdultCount: result.allocatedAdultCount,
          allocatedChildCount: result.allocatedChildCount,
          allocatedExtraBedAdultCount: result.allocatedExtraBedAdultCount,
          allocatedExtraBedChildCount: result.allocatedExtraBedChildCount,
          allocatedPetCount: result.allocatedPetCount
        };
      });

    return availableRoomProducts;
  }

  async createReservationPricing(params: {
    input: CalculateReservationPricingInputDto;
    hotel: Hotel;
    roomProduct: RoomProduct;
    translateTo?: LanguageCodeEnum;
  }) {
    const { input, hotel, roomProduct, translateTo } = params;
    const reservationPricing = new ReservationPricingDto();

    const isCapacityAllocated =
      input.allocatedAdults != null &&
      input.allocatedChildren != null &&
      input.allocatedExtraAdults != null &&
      input.allocatedExtraChildren != null &&
      input.allocatedPets != null;

    if (!isCapacityAllocated) {
      const availableRoomProducts = await this.availableRoomProductCapacity({
        hotelId: hotel.id,
        ids: [roomProduct.id],
        codes: [input.roomProductCode ?? ''],
        adult: input.adults,
        childrenAges: input.childrenAges,
        pets: input.pets,
        status: RoomProductStatus.ACTIVE
      });

      if (availableRoomProducts.length === 0) {
        throw new BadRequestException('No available room product capacity');
      }
      const availableRoomProduct = availableRoomProducts[0];

      reservationPricing.allocatedAdults = availableRoomProduct.allocatedAdultCount;
      reservationPricing.allocatedChildren = availableRoomProduct.allocatedChildCount;
      reservationPricing.allocatedExtraAdults = availableRoomProduct.allocatedExtraBedAdultCount;
      reservationPricing.allocatedExtraChildren = availableRoomProduct.allocatedExtraBedChildCount;
      reservationPricing.allocatedPets = availableRoomProduct.allocatedPetCount;
    }

    const [roomProductRetailFeatures, roomProductStandardFeatures] = await Promise.all([
      this.roomProductRetailFeatureRepository.getRoomProductRetailFeatures({
        hotelId: hotel.id,
        roomProductIds: [roomProduct.id],
        translateTo: translateTo
      }),
      this.roomProductStandardFeatureRepository.getRoomProductStandardFeatures({
        hotelId: hotel.id,
        roomProductIds: [roomProduct.id],
        translateTo: translateTo
      })
    ]);

    const hotelRetailCategories = await this.hotelRetailCategoryRepository.findByRetailFeatureIds(
      hotel.id,
      roomProductRetailFeatures.map((feature) => feature.retailFeature.id)
    );

    for (const feature of roomProductRetailFeatures) {
      const hotelRetailCategory = hotelRetailCategories.find((category) =>
        category.hotelRetailFeatures.some((f) => f.id === feature.retailFeature.id)
      );
      if (hotelRetailCategory) {
        feature.retailFeature.hotelRetailCategory = hotelRetailCategory;
      }
    }

    const rfcImageList: any[] = [];
    for (const image of roomProduct.roomProductImages) {
      rfcImageList.push({
        id: image.id,
        rfcId: image.roomProductId,
        description: image.description,
        displaySequence: image.sequence,
        imageUrl: image.imageUrl ? await this.s3Service.getPreSignedUrl(image.imageUrl) : ''
      });
    }

    reservationPricing.roomProduct = {
      id: roomProduct.id,
      hotelId: hotel.id,
      name: roomProduct.name,
      code: roomProduct.code,
      description: roomProduct.description,
      capacityAdult: roomProduct.maximumAdult,
      capacityChildren: roomProduct.maximumKid,
      capacityExtra: roomProduct.capacityExtra,
      capacityDefault: roomProduct.capacityDefault,
      extraBedAdult: roomProduct.extraBedAdult,
      extraBedKid: roomProduct.extraBedKid,
      space: roomProduct.space,
      numberOfBedrooms: roomProduct.numberOfBedrooms,
      allocatedAdultCount: reservationPricing.allocatedAdults,
      allocatedChildCount: reservationPricing.allocatedChildren,
      allocatedExtraBedAdultCount: reservationPricing.allocatedExtraAdults,
      allocatedExtraBedChildCount: reservationPricing.allocatedExtraChildren,
      maximumAdult: roomProduct.maximumAdult,
      maximumKid: roomProduct.maximumKid,
      status: roomProduct.status,
      travelTag: roomProduct.travelTag?.join(','),
      occasion: roomProduct.occasion?.join(','),
      rfcImageList,
      retailFeatureList: roomProductRetailFeatures.map((feature) => ({
        id: feature.retailFeature.id,
        quantity: feature.quantity,
        name: feature.retailFeature.name,
        code: feature.retailFeature.code,
        iconImageUrl: feature.retailFeature.imageUrl,
        hotelRetailCategory: feature.retailFeature.hotelRetailCategory,
        measurementUnit: feature.retailFeature.measurementUnit,
        description: feature.retailFeature.description,
        retailFeatureImageList: [
          {
            imageUrl: feature.retailFeature.imageUrl
          }
        ]
      })),
      standardFeatureList: roomProductStandardFeatures.map((feature) => ({
        id: feature.standardFeature.id,
        quantity: 1,
        name: feature.standardFeature.name,
        code: feature.standardFeature.code,
        iconImageUrl: feature.standardFeature.imageUrl,
        retailFeatureImageList: [
          {
            imageUrl: feature.standardFeature.imageUrl
          }
        ]
      }))
    };

    return reservationPricing;
  }

  async getPricingDecimalRoundingRule(hotelId: string) {
    const hotelConfiguration = await this.hotelConfigurationRepository.getHotelConfiguration({
      hotelId: hotelId,
      configType: HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE
    });

    const defaultRoundingRule = new HotelPricingDecimalRoundingRuleDto();
    if (hotelConfiguration) {
      return {
        roundingMode:
          hotelConfiguration.configValue?.roundingMode ?? defaultRoundingRule.roundingMode,
        decimalUnits:
          hotelConfiguration.configValue?.decimalUnits ?? defaultRoundingRule.decimalUnits
      };
    }

    return defaultRoundingRule;
  }

  async getRatePlanTaxes(input: {
    ratePlanCodes: string[];
    hotelId: string;
  }): Promise<HotelTaxSetting[]> {
    const { hotelId, ratePlanCodes } = input;
    return await this.hotelTaxSettingRepository.findAll(
      {
        hotelId,
        ratePlanCodes
      },
      {
        id: true,
        taxCode: true
      }
    );
  }

  async getRatePlanExtraServices(
    filter: { ratePlanIds: string[]; extrasIds: string[] },
    select?: FindOptionsSelect<RatePlanExtraService>
  ) {
    return this.ratePlanExtraServicesRepository.findAll(
      {
        serviceIds: filter.extrasIds,
        ratePlanIds: filter.ratePlanIds
      },
      select
    );
  }

  async getRoomProductExtras(
    filter: { roomProductIds: string[]; extrasIds: string[] },
    select?: FindOptionsSelect<RoomProductExtra>
  ) {
    return this.roomProductExtraRepository.findAll(
      {
        extrasIds: filter.extrasIds,
        roomProductIds: filter.roomProductIds
      },
      select
    );
  }

  async getHotelAmenities(filter: { hotelId: string }, select?: FindOptionsSelect<HotelAmenity>) {
    const { hotelId } = filter;

    const hotelAmenities = await this.hotelAmenityRepository.findAll(
      {
        hotelId: hotelId,
        statusList: [AmenityStatusEnum.ACTIVE],
        distributionChannelList: [DistributionChannel.GV_SALES_ENGINE]
      },
      select
    );

    return hotelAmenities;
  }

  async getHotelAmenityPrices(
    filter: { hotelAmenityIds: string[]; relations?: FindOptionsRelations<HotelAmenityPrice> },
    select?: FindOptionsSelect<HotelAmenityPrice>
  ) {
    return this.hotelAmenityPriceRepository.find({
      where: {
        hotelAmenityId: In(filter.hotelAmenityIds)
      },
      relations: filter.relations,
      select
    });
  }

  getExtraServiceCodes(input: CalculateBookingPricingInputDto): string[] {
    return input.reservations
      .flatMap((reservation) => reservation.amenityList ?? [])
      .map((amenity) => amenity.code)
      .filter((code) => code !== null && code !== undefined);
  }

  private getAmenityPrice(
    hotelAmenity?: HotelAmenity,
    ageCategoryCode: string = HotelAgeCategoryCodeEnum.DEFAULT
  ) {
    if (!hotelAmenity) {
      return 0;
    }

    const hotelAmenityPrices = hotelAmenity.hotelAmenityPrices;
    const hotelAmenityPrice = hotelAmenityPrices.find(
      (a) => a.hotelAgeCategory.code === ageCategoryCode
    );
    return hotelAmenityPrice?.price ? Number(hotelAmenityPrice.price) : 0;
  }

  /**
   * Finalizes reservation pricing by aggregating room and amenity pricing,
   * handling city tax calculations, and determining payment terms.
   * This method follows the exact logic from Java implementation.
   *
   * @param hotel - Hotel information
   * @param reservationPricing - Reservation pricing data to finalize
   * @param lengthOfStay - Number of nights for the stay
   * @param pricingDecimalRoundingRule - Decimal rounding rules for pricing calculations
   */
  finalizeReservationPricing(
    hotel: Hotel, // HotelDto type
    reservationPricing: ReservationPricingDto,
    lengthOfStay: number,
    pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto,
    isIsePricingDisplay: TaxSettingEnum,
    pricingConfiguration: {
      hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number };
      types: RoomProductType[];
    }
  ): ReservationPricingDto {
    try {
      // Input validation
      if (!hotel) {
        throw new BadRequestException('Hotel information is required');
      }
      if (!reservationPricing) {
        throw new BadRequestException('Reservation pricing data is required');
      }
      if (!lengthOfStay || lengthOfStay <= 0) {
        throw new BadRequestException('Length of stay must be greater than 0');
      }
      if (!pricingDecimalRoundingRule) {
        throw new BadRequestException('Pricing decimal rounding rule is required');
      }

      const decimalUnits = pricingDecimalRoundingRule.decimalUnits;
      const roundingMode = pricingDecimalRoundingRule.roundingMode;

      const roomProductSalesPlan = reservationPricing.roomProductSalesPlan;
      const cityTaxAmount = roomProductSalesPlan?.cityTaxAmount || 0;
      const calculatedCityTax = roomProductSalesPlan?.calculatedCityTax;

      const averageRoomGrossAmount = roomProductSalesPlan?.averageDailyRate || 0;

      const roomBaseAmount = roomProductSalesPlan?.totalBaseAmount || 0;

      const roomGrossAmount = roomProductSalesPlan?.totalGrossAmount || 0;
      const roomSellingAmount = roomProductSalesPlan?.totalSellingRate || 0;
      const averageDailyRate = roomProductSalesPlan?.averageDailyRate || 0;

      let amenityBaseAmount = 0;
      let amenityTaxAmount = 0;
      let amenityGrossAmount = 0;
      let amenitySellingAmount = 0;

      // Process amenity pricing list - following Java logic exactly
      if (
        reservationPricing.amenityPricingList &&
        reservationPricing.amenityPricingList.length > 0
      ) {
        for (const amenityPricing of reservationPricing.amenityPricingList) {
          if (amenityPricing.isSalesPlanIncluded === true) {
            // included services amount is already counted in accommodation amount
            continue;
          }

          amenityBaseAmount += amenityPricing.totalBaseAmount || 0;
          amenityTaxAmount += amenityPricing.taxAmount || 0;
          amenityGrossAmount += amenityPricing.totalGrossAmount || 0;
          amenitySellingAmount += amenityPricing.totalSellingRate || 0;
        }
      }

      // Calculate totals
      const totalBaseAmount = roomBaseAmount + amenityBaseAmount;
      const taxAmount = roomProductSalesPlan?.taxAmount || 0;
      const totalGrossAmount = roomGrossAmount + amenityGrossAmount;
      const totalSellingAmount = roomSellingAmount + amenitySellingAmount;

      // Set basic pricing amounts
      reservationPricing.cityTaxAmount = cityTaxAmount;
      reservationPricing.calculatedCityTax = calculatedCityTax;
      reservationPricing.totalBaseAmount = totalBaseAmount;
      reservationPricing.taxAmount = taxAmount;
      reservationPricing.totalGrossAmount = totalGrossAmount;
      reservationPricing.totalSellingRate = totalSellingAmount;
      reservationPricing.totalSellingRateBySetting =
        isIsePricingDisplay === TaxSettingEnum.INCLUSIVE ? totalSellingAmount : totalBaseAmount;

      // Set accommodation amounts
      reservationPricing.totalAccommodationAmount = roomGrossAmount;
      reservationPricing.totalAccommodationAmountBySetting =
        isIsePricingDisplay === TaxSettingEnum.INCLUSIVE ? roomGrossAmount : roomBaseAmount;
      reservationPricing.averageAccommodationAmount = averageRoomGrossAmount;

      // Calculate ADR (Average Daily Rate) - following Java logic exactly
      const reservationAverageDailyTaxAmount = this.divideWithRounding(
        taxAmount / lengthOfStay,
        roundingMode,
        decimalUnits
      );

      const reservationAdrSubTotal =
        hotel.taxSetting === TaxSettingEnum.INCLUSIVE
          ? averageDailyRate
          : averageDailyRate + reservationAverageDailyTaxAmount;

      const reservationNetAdrSubTotal =
        hotel.taxSetting === TaxSettingEnum.INCLUSIVE
          ? averageDailyRate - reservationAverageDailyTaxAmount
          : averageDailyRate;

      const reservationAdr = this.divideWithRounding(
        totalGrossAmount / lengthOfStay,
        roundingMode,
        decimalUnits
      );

      reservationPricing.adrSubTotal = reservationAdrSubTotal;
      reservationPricing.adrSubTotalBySetting = reservationNetAdrSubTotal;
      reservationPricing.averageDailyRate = reservationAdr;

      // Strike through pricing attributes - following Java logic exactly
      const totalBaseAmountBeforeAdjustment =
        roomProductSalesPlan?.totalBaseAmountBeforeAdjustment || 0;
      const totalGrossAmountBeforeAdjustment =
        roomProductSalesPlan?.totalGrossAmountBeforeAdjustment || 0;
      const adjustmentPercentage = roomProductSalesPlan?.adjustmentPercentage;
      const shouldShowStrikeThrough = roomProductSalesPlan?.shouldShowStrikeThrough;

      reservationPricing.totalBaseAmountBeforeAdjustment = totalBaseAmountBeforeAdjustment;
      reservationPricing.totalGrossAmountBeforeAdjustment = totalGrossAmountBeforeAdjustment;
      reservationPricing.adjustmentPercentage = adjustmentPercentage;
      reservationPricing.shouldShowStrikeThrough = shouldShowStrikeThrough;

      // Reservation payment term - following Java logic exactly
      const mostBeneficialPaymentTerm = reservationPricing.hotelPaymentTerm;
      const reservationPayOnConfirmationRate = mostBeneficialPaymentTerm?.payOnConfirmation || 0;
      const reservationAtHotelRate = mostBeneficialPaymentTerm?.payAtHotel || 0;

      // Calculate city tax amounts by charge method
      let totalChargedCityTaxAmount = 0;
      let totalUnChargedCityTaxAmount = 0;

      if (
        calculatedCityTax &&
        calculatedCityTax.taxBreakdown &&
        calculatedCityTax.taxBreakdown.length > 0
      ) {
        totalChargedCityTaxAmount = calculatedCityTax.taxBreakdown
          .filter((cityTax) => cityTax.chargeMethod === CityTaxChargeMethodEnum.PAY_ON_CONFIRMATION)
          .reduce((sum, cityTax) => sum + (cityTax.amount || 0), 0);

        totalUnChargedCityTaxAmount = calculatedCityTax.taxBreakdown
          .filter((cityTax) => cityTax.chargeMethod === CityTaxChargeMethodEnum.PAY_AT_HOTEL)
          .reduce((sum, cityTax) => sum + (cityTax.amount || 0), 0);
      }

      // Calculate payment amounts - following Java logic exactly
      const chargedReservationGrossAmountWithoutCityTax =
        totalGrossAmount - (roomProductSalesPlan?.cityTaxAmount || 0);
      const totalChargedReservationGrossAmount =
        chargedReservationGrossAmountWithoutCityTax + totalChargedCityTaxAmount;

      let reservationPayOnConfirmationAmount = this.divideWithRounding(
        totalChargedReservationGrossAmount * reservationPayOnConfirmationRate,
        roundingMode,
        decimalUnits
      );

      let reservationPayAtHotelAmount =
        this.divideWithRounding(
          totalChargedReservationGrossAmount * reservationAtHotelRate,
          roundingMode,
          decimalUnits
        ) + totalUnChargedCityTaxAmount;

      // Compare with total gross and adjust for rounding differences
      const expectedTotalGross = this.divideWithRounding(
        reservationPayOnConfirmationAmount + reservationPayAtHotelAmount,
        roundingMode,
        decimalUnits
      );

      if (expectedTotalGross !== totalGrossAmount) {
        const diff = totalGrossAmount - expectedTotalGross;
        if (diff !== 0 && Math.abs(diff) > 0.01) {
          if (diff < 0) {
            reservationPayOnConfirmationAmount += diff;
          } else {
            reservationPayAtHotelAmount += diff;
          }
        }
      }

      reservationPricing.payOnConfirmationAmount = reservationPayOnConfirmationAmount;
      reservationPricing.payAtHotelAmount = reservationPayAtHotelAmount;

      return reservationPricing;
    } catch (error) {
      console.error('Error in finalizeReservationPricing:', error);
      throw new BadRequestException(`Failed to finalize reservation pricing: ${error.message}`);
    }
  }

  /**
   * Calculates various Average Daily Rates (ADR) based on tax settings
   */
  private calculateAverageDailyRates(
    reservationPricing: ReservationPricingDto,
    lengthOfStay: number,
    hotelTaxSetting: TaxSettingEnum,
    pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto
  ): void {
    try {
      if (!reservationPricing.roomProductSalesPlan || lengthOfStay <= 0) {
        return;
      }

      const roomPricing = reservationPricing.roomProductSalesPlan;

      // Calculate ADR based on tax setting
      if (hotelTaxSetting === TaxSettingEnum.INCLUSIVE) {
        // For inclusive tax, ADR is based on gross amount (includes tax)
        reservationPricing.averageDailyRate = this.divideWithRounding(
          (roomPricing.totalGrossAmount || 0) / lengthOfStay,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        );

        roomPricing.averageDailyRate = reservationPricing.averageDailyRate;

        // ADR without tax for inclusive setting
        roomPricing.averageDailyRateWithoutTax = this.divideWithRounding(
          (roomPricing.totalBaseAmount || 0) / lengthOfStay,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        );
      } else if (hotelTaxSetting === TaxSettingEnum.EXCLUSIVE) {
        // For exclusive tax, ADR is based on base amount (excludes tax)
        reservationPricing.averageDailyRate = this.divideWithRounding(
          (roomPricing.totalBaseAmount || 0) / lengthOfStay,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        );

        roomPricing.averageDailyRate = reservationPricing.averageDailyRate;

        // ADR with tax for exclusive setting
        roomPricing.averageDailyRateWithTax = this.divideWithRounding(
          (roomPricing.totalGrossAmount || 0) / lengthOfStay,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        );
      }

      // Calculate ADR including city tax
      const totalWithCityTax =
        (roomPricing.totalGrossAmount || 0) + (reservationPricing.cityTaxAmount || 0);
      roomPricing.averageDailyRateIncludingCityTax = this.divideWithRounding(
        totalWithCityTax / lengthOfStay,
        pricingDecimalRoundingRule.roundingMode,
        pricingDecimalRoundingRule.decimalUnits
      );
    } catch (error) {
      console.error('Error calculating average daily rates:', error);
      throw new BadRequestException(`Failed to calculate average daily rates: ${error.message}`);
    }
  }

  /**
   * Utility method for division with proper rounding
   */
  private divideWithRounding(
    value: number,
    roundingMode: RoundingModeEnum,
    decimalPlaces: number
  ): number {
    try {
      return DecimalRoundingHelper.conditionalRounding(value, roundingMode, decimalPlaces);
    } catch (error) {
      console.error('Error in divideWithRounding:', error);
      return Number(value.toFixed(decimalPlaces));
    }
  }

  /**
   * Builds booking pricing from a list of reservation pricing DTOs
   * Migrated from Java CalculateBookingPricingServiceImpl.buildBookingPricing
   */
  buildBookingPricing(
    reservationPricingList: ReservationPricingDto[],
    hotelId: string,
    currencyCode: string,
    hotelTaxMap?: Map<string, HotelTax>,
    hotelCityTaxMap?: Map<string, HotelCityTax>,
    translateTo?: string
  ): BookingPricingDto {
    try {
      if (!reservationPricingList || reservationPricingList.length === 0) {
        throw new BadRequestException('Reservation pricing list cannot be empty');
      }

      // Aggregate basic amounts using reduce (matching Java stream operations)
      const totalGrossAmount = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.totalGrossAmount || 0),
        0
      );

      const totalBaseAmount = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.totalBaseAmount || 0),
        0
      );

      const averageDailyRate = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.averageDailyRate || 0),
        0
      );

      const taxAmount = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.taxAmount || 0),
        0
      );

      const payOnConfirmationAmount = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.payOnConfirmationAmount || 0),
        0
      );

      const payAtHotelAmount = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.payAtHotelAmount || 0),
        0
      );

      const totalSellingRate = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.totalSellingRate || 0),
        0
      );
      const totalSellingRateBySetting = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.totalSellingRateBySetting || 0),
        0
      );

      const cityTaxAmount = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.cityTaxAmount || 0),
        0
      );

      const adrSubTotal = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.adrSubTotal || 0),
        0
      );

      const adrSubTotalBySetting = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.adrSubTotalBySetting || 0),
        0
      );

      const bookingAccommodationTaxAmount = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.accommodationTaxAmount || 0),
        0
      );

      const bookingExtraServiceTaxAmount = reservationPricingList.reduce(
        (sum, pricing) => sum + (pricing.extraServiceTaxAmount || 0),
        0
      );

      // Process accommodation taxes (matching Java groupingBy logic)
      const accommodationTaxMap = new Map<string, { amount: number; taxDto: any }>();
      reservationPricingList.forEach((pricing) => {
        if (pricing.accommodationTaxList && pricing.accommodationTaxList.length > 0) {
          pricing.accommodationTaxList.forEach((tax) => {
            const taxCode = tax.code;
            if (accommodationTaxMap.has(taxCode)) {
              accommodationTaxMap.get(taxCode)!.amount += tax.amount || 0;
            } else {
              accommodationTaxMap.set(taxCode, {
                amount: tax.amount || 0,
                taxDto: hotelTaxMap?.get(taxCode) || tax
              });
            }
          });
        }
      });

      const bookingAccommodationTaxList = Array.from(accommodationTaxMap.entries()).map(
        ([taxCode, data]) => ({
          ...data.taxDto,
          code: taxCode,
          amount: data.amount
        })
      );

      // Process extra service taxes (matching Java groupingBy logic)
      const extraServiceTaxMap = new Map<string, { amount: number; taxDto: any }>();
      reservationPricingList.forEach((pricing) => {
        if (pricing.extraServiceTaxList && pricing.extraServiceTaxList.length > 0) {
          pricing.extraServiceTaxList.forEach((tax) => {
            const taxCode = tax.code;
            if (extraServiceTaxMap.has(taxCode)) {
              extraServiceTaxMap.get(taxCode)!.amount += tax.amount || 0;
            } else {
              extraServiceTaxMap.set(taxCode, {
                amount: tax.amount || 0,
                taxDto: hotelTaxMap?.get(taxCode) || tax
              });
            }
          });
        }
      });

      const bookingExtraServiceTaxList = Array.from(extraServiceTaxMap.entries()).map(
        ([taxCode, data]) => ({
          ...data.taxDto,
          code: taxCode,
          amount: data.amount
        })
      );

      // Process general taxes from taxDetailsMap (matching Java logic)
      const generalTaxMap = new Map<string, number>();
      reservationPricingList.forEach((pricing) => {
        if (pricing.taxDetailsMap) {
          try {
            const taxDetails =
              typeof pricing.taxDetailsMap === 'string'
                ? JSON.parse(pricing.taxDetailsMap)
                : pricing.taxDetailsMap;

            Object.entries(taxDetails).forEach(([taxCode, amount]) => {
              const currentAmount = generalTaxMap.get(taxCode) || 0;
              generalTaxMap.set(taxCode, currentAmount + (Number(amount) || 0));
            });
          } catch (error) {
            console.warn('Error parsing taxDetailsMap:', error);
          }
        }
      });

      const bookingTaxList = Array.from(generalTaxMap.entries()).map(([taxCode, amount]) => ({
        ...(hotelTaxMap?.get(taxCode) || {}),
        code: taxCode,
        amount
      }));

      // Process city taxes (matching Java logic)
      const cityTaxMap = new Map<string, { amount: number; cityTaxDto: any }>();
      reservationPricingList.forEach((pricing) => {
        if (
          pricing.calculatedCityTax &&
          pricing.calculatedCityTax.taxBreakdown &&
          pricing.calculatedCityTax.taxBreakdown.length > 0
        ) {
          pricing.calculatedCityTax.taxBreakdown.forEach((cityTax) => {
            const cityTaxCode = cityTax.code;
            if (cityTaxMap.has(cityTaxCode)) {
              cityTaxMap.get(cityTaxCode)!.amount += cityTax.amount || 0;
            } else {
              cityTaxMap.set(cityTaxCode, {
                amount: cityTax.amount || 0,
                cityTaxDto: hotelCityTaxMap?.get(cityTaxCode) || cityTax
              });
            }
          });
        }
      });

      const bookingCityTaxList = Array.from(cityTaxMap.entries()).map(([cityTaxCode, data]) => ({
        ...data.cityTaxDto,
        code: cityTaxCode,
        amount: data.amount
      }));

      // Build the booking pricing response (matching Java builder pattern)
      const bookingPricing: BookingPricingDto = {
        hotelId,
        currencyCode,
        translateTo: translateTo || undefined,
        reservationPricingList,
        totalGrossAmount,
        totalBaseAmount,
        averageDailyRate,
        taxAmount,
        payOnConfirmationAmount,
        payAtHotelAmount,
        totalSellingRate,
        totalSellingRateBySetting,
        cityTaxAmount,
        adrSubTotal,
        adrSubTotalBySetting,
        bookingAccommodationTaxAmount,
        bookingExtraServiceTaxAmount,
        bookingAccommodationTaxList,
        bookingExtraServiceTaxList,
        bookingTaxList,
        bookingCityTaxList
      };

      return bookingPricing;
    } catch (error) {
      console.error('Error in buildBookingPricing:', error);
      throw new BadRequestException(`Failed to build booking pricing: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách hotel tax đã được dịch theo ngôn ngữ yêu cầu
   * Migrated from Java CalculateBookingPricingServiceImpl.getTranslatedHotelTaxMap
   *
   * @param hotelId ID của hotel
   * @param translateTo Mã ngôn ngữ cần dịch (optional)
   * @returns Map với key là tax code và value là HotelTaxDto đã được dịch
   */
  private async getTranslatedHotelTaxMap(
    hotelId: string,
    translateTo?: string
  ): Promise<Map<string, HotelTax>> {
    try {
      const hotelTaxList = await this.hotelTaxRepository.findAllForBookingCalculate({
        hotelId
      });

      // Apply translations if translateTo is provided
      if (translateTo && hotelTaxList.length > 0) {
        hotelTaxList.forEach((tax) => {
          const translationList = tax.translations;
          if (translationList && translationList.length > 0) {
            const translation = translationList.find(
              (trans: any) => trans.languageCode === translateTo
            );
            if (translation) {
              if (translation.name) {
                tax.name = translation.name;
              }
              if (translation.description) {
                tax.description = translation.description;
              }
            }
          }
        });
      }

      // Convert to Map with tax code as key
      const hotelTaxMap = new Map<string, HotelTax>();
      hotelTaxList.forEach((tax) => {
        hotelTaxMap.set(tax.code, tax);
      });

      return hotelTaxMap;
    } catch (error) {
      console.error('Error in getTranslatedHotelTaxMap:', error);
      return new Map<string, any>();
    }
  }

  /**
   * Lấy danh sách hotel city tax đã được dịch theo ngôn ngữ yêu cầu
   * Migrated from Java CalculateBookingPricingServiceImpl.getTranslatedHotelCityTaxMap
   *
   * @param hotelId ID của hotel
   * @param translateTo Mã ngôn ngữ cần dịch (optional)
   * @returns Map với key là city tax code và value là HotelCityTaxDto đã được dịch
   */
  private async getTranslatedHotelCityTaxMap(
    hotelId: string,
    translateTo?: string
  ): Promise<Map<string, HotelCityTax>> {
    try {
      const hotelCityTaxList = await this.hotelCityTaxRepository.findAll({
        hotelId,
        statuses: [CityTaxStatusEnum.ACTIVE]
      });

      // Apply translations if translateTo is provided
      if (translateTo && hotelCityTaxList.length > 0) {
        hotelCityTaxList.forEach((cityTax) => {
          const translationList = cityTax.translations;
          if (translationList && translationList.length > 0) {
            const translation = translationList.find(
              (trans: any) => trans.languageCode === translateTo
            );
            if (translation) {
              if (translation.name) {
                cityTax.name = translation.name;
              }
              if (translation.description) {
                cityTax.description = translation.description;
              }
            }
          }
        });
      }

      // Convert to Map with city tax code as key
      const hotelCityTaxMap = new Map<string, HotelCityTax>();
      hotelCityTaxList.forEach((cityTax) => {
        hotelCityTaxMap.set(cityTax.code, cityTax);
      });

      return hotelCityTaxMap;
    } catch (error) {
      console.error('Error in getTranslatedHotelCityTaxMap:', error);
      return new Map<string, any>();
    }
  }

  /**
   * Merges tax details from room and amenity pricing into reservation pricing
   * Migrated from Java CalculateBookingPricingServiceImpl.mergeTaxDetailsMap
   */
  private mergeTaxDetailsMap(
    reservationPricing: ReservationPricingDto,
    hotelTaxMap: Map<string, HotelTax>
  ): ReservationPricingDto {
    // Merge amenity tax details (excluding sales plan included amenities)
    const amenityTaxDetailsMap: Record<string, Decimal> = {};
    reservationPricing.amenityPricingList
      .filter((item) => !item.isSalesPlanIncluded)
      .filter((item) => item.taxDetailsMap && Object.keys(item.taxDetailsMap).length > 0)
      .forEach((amenityPricing) => {
        Object.entries(amenityPricing.taxDetailsMap).forEach(([taxCode, amount]) => {
          if (amenityTaxDetailsMap[taxCode]) {
            amenityTaxDetailsMap[taxCode] = amenityTaxDetailsMap[taxCode].add(amount);
          } else {
            amenityTaxDetailsMap[taxCode] = new Decimal(amount);
          }
        });
      });

    const includedServiceTaxDetailsMap: Record<string, Decimal> = {};
    reservationPricing.amenityPricingList
      .filter((item) => item.isSalesPlanIncluded)
      .filter((item) => item.taxDetailsMap && Object.keys(item.taxDetailsMap).length > 0)
      .forEach((amenityPricing) => {
        Object.entries(amenityPricing.taxDetailsMap).forEach(([taxCode, amount]) => {
          if (amenityTaxDetailsMap[taxCode]) {
            amenityTaxDetailsMap[taxCode] = amenityTaxDetailsMap[taxCode].add(amount);
          } else {
            amenityTaxDetailsMap[taxCode] = new Decimal(amount);
          }
        });
      });

    const roomProductSalesPlan = reservationPricing.roomProductSalesPlan;
    const roomTaxDetailsMap = roomProductSalesPlan?.roomTaxDetailsMap || {};

    // Merge room and included service tax details
    // const accommodationTaxMaps = [roomTaxDetailsMap, includedServiceTaxDetailsMap].filter(
    //   (map) => map && Object.keys(map).length > 0
    // );
    const accommodationTaxMaps: Record<string, Decimal>[] = [];

    const accommodationTaxDetailsMap: Record<string, Decimal> = {};
    accommodationTaxMaps.forEach((taxMap) => {
      Object.entries(taxMap).forEach(([taxCode, amount]) => {
        if (accommodationTaxDetailsMap[taxCode]) {
          accommodationTaxDetailsMap[taxCode] = accommodationTaxDetailsMap[taxCode].add(amount);
        } else {
          accommodationTaxDetailsMap[taxCode] = new Decimal(amount);
        }
      });
    });

    // Calculate total accommodation tax amount
    const accommodationTaxAmount = Object.values(roomTaxDetailsMap).reduce(
      (sum, amount) => sum.add(amount),
      new Decimal(0)
    );

    // Calculate total amenity tax amount
    const amenityTaxAmount = Object.values(amenityTaxDetailsMap).reduce(
      (sum, amount) => sum.add(amount),
      new Decimal(0)
    );

    // Combine accommodation and amenity tax details
    const combinedTaxDetailsMap: Record<string, Decimal> = { ...accommodationTaxDetailsMap };
    Object.entries(amenityTaxDetailsMap).forEach(([taxCode, amount]) => {
      if (combinedTaxDetailsMap[taxCode]) {
        combinedTaxDetailsMap[taxCode] = combinedTaxDetailsMap[taxCode].add(amount);
      } else {
        combinedTaxDetailsMap[taxCode] = amount;
      }
    });

    // Set calculated amounts on reservation pricing
    reservationPricing.accommodationTaxAmount = accommodationTaxAmount.toNumber();
    reservationPricing.extraServiceTaxAmount = amenityTaxAmount.toNumber();

    // Convert combined tax details map to string format for storage
    const taxDetailsMapString = Object.fromEntries(
      Object.entries(combinedTaxDetailsMap).map(([key, value]) => [key, value.toNumber()])
    );
    reservationPricing.taxDetailsMap = taxDetailsMapString;
    reservationPricing.taxAccommodationDetailsMap = roomTaxDetailsMap;
    // Create accommodation tax list from tax details
    reservationPricing.accommodationTaxList = Object.entries(roomTaxDetailsMap).map(
      ([taxCode, amount]) => {
        const hotelTax = hotelTaxMap.get(taxCode);
        if (!hotelTax) {
          // TODO: Handle case where hotel tax is not found
          throw new Error(`Hotel tax not found for code: ${taxCode}`);
        }

        return {
          id: hotelTax.id,
          hotelId: hotelTax.hotelId,
          name: hotelTax.name,
          code: hotelTax.code,
          rate: hotelTax.rate,
          amount: amount,
          description: hotelTax.description
        };
      }
    );

    const extraServiceTaxList: TaxDto[] = [];

    for (const [taxCode, amount] of Object.entries(amenityTaxDetailsMap)) {
      const hotelTax = hotelTaxMap.get(taxCode);
      if (!hotelTax) {
        // TODO: Handle case where hotel tax is not found
        // throw new Error(`Hotel tax not found for code: ${taxCode}`);
        continue;
      }

      extraServiceTaxList.push({
        id: hotelTax.id,
        hotelId: hotelTax.hotelId,
        name: hotelTax.name,
        code: hotelTax.code,
        rate: hotelTax.rate,
        amount: amount.toNumber(),
        description: hotelTax.description
      });
    }

    // Create extra service tax list from amenity tax details
    reservationPricing.extraServiceTaxList = extraServiceTaxList;
    return reservationPricing;
  }
}
