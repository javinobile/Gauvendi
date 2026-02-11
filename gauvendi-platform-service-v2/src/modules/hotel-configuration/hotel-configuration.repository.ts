import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import {
  HotelConfigurationTypeEnum,
  RoomProductType,
  RoundingModeEnum
} from '@src/core/enums/common';
import { addDays, format } from 'date-fns';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelConfiguration } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsSelect, FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import { HotelConfigurationDto } from './hotel-configuration-filter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisService } from '@src/core/redis';
import { Cache } from 'cache-manager';
import { HotelConfigurationsCacheQueryDto } from '../hotel-configurations/dtos/hotel-configurations-query.dto';
@Injectable()
export class HotelConfigurationRepository extends BaseService {
  logger = new Logger(HotelConfigurationRepository.name);
  constructor(
    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,

    configService: ConfigService
  ) {
    super(configService);
  }

  findAll(filter: { hotelId: string }, select?: FindOptionsSelect<HotelConfiguration>) {
    const { hotelId } = filter;
    const where: FindOptionsWhere<HotelConfiguration> = {};
    if (hotelId) {
      where.hotelId = hotelId;
    }
    return this.hotelConfigurationRepository.find({
      where,
      select
    });
  }

  async getHotelConfiguration(body: HotelConfigurationDto): Promise<HotelConfiguration | null> {
    try {
      const hotelConfiguration = await this.hotelConfigurationRepository.findOne({
        where: {
          ...(body.hotelId && { hotelId: body.hotelId }),
          ...(body.configType && {
            configType: body.configType
          }),
          deletedAt: body.deletedAt ?? IsNull()
        }
      });

      return hotelConfiguration;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelConfigurations(body: HotelConfigurationDto): Promise<HotelConfiguration[]> {
    try {
      const hotelConfigurations = await this.hotelConfigurationRepository.find({
        where: {
          ...(body.hotelId && { hotelId: body.hotelId }),
          ...(body.configTypes && {
            configType: In(body.configTypes)
          })
        }
      });

      return hotelConfigurations;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getPricingConfiguration(hotelId: string): Promise<{
    isIsePricingDisplay: 'EXCLUSIVE' | 'INCLUSIVE';
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number };
    types: RoomProductType[];
  }> {
    const hotelConfiguration = await this.hotelConfigurationRepository.find({
      where: {
        hotelId: hotelId,
        configType: In([
          HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING,
          HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING,
          HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE,
          HotelConfigurationTypeEnum.ISE_PRICING_DISPLAY
        ])
      }
    });

    let isIsePricingDisplay: 'EXCLUSIVE' | 'INCLUSIVE' = 'EXCLUSIVE';
    let hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number } = {
      roundingMode: RoundingModeEnum.NO_ROUNDING,
      decimalPlaces: 2
    };
    const allowAllRoomProducts: Map<RoomProductType, boolean> = new Map();
    hotelConfiguration.forEach((config) => {
      switch (config.configType) {
        case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING: {
          const roomProductRecommendationDirectValues = config.configValue.metadata as Record<
            string,
            boolean
          >;
          Object.keys(roomProductRecommendationDirectValues).forEach((key) => {
            allowAllRoomProducts.set(
              key as RoomProductType,
              roomProductRecommendationDirectValues[key]
            );
          });
          break;
        }
        case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING: {
          const roomRecommendationGradedLabelLowestPriceValues = config.configValue?.metadata
            ?.LOWEST_PRICE as Record<string, boolean>;
          Object.keys(roomRecommendationGradedLabelLowestPriceValues).forEach((key) => {
            allowAllRoomProducts.set(
              key as RoomProductType,
              roomRecommendationGradedLabelLowestPriceValues[key]
            );
          });

          const roomRecommendationGradedLabelMostPopularValues = config.configValue.metadata
            ?.MOST_POPULAR as Record<string, boolean>;
          Object.keys(roomRecommendationGradedLabelMostPopularValues).forEach((key) => {
            allowAllRoomProducts.set(
              key as RoomProductType,
              roomRecommendationGradedLabelMostPopularValues[key]
            );
          });
          break;
        }
        case HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE:
          hotelConfigRoundingMode = {
            roundingMode: config.configValue?.metadata?.roundingMode,
            decimalPlaces: config.configValue?.metadata?.decimalUnits
          };
          break;
        case HotelConfigurationTypeEnum.ISE_PRICING_DISPLAY:
          isIsePricingDisplay = config.configValue?.metadata?.mode as 'EXCLUSIVE' | 'INCLUSIVE';
          break;
      }
    });

    const objAllowAllRoomProducts = Object.fromEntries(allowAllRoomProducts);
    const types: RoomProductType[] = Object.keys(objAllowAllRoomProducts).filter(
      (key) => objAllowAllRoomProducts[key]
    ) as RoomProductType[];

    return { isIsePricingDisplay, hotelConfigRoundingMode, types };
  }

  async getLastSellableDate(hotelId: string, fromDate?: string, toDate?: string): Promise<string> {
    let lastSellableDate: string | null = null;

    if (fromDate && toDate) {
      lastSellableDate = toDate;
    }

    let hotelConfiguration: HotelConfiguration | null = null;
    if (!lastSellableDate) {
      // find last sellable date
      hotelConfiguration = await this.hotelConfigurationRepository.findOne({
        where: {
          hotelId,
          configType: HotelConfigurationTypeEnum.LAST_OPENING_AVAILABILITY_DATE
        },
        select: {
          configValue: true
        }
      });
    }

    if (hotelConfiguration) {
      lastSellableDate = hotelConfiguration.configValue?.value;
    }

    if (!lastSellableDate) {
      // add 365 days to today
      lastSellableDate = format(addDays(new Date(), 365), DATE_FORMAT);
    }

    return lastSellableDate;
  }

  async findOneByConfigType(input: { hotelId: string; configType: HotelConfigurationTypeEnum }) {
    const { hotelId, configType } = input;
    const cache = await this.cacheManager.get(this.buildCacheKey(hotelId, configType));

    if (cache) {
      return cache as HotelConfiguration;
    }

    const hotelConfiguration = await this.hotelConfigurationRepository.findOne({
      where: {
        hotelId,
        configType
      }
    });

    if (hotelConfiguration) {
      await this.cacheManager.set(this.buildCacheKey(hotelId, configType), hotelConfiguration);
    }

    return hotelConfiguration;
  }

  async getCacheHotelConfigurations(payload: HotelConfigurationsCacheQueryDto) {
    const where: FindOptionsWhere<HotelConfiguration> = { hotel: { id: payload.hotelId } };
    if (Array.isArray(payload.configTypeList) && payload.configTypeList.length > 0) {
      where.configType = In(payload.configTypeList);
    }

    const caches = await Promise.all(
      payload.configTypeList.map((configType) =>
        this.cacheManager.get(this.buildCacheKey(payload.hotelId, configType))
      )
    );

    if (caches.every((cache) => cache)) {
      return caches;
    }

    const configs = await this.hotelConfigurationRepository.find({
      where
    });

    await Promise.all(
      configs.map((config) =>
        this.cacheManager.set(this.buildCacheKey(payload.hotelId, config.configType), config)
      )
    );

    return configs;
  }

  private buildCacheKey(hotelId: string, configType: HotelConfigurationTypeEnum) {
    return `hotel-config:${hotelId}:${configType}`;
  }

  /**
   * Xóa cache cho hotel configuration
   * @param hotelId Hotel ID
   * @param configTypes Danh sách các config types cần xóa cache
   */
  async clearHotelConfigCache(
    hotelId: string,
    configTypes: HotelConfigurationTypeEnum[]
  ): Promise<void> {
    try {
      // Danh sách tất cả các config types được cache trong getCachedHotelConfig
      const cachedConfigTypes = [
        HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE,
        HotelConfigurationTypeEnum.ISE_PRICING_DISPLAY,
        HotelConfigurationTypeEnum.DEFAULT_PAX,
        HotelConfigurationTypeEnum.DEFAULT_STAY_NIGHT,
        HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION,
        HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING,
        HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING,
        HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_CONFIGURATOR_SETTING,
        HotelConfigurationTypeEnum.DISABLE_STAY_OPTION_PRICE_CLUSTERING,
        HotelConfigurationTypeEnum.POPULAR_AI_RECOMMENDATION_SETTING,
        HotelConfigurationTypeEnum.OUR_TIP_AI_RECOMMENDATION_SETTING,
        HotelConfigurationTypeEnum.AUTOMATION_RESTRICTION_MAX_LOS
      ];

      // Chỉ xóa cache cho các config types được update và có trong danh sách cached
      const configTypesToClear = configTypes.filter((type) => cachedConfigTypes.includes(type));

      for (const configType of configTypesToClear) {
        const cacheKey = this.buildCacheKey(hotelId, configType);
        await this.cacheManager.del(cacheKey);
        this.logger.log(`Cleared cache for hotel config: ${cacheKey}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to clear hotel config cache for hotel ${hotelId}: ${error.message}`);
    }
  }
}
