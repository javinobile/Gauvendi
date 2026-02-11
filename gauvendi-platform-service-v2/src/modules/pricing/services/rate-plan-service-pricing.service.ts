import { Injectable } from '@nestjs/common';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanExtraServiceType, SellingTypeEnum } from '@src/core/enums/common';
import { RatePlanDerivedSettingRepository } from '@src/modules/rate-plan/repositories/rate-plan-derived-setting.repository';
import { BadRequestException } from 'src/core/exceptions';
import { S3Service } from 'src/core/s3/s3.service';
import { HotelAmenityPriceRepository } from 'src/modules/hotel/repositories/hotel-amenity-price.repository';
import { HotelAmenityRepository } from 'src/modules/hotel/repositories/hotel-amenity.repository';
import { RatePlanExtraServiceFilterDto } from 'src/modules/rate-plan-extra-service/dtos';
import { RatePlanExtraServiceRepository } from 'src/modules/rate-plan-extra-service/repositories/rate-plan-extra-service.repository';
import {
  RatePlanServiceDeleteInputDto,
  RatePlanServiceInputDto,
  RatePlanServiceListPricingFilterDto,
  RatePlanServiceListPricingResponseDto
} from '../dtos/rate-plan-service-pricing.dto';
import { HotelExtrasPricingService } from './hotel-extras-pricing.service';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
@Injectable()
export class RatePlanServicePricingService {
  constructor(
    private readonly ratePlanExtraServiceRepository: RatePlanExtraServiceRepository,
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly hotelAmenityPriceRepository: HotelAmenityPriceRepository,
    private readonly ratePlanDerivedSettingRepository: RatePlanDerivedSettingRepository,
    private readonly s3Service: S3Service,
    private readonly hotelExtrasPricingService: HotelExtrasPricingService
  ) {}

