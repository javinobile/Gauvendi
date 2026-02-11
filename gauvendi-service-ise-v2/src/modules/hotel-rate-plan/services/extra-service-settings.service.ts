import { Injectable, Logger } from '@nestjs/common';

import { LogPerformance } from 'src/core/decorators/execution-time.decorator';
import { AmenityStatusEnum } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelAmenityFilter, RatePlanServicesFilter } from '../dtos/rate-plan-services.dto';
import { HotelAmenityDto } from '../dtos/rate-plan.dto';
import { HotelAmenityRepository } from '../repositories/hotel-amenity.repository';
import { RatePlanExtraServicesRepository } from '../repositories/rate-plan-extra-services.repository';
import { ExtraServiceSettingsMapper } from './extra-service-settings.mapper';

@Injectable()
export class ExtraServiceSettingsService {
  private readonly logger = new Logger(ExtraServiceSettingsService.name);
  constructor(
    private readonly ratePlanExtraServicesRepository: RatePlanExtraServicesRepository,
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly extraServiceSettingsMapper: ExtraServiceSettingsMapper
  ) {}

  @LogPerformance({
    loggerName: 'ExtraServiceSettingsService',
    logLevel: 'log',
    slowThreshold: 2000,
    includeArgs: false
  })
  async fetchServicesSettingBySalesPlan(filter: RatePlanServicesFilter): Promise<{
    includedServiceMap: Map<string, HotelAmenityDto[]>;
    mandatoryServiceMap: Map<string, HotelAmenityDto[]>;
  }> {
    try {
      const includedServiceMap = new Map<string, HotelAmenityDto[]>();

      const mandatoryServiceMap = new Map<string, HotelAmenityDto[]>();

      // Step 1: Get sales plan services list
      const ratePlanServicesList = await this.ratePlanExtraServicesRepository.findAll(filter);
      const ratePlanServicesDtoList = ratePlanServicesList.map((item) =>
        this.extraServiceSettingsMapper.toDto(item)
      );
      if (!ratePlanServicesDtoList || ratePlanServicesDtoList.length === 0) {
        return { includedServiceMap, mandatoryServiceMap };
      }

      // Step 2: Extract service IDs
      const serviceIdList = ratePlanServicesDtoList
        .map((item) => item.serviceId)
        .filter((id): id is string => id !== null && id !== undefined);

      if (serviceIdList.length === 0) {
        return { includedServiceMap, mandatoryServiceMap };
      }

      // Step 3: Get hotel amenities
      const hotelAmenityFilter: HotelAmenityFilter = {
        idList: serviceIdList,
        statusList: [AmenityStatusEnum.ACTIVE],
        distributionChannelList: filter.distributionChannelList
      };

      const hotelAmenityList = await this.hotelAmenityRepository.findAll(hotelAmenityFilter);

      if (!hotelAmenityList || hotelAmenityList.length === 0) {
        return { includedServiceMap, mandatoryServiceMap };
      }

      // Step 4: Create hotel amenity map for efficient lookup
      const hotelAmenityMap = new Map<string, HotelAmenityDto>();
      hotelAmenityList.forEach((amenity) => {
        hotelAmenityMap.set(amenity.id, amenity);
      });

      // Step 5: Initialize maps if null

      // Step 6: Process included services
      const includedServices = ratePlanServicesDtoList
        .filter((item) => hotelAmenityMap.has(item.serviceId) && item.isIncluded === true)
        .reduce((acc, item) => {
          const ratePlanId = item.ratePlanId;
          const amenity = hotelAmenityMap.get(item.serviceId);

          if (amenity) {
            if (!acc.has(ratePlanId)) {
              acc.set(ratePlanId, []);
            }
            acc.get(ratePlanId)!.push(amenity);
          }

          return acc;
        }, new Map<string, HotelAmenityDto[]>());

      // Add included services to the provided map
      includedServices.forEach((services, salesPlanId) => {
        includedServiceMap.set(salesPlanId, services);
      });

      // Step 7: Process mandatory services
      const mandatoryServices = ratePlanServicesDtoList
        .filter((item) => hotelAmenityMap.has(item.serviceId) && item.isMandatory === true)
        .reduce((acc, item) => {
          const ratePlanId = item.ratePlanId;
          const amenity = hotelAmenityMap.get(item.serviceId);

          if (amenity) {
            if (!acc.has(ratePlanId)) {
              acc.set(ratePlanId, []);
            }
            acc.get(ratePlanId)!.push(amenity);
          }

          return acc;
        }, new Map<string, HotelAmenityDto[]>());

      // Add mandatory services to the provided map
      mandatoryServices.forEach((services, salesPlanId) => {
        mandatoryServiceMap.set(salesPlanId, services);
      });

      this.logger.log(`Fetched services for ${ratePlanServicesDtoList.length} sales plans`);
      return { includedServiceMap, mandatoryServiceMap };
    } catch (error) {
      this.logger.error('Error in fetchServicesSettingBySalesPlan:', error);
      throw error;
    }
  }
}
