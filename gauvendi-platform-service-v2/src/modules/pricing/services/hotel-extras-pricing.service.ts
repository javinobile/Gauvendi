import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import {
  RatePlanExtraServiceType,
  RoomProductExtraType,
  RoundingModeEnum,
  SellingTypeEnum
} from '@src/core/enums/common';
import {
  DeleteHotelAmenityDto,
  GetCppExtrasServiceListQueryDto,
  HotelAmenityInputDto,
  UploadHotelAmenityImageDto
} from '@src/modules/hotel/dtos/hotel-amenity-filter.dto';
import { HotelRepository } from '@src/modules/hotel/repositories/hotel.repository';
import { CalculateAmenityPricingService } from '@src/modules/hotel/services/calculate-amenity-pricing.service';
import { RatePlanSettingsService } from '@src/modules/rate-plan-settings/services/rate-plan-settings.service';
import { BadRequestException } from 'src/core/exceptions';
import { S3Service } from 'src/core/s3/s3.service';
import { HotelAmenityRepository } from 'src/modules/hotel/repositories/hotel-amenity.repository';
import { In, Repository } from 'typeorm';
import {
  HotelExtrasListPricingFilterDto,
  HotelExtrasListPricingResponseDto
} from '../dtos/hotel-extras-pricing.dto';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';

@Injectable()
export class HotelExtrasPricingService {
  private readonly logger = new Logger(HotelExtrasPricingService.name);

  constructor(
    private readonly hotelExtrasRepository: HotelAmenityRepository,

    private readonly hotelRepository: HotelRepository,

    private readonly calculateAmenityPricingService: CalculateAmenityPricingService,

    private readonly ratePlanSettingsService: RatePlanSettingsService,

    @InjectRepository(RoomProductExtra, DbName.Postgres)
    private readonly roomProductExtraRepository: Repository<RoomProductExtra>,

    private readonly s3Service: S3Service
  ) {}

  /**
   * Calculate total gross amount for COMBO selling type by summing all linked amenities' default prices
   * @param comboAmenity - The COMBO amenity item
   * @param linkedAmenityList - Array of linked amenity items fetched from database
   * @returns Total gross amount as number
   */
  public calculateComboTotalGrossAmount(
    comboAmenity: HotelAmenity,
    linkedAmenityList: HotelAmenity[]
  ): number {
    if (!comboAmenity.linkedAmenityCode || !linkedAmenityList?.length) {
      return 0;
    }

    // Parse comma-separated codes
    const linkedCodes = comboAmenity.linkedAmenityCode
      .split(',')
      .map((code: string) => code.trim())
      .filter((code: string) => code.length > 0);

    if (linkedCodes.length === 0) {
      return 0;
    }

    // Find matching linked amenities and sum their default prices
    const totalGrossAmount = linkedAmenityList
      .filter((linkedAmenity) => linkedCodes.includes(linkedAmenity.code))
      .reduce((sum, linkedAmenity) => {
        const defaultPrice = linkedAmenity.hotelAmenityPrices?.find(
          (price: any) => price.hotelAgeCategory?.code === 'DEFAULT'
        )?.price;
        return sum + (Number(defaultPrice) || 0);
      }, 0);

    return totalGrossAmount;
  }

  /**
   * Get linked amenity codes from a COMBO amenity
   * @param comboAmenity - The COMBO amenity item
   * @returns Array of linked amenity codes
   */
  public getLinkedAmenityCodes(comboAmenity: any): string[] {
    if (!comboAmenity.linkedAmenityCode) {
      return [];
    }

    return comboAmenity.linkedAmenityCode
      .split(',')
      .map((code: string) => code.trim())
      .filter((code: string) => code.length > 0);
  }