  async ratePlanServiceList(
    filter: RatePlanServiceListPricingFilterDto
  ): Promise<RatePlanServiceListPricingResponseDto[]> {
    const ratePlanFilter: RatePlanExtraServiceFilterDto = {
      ratePlanIdList: filter.ratePlanIdList,
      pageSize: 1000
    };
    try {
      const ratePlanDerivedSettings = (
        await this.ratePlanDerivedSettingRepository.findAll({
          ratePlanIdList: filter.ratePlanIdList
        })
      ).filter((item) => item.followDailyIncludedAmenity === true);

      const masterRatePlanIds = ratePlanDerivedSettings.map((item) => item.derivedRatePlanId);

      const ratePlanExtraServices = await this.ratePlanExtraServiceRepository.findAll({
        ratePlanIds: [...masterRatePlanIds, ...filter.ratePlanIdList]
      });

      const followExtraServices = ratePlanExtraServices.filter(
        (item) =>
          masterRatePlanIds.includes(item.ratePlanId) &&
          (item.type === RatePlanExtraServiceType.INCLUDED ||
            item.type === RatePlanExtraServiceType.MANDATORY)
      );

      const extraServices = ratePlanExtraServices.filter((item) =>
        filter.ratePlanIdList.includes(item.ratePlanId)
      );

      const extraServicesIds = Array.from(
        new Set([
          ...followExtraServices.map((item) => item.extrasId),
          ...extraServices.map((item) => item.extrasId)
        ])
      );

      if (!extraServicesIds?.length) {
        return [];
      }

      const [hotelAmenities, hotelAmenityPrices] = await Promise.all([
        this.hotelAmenityRepository.getHotelAmenityList({ ids: extraServicesIds }),
        this.hotelAmenityPriceRepository.getHotelAmenityList({
          hotelAmenityIds: extraServicesIds,
          relations: ['hotelAgeCategory']
        })
      ]);

      if (!hotelAmenities?.length) {
        throw new BadRequestException('Not found hotel amenities');
      }

      // for selling type is COMBO, we need to get all linked amenities
      const comboAmenityList = hotelAmenities.filter(
        (item) => item.sellingType === SellingTypeEnum.COMBO
      );
      const uniqueComboAmenityList = [
        ...new Set(
          comboAmenityList
            .map((item) => item.linkedAmenityCode.split(',').map((code) => code.trim()))
            .flat()
        )
      ];

      let linkedAmenityList: HotelAmenity[] = [];

      if (uniqueComboAmenityList?.length) {
        linkedAmenityList = await this.hotelAmenityRepository.getHotelAmenityList({
          codeList: uniqueComboAmenityList,
          hotelId: hotelAmenities?.[0].hotelId,
          relations: ['hotelAmenityPrices', 'hotelAmenityPrice.hotelAgeCategory']
        });
      }

      const result: RatePlanServiceListPricingResponseDto[] = [];

      for (const ratePlanId of filter.ratePlanIdList) {
        const ratePlanDerivedSetting = ratePlanDerivedSettings.find(
          (setting) => setting.ratePlanId === ratePlanId
        );

        let allServicesInRatePlan: RatePlanExtraService[] = [];
        if (ratePlanDerivedSetting) {
          const masterRatePlanId = ratePlanDerivedSettings.find(
            (setting) => setting.ratePlanId === ratePlanId
          )?.derivedRatePlanId;

          const followExtraServicesInRatePlan = followExtraServices.filter(
            (item) => item.ratePlanId === masterRatePlanId
          );

          const extraServicesInRatePlan = extraServices.filter(
            (item) => item.ratePlanId === ratePlanId && item.type === RatePlanExtraServiceType.EXTRA
          );

          allServicesInRatePlan = [...followExtraServicesInRatePlan, ...extraServicesInRatePlan];
        } else {
          allServicesInRatePlan = extraServices.filter((item) => item.ratePlanId === ratePlanId);
        }

        const dtos = await Promise.all(
          allServicesInRatePlan.map(async (item) => {
            const amenity = hotelAmenities.find((amenity) => amenity.id === item.extrasId);
            let totalGrossAmount = 0;
            if (amenity?.sellingType === SellingTypeEnum.COMBO) {
              totalGrossAmount = this.hotelExtrasPricingService.calculateComboTotalGrossAmount(
                amenity,
                linkedAmenityList
              );
            } else {
              totalGrossAmount =
                hotelAmenityPrices.find(
                  (price) =>
                    price.hotelAmenityId === item.extrasId &&
                    price.hotelAgeCategory?.code === 'DEFAULT'
                )?.price || 0;
            }

            const amenityImageUrl = amenity?.iconImageUrl
              ? await this.s3Service.getPreSignedUrl(amenity?.iconImageUrl)
              : '';

            return {
              id: item.id,
              serviceId: item.extrasId,
              ratePlanId: ratePlanId,
              type: item.type,
              service: {
                name: amenity?.name || '',
                code: amenity?.code || '',
                pricingUnit: amenity?.pricingUnit || '',
                iconImageUrl: amenityImageUrl,
                description: amenity?.description || '',
                totalSellingRate: Number(totalGrossAmount) || 0,
                totalGrossAmount: Number(totalGrossAmount) || 0,
                totalBaseAmount: Number(totalGrossAmount) || 0
              }
            } as RatePlanServiceListPricingResponseDto;
          })
        );

        result.push(...dtos);
      }

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createRatePlanService(filter: RatePlanServiceInputDto) {
    return await this.ratePlanExtraServiceRepository.createRatePlanExtraService({
      ratePlanId: filter.ratePlanId,
      services: filter.services.map((service) => ({
        serviceId: service.id,
        type: service.type
      }))
    });
  }

  async deleteRatePlanService(filter: RatePlanServiceDeleteInputDto) {
    return await this.ratePlanExtraServiceRepository.deleteRatePlanExtraService({
      ratePlanId: filter.ratePlanId,
      services: filter.services.map((service) => ({
        serviceId: service.id
      }))
    });
  }
}
