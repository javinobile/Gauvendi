import { Injectable } from '@nestjs/common';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import {
  HotelRetailFeature,
  HotelRetailFeatureStatusEnum
} from 'src/core/entities/hotel-retail-feature.entity';
import { RatePlanFeatureDailyRate } from 'src/core/entities/pricing-entities/rate-plan-feature-daily-rate.entity';
import { HotelRetailFeatureDto } from 'src/modules/hotel/dtos/hotel-retail-feature.dto';
import {
  HotelRetailFeatureFilter,
  HotelRetailFeatureRepository
} from 'src/modules/hotel/repositories/hotel-retail-feature.repository';
import { HotelRepository } from 'src/modules/hotel/repositories/hotel.repository';
import { DailyRateUnitDto } from 'src/modules/pricing/dtos/daily-rate-unit.dto';
import { RatePlanFeatureDailyRateFilterDto } from 'src/modules/rate-plan-feature-daily-rate/dto';
import { RatePlanFeatureDailyRateRepository } from 'src/modules/rate-plan-feature-daily-rate/repositories/rate-plan-feature-daily-rate.repository';
import { RatePlanFeatureWithDailyRateListFilterDto } from '../dtos/rate-plan-feature-with-daily-rate-pricing-filter.dto';

@Injectable()
export class HotelDailyRatePricingService {
  constructor(
    private readonly ratePlanFeatureDailyRateRepository: RatePlanFeatureDailyRateRepository,
    private readonly hotelRepository: HotelRepository,
    private readonly hotelRetailFeatureRepository: HotelRetailFeatureRepository
  ) {}

  async ratePlanFeatureWithDailyRateList(
    filter: RatePlanFeatureWithDailyRateListFilterDto
  ): Promise<{
    data: HotelRetailFeatureDto[];
    totalCount: number;
    totalPage: number;
  }> {
    const hotel: Hotel | null = await this.hotelRepository.findByCode(filter.hotelCode);
    if (!hotel) {
      return {
        data: [],
        totalCount: 0,
        totalPage: 0
      };
    }

    // Build filter for rate plan feature daily rates
    const ratePlanFeatureDailyRateFilter: RatePlanFeatureDailyRateFilterDto = {
      ratePlanIdList: [filter.ratePlanId],
      featureIdList: filter.featureIdList,
      fromDate: filter.fromDate,
      toDate: filter.toDate,
      pageSize: -1,
      offset: 0
    };

    const ratePlanFeatureDailyRatesResult = await this.ratePlanFeatureDailyRateRepository.findAll(
      ratePlanFeatureDailyRateFilter
    );
    const ratePlanFeatureDailyRates = ratePlanFeatureDailyRatesResult.entities;

    // Group by feature ID
    const ratePlanFeatureDailyRatesPerFeature = new Map<string, RatePlanFeatureDailyRate[]>();
    ratePlanFeatureDailyRates.forEach((rate) => {
      const featureId = rate.featureId;
      if (!ratePlanFeatureDailyRatesPerFeature.has(featureId)) {
        ratePlanFeatureDailyRatesPerFeature.set(featureId, []);
      }
      ratePlanFeatureDailyRatesPerFeature.get(featureId)!.push(rate);
    });

    // Convert status list
    const featureStatusList = new Set<HotelRetailFeatureStatusEnum>();
    if (filter.featureStatusList) {
      filter.featureStatusList.forEach((status) => {
        featureStatusList.add(status);
      });
    }

    // Build retail feature filter
    const retailFeatureFilter: HotelRetailFeatureFilter = {
      hotelId: hotel.id,
      idList: filter.featureIdList,
      hotelRetailCategoryIdList: filter.featureCategoryIdList,
      statusList: featureStatusList,
      sort: filter.sort,
      expand: filter.relations
    };

    const hotelRetailFeaturesResult =
      await this.hotelRetailFeatureRepository.hotelRetailFeatureList(retailFeatureFilter);
    let hotelRetailFeatures = this.convertToDto(hotelRetailFeaturesResult.entities);

    // Process each feature to add daily rates
    hotelRetailFeatures.forEach((feature) => {
      const featureDailyRates = ratePlanFeatureDailyRatesPerFeature.get(feature.id) || [];

      // Get setup dates
      const setupDates = featureDailyRates.map((rate) => new Date(rate.date));

      // Build daily rates from existing data
      const dailyRates: DailyRateUnitDto[] = featureDailyRates.map(
        (featureDailyRate) =>
          new DailyRateUnitDto(Number(featureDailyRate.rate), new Date(featureDailyRate.date))
      );

      // Fill missing dates with base rate
      const fromDate = new Date(filter.fromDate);
      const toDate = new Date(filter.toDate);

      for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
        const dateExists = setupDates.some(
          (setupDate) => setupDate.toDateString() === date.toDateString()
        );

        if (!dateExists) {
          const baseRate = new DailyRateUnitDto(feature.baseRate, new Date(date));
          dailyRates.push(baseRate);
        }
      }

      // Sort by date
      dailyRates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      feature.dailyRateUnitList = dailyRates;
    });

    // Apply sorting by date if specified
    hotelRetailFeatures = this.sortByDate(filter, hotelRetailFeatures);

    return {
      data: hotelRetailFeatures,
      totalCount: hotelRetailFeatures.length,
      totalPage: 1
    };
  }

  private sortByDate(
    filter: RatePlanFeatureWithDailyRateListFilterDto,
    hotelRetailFeatures: HotelRetailFeatureDto[]
  ): HotelRetailFeatureDto[] {
    let dateSort = new Date(filter.fromDate);
    let orderSort = 'asc';

    if (filter.sortByDate) {
      const targetSortDate = new Date(filter.sortByDate);
      const fromDate = new Date(filter.fromDate);
      const toDate = new Date(filter.toDate);

      if (targetSortDate >= fromDate && toDate >= targetSortDate) {
        dateSort = targetSortDate;
      }
      orderSort = filter.sortByDateOrder || 'asc';
    }

    // Create map of feature to selling rate for sorting
    const mapRfcAndSellingRate = new Map<HotelRetailFeatureDto, number>();

    hotelRetailFeatures.forEach((hrf) => {
      let sellingRate = -1;

      if (hrf.dailyRateUnitList && hrf.dailyRateUnitList.length > 0) {
        const dailySellingRate = hrf.dailyRateUnitList.find(
          (item) => new Date(item.date).toDateString() === dateSort.toDateString()
        );

        if (dailySellingRate && dailySellingRate.rate !== null) {
          sellingRate = dailySellingRate.rate;
        } else {
          sellingRate = 0;
        }
      }

      mapRfcAndSellingRate.set(hrf, sellingRate);
    });

    // Sort features based on selling rate
    const sortedEntries = Array.from(mapRfcAndSellingRate.entries());

    if (orderSort.toLowerCase() === 'desc') {
      sortedEntries.sort((a, b) => b[1] - a[1]); // Descending
    } else {
      sortedEntries.sort((a, b) => a[1] - b[1]); // Ascending
    }

    return sortedEntries.map((entry) => entry[0]);
  }

  private convertToDto(hotelRetailFeatures: HotelRetailFeature[]): HotelRetailFeatureDto[] {
    return hotelRetailFeatures.map((entity) => {
      const dto = new HotelRetailFeatureDto();
      dto.id = entity.id;
      dto.name = entity.name;
      dto.hotelRetailCategory = entity.hotelRetailCategory;
      dto.baseRate = entity.baseRate;
      return dto;
    });
  }
}