  async hotelExtrasList(filter: HotelExtrasListPricingFilterDto): Promise<any[]> {
    const { isExclLinkedAmenity } = filter;
    try {
      const data = await this.hotelExtrasRepository.getHotelAmenityList({
        ...filter,
        relations: ['hotelAmenityPrices', 'hotelAmenityPrice.hotelAgeCategory']
      });

      if (!data?.length) {
        return [];
      }

      // for selling type is COMBO, we need to get all linked amenities
      const comboAmenityList = data.filter((item) => item.sellingType === SellingTypeEnum.COMBO);
      const uniqueComboAmenityList = [
        ...new Set(
          comboAmenityList
            .map((item) => item.linkedAmenityCode.split(',').map((code) => code.trim()))
            .flat()
        )
      ];

      const linkedAmenityList = await this.hotelExtrasRepository.getHotelAmenityList({
        codeList: uniqueComboAmenityList,
        hotelId: filter.hotelId,
        relations: ['hotelAmenityPrices', 'hotelAmenityPrice.hotelAgeCategory']
      });

      let linkedAmenityCodeList: string[] = [];

      const mappedData: HotelExtrasListPricingResponseDto[] = await Promise.all(
        data.map(async (item) => {
          const iconImageUrl = item.iconImageUrl
            ? await this.s3Service.getPreSignedUrl(item.iconImageUrl)
            : '';
          const defaultPrice = item.hotelAmenityPrices?.find(
            (price) => price.hotelAgeCategory?.code === 'DEFAULT'
          )?.price;

          // Calculate total gross amount: for COMBO, sum linked amenities; otherwise use default price
          let totalGrossAmount: number;
          let linkedAmenityCodes: string[] = [];

          if (item.sellingType === SellingTypeEnum.COMBO) {
            linkedAmenityCodes = this.getLinkedAmenityCodes(item);
            linkedAmenityCodeList.push(...linkedAmenityCodes);
            totalGrossAmount = this.calculateComboTotalGrossAmount(item, linkedAmenityList);
          } else {
            totalGrossAmount = Number(defaultPrice) || 0;
          }

          return {
            id: item.id,
            name: item.name,
            code: item.code,
            description: item.description,
            baseRate: item.baseRate,
            amenityType: item.amenityType,
            pricingUnit: item.pricingUnit,
            iconImageUrl: iconImageUrl,
            displaySequence: item.displaySequence,
            availability: item.availability,
            postNextDay: item.postNextDay,
            totalGrossAmount: totalGrossAmount,
            totalBaseAmount: totalGrossAmount,
            mappingHotelAmenityCode: item.mappingHotelAmenityCode,
            translationList: item.translations,
            status: item.status,
            isePricingDisplayMode: item.isePricingDisplayMode,
            distributionChannelList: item.distributionChannel,
            hotelAmenityPrices: item.hotelAmenityPrices?.map((price) => ({
              id: price.id,
              price: price.price,
              hotelAmenityId: price.hotelAmenityId,
              hotelAgeCategoryId: price.hotelAgeCategoryId,
              hotelAgeCategory: {
                id: price.hotelAgeCategory?.id,
                name: price.hotelAgeCategory?.name,
                code: price.hotelAgeCategory?.code,
                fromAge: price.hotelAgeCategory?.fromAge,
                toAge: price.hotelAgeCategory?.toAge
              }
            })),
            linkedAmenityList: linkedAmenityCodes
          };
        })
      );

      return mappedData.filter((item) =>
        isExclLinkedAmenity ? !linkedAmenityCodeList.includes(item.code) : true
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updathotelExtras(filter: HotelAmenityInputDto): Promise<any> {
    try {
      await this.hotelExtrasRepository.updateHotelAmenity(filter);
      return {
        status: 'SUCCESS',
        message: 'Hotel extras updated successfully',
        data: true
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async uploadHotelAmenityImage(input: UploadHotelAmenityImageDto): Promise<any> {
    try {
      await this.hotelExtrasRepository.uploadHotelAmenityImage(input);
      return {
        status: 'SUCCESS',
        message: 'Hotel extras image uploaded successfully',
        data: true
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createHotelExtras(input: HotelAmenityInputDto): Promise<any> {
    try {
      const data = await this.hotelExtrasRepository.createHotelAmenity(input);
      return {
        status: 'SUCCESS',
        message: 'Hotel extras created successfully',
        data: data
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getCppExtrasServiceList(payload: GetCppExtrasServiceListQueryDto) {
    try {
      // Prepare query data
      const result: any[] = [];
      const resultMap: Map<string, string> = new Map();
      const { hotelId, productList: productListQuery, isExclLinkedAmenity } = payload;
      const ratePlanHotelExtrasDailyListPerSalePlanPromises = productListQuery.map((query) => {
        return this.ratePlanSettingsService.getRatePlanHotelExtrasDailyList({
          hotelId,
          fromDate: query.arrival,
          toDate: query.departure,
          ratePlanIdList: [query.salesPlanId],
          types: [
            RatePlanExtraServiceType.INCLUDED,
            RatePlanExtraServiceType.EXTRA,
            RatePlanExtraServiceType.MANDATORY
          ]
        });
      });

      // Query data
      const [hotelAmenityList, hotel, ratePlanHotelExtrasDailyListPerSalePlan, roomProductExtras] =
        await Promise.all([
          this.hotelExtrasRepository.getHotelAmenityCppExtrasServiceList(payload),

          this.hotelRepository.findHotelById(
            hotelId,
            ['hotelTaxSettings', 'hotelTaxSettings.hotelTax'],
            { hotelTaxSettings: { hotelTax: true } }
          ),

          Promise.all(ratePlanHotelExtrasDailyListPerSalePlanPromises),

          this.roomProductExtraRepository.find({
            where: {
              hotelId: hotelId,
              roomProductId: In(productListQuery.map((query) => query.roomProductId))
            }
          })
        ]);

      if (hotelAmenityList?.length === 0 || !hotel) {
        return [];
      }

      // For COMBO amenities, fetch linked amenities to calculate total gross amount
      const comboAmenityList = hotelAmenityList.filter(
        (item) => item.sellingType === SellingTypeEnum.COMBO
      );
      const uniqueComboAmenityList = [
        ...new Set(
          comboAmenityList
            .map((item) => item.linkedAmenityCode?.split(',').map((code) => code.trim()) || [])
            .flat()
            .filter((code) => code.length > 0)
        )
      ];

      let linkedAmenityListForCombo: HotelAmenity[] = [];
      if (uniqueComboAmenityList.length > 0) {
        linkedAmenityListForCombo = await this.hotelExtrasRepository.getHotelAmenityList({
          codeList: uniqueComboAmenityList,
          hotelId: hotelId,
          relations: ['hotelAmenityPrices', 'hotelAmenityPrice.hotelAgeCategory']
        });
      }

      const ratePlanHotelExtrasDailyList = ratePlanHotelExtrasDailyListPerSalePlan.flat();

      for (const productQuery of productListQuery) {
        const ratePlanHotelExtras = ratePlanHotelExtrasDailyList.filter(
          (item) => item.ratePlanId === productQuery.salesPlanId
        );
        const roomProductExtra = roomProductExtras.filter(
          (item) => item.roomProductId === productQuery.roomProductId
        );
        const foundHotelAmenities = hotelAmenityList.filter(
          (ha) =>
            ratePlanHotelExtras.some((rhe) => rhe.hotelExtrasList.find((he) => he.id === ha.id)) ||
            roomProductExtra.some((re) => re.extrasId === ha.id)
        );

        if (foundHotelAmenities?.length > 0) {
          for (const foundHotelAmenity of foundHotelAmenities) {
            const fromDate = productQuery.arrival;
            // const toDate = productQuery.departure;
            const toDate = productQuery.arrival;
            const hotelAmenityCalculated =
              await this.calculateAmenityPricingService.calculatePricingAmenity(
                { hotel, hotelAmenity: foundHotelAmenity, fromDate, toDate },
                { roundingMode: RoundingModeEnum.HALF_UP, decimalPlaces: 2 }
              );
            const hasHotelAmenity = resultMap.get(foundHotelAmenity.id);
            if (hasHotelAmenity) {
              continue;
            }

            resultMap.set(foundHotelAmenity.id, foundHotelAmenity.id);
            const productList: any[] = [];
            for (const productQuery of productListQuery) {
              const roomExtra = foundHotelAmenity.roomProductExtras.find(
                (re) => re.roomProductId === productQuery.roomProductId
              );
              const ratePlanExtra = foundHotelAmenity.ratePlanExtraServices.find(
                (rpes) => rpes.ratePlanId === productQuery.salesPlanId
              );
              if (!roomExtra && !ratePlanExtra) {
                continue;
              }

              // Priority:
              // 1. Room MANDATORY
              // 2. Room INCLUDED
              // 3. Rate Plan MANDATORY
              // 4. Rate Plan INCLUDED
              // 5. EXTRA
              let isInclude = ratePlanExtra?.type === RatePlanExtraServiceType.INCLUDED;
              let isMandatory = ratePlanExtra?.type === RatePlanExtraServiceType.MANDATORY;
              switch (roomExtra?.type) {
                case RoomProductExtraType.INCLUDED:
                  isInclude = true;
                  isMandatory = false;
                  break;
                case RoomProductExtraType.MANDATORY:
                  isInclude = false;
                  isMandatory = true;
                  break;
                default:
                  break;
              }

              productList.push({
                salesPlanId: productQuery.salesPlanId,
                roomProductId: productQuery.roomProductId,
                arrival: productQuery.arrival,
                departure: productQuery.departure,
                isInclude,
                isMandatory
              });
            }

            // For COMBO amenities, calculate total gross amount from linked amenities
            let totalGrossAmount = Number(hotelAmenityCalculated.totalGrossAmount);
            if (foundHotelAmenity.sellingType === SellingTypeEnum.COMBO) {
              const comboTotalGrossAmount = this.calculateComboTotalGrossAmount(
                foundHotelAmenity,
                linkedAmenityListForCombo
              );
              // Use the calculated combo total if available, otherwise fall back to calculated pricing
              if (comboTotalGrossAmount > 0) {
                totalGrossAmount = comboTotalGrossAmount;
              }
            }

            result.push({
              id: foundHotelAmenity.id,
              name: foundHotelAmenity.name,
              code: foundHotelAmenity.code,
              description: foundHotelAmenity.description,
              status: foundHotelAmenity.status,
              amenityType: foundHotelAmenity.amenityType,
              pricingUnit: foundHotelAmenity.pricingUnit,
              availability: foundHotelAmenity.availability,
              postNextDay: foundHotelAmenity.postNextDay,
              iconImageUrl: foundHotelAmenity.iconImageUrl,
              mappingHotelAmenityCode: foundHotelAmenity.mappingHotelAmenityCode,
              totalSellingRate: Number(hotelAmenityCalculated.totalSellingRate),
              totalBaseAmount: Number(hotelAmenityCalculated.totalBaseAmount),
              totalGrossAmount: totalGrossAmount,
              taxAmount: Number(hotelAmenityCalculated.taxAmount),
              productList: productList,
              hotelAmenityPriceList: hotelAmenityCalculated.hotelAmenityPrices.map((price) => ({
                price: price.price,
                hotelAgeCategory: price.hotelAgeCategory
              }))
            });
          }
        }
      }

      return await Promise.all(
        result
          .filter((item) =>
            isExclLinkedAmenity ? !uniqueComboAmenityList.includes(item.code) : true
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(async (item) => {
            return {
              ...item,
              iconImageUrl: await this.s3Service.getPreSignedUrl(item.iconImageUrl)
            };
          })
      );
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.message);
    }
  }

  async deleteHotelExtras(body: DeleteHotelAmenityDto): Promise<any> {
    try {
      const { id } = body;
      await this.hotelExtrasRepository.deleteHotelAmenity(id);
      return {
        status: 'SUCCESS',
        message: 'Hotel extras deleted successfully',
        data: true
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.message);
    }
  }
}
