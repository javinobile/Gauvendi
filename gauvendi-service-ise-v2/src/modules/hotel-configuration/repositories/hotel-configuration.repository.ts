import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { BaseService } from 'src/core/services/base.service';
import { In, IsNull, Repository } from 'typeorm';

import {
  HotelConfiguration,
  HotelConfigurationTypeEnum
} from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { RoundingModeEnum } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductType } from 'src/core/entities/room-product.entity';
import { HotelIsePricingDisplayModeEnum } from 'src/core/enums/common';
import { BadRequestException } from 'src/core/exceptions';
import { HotelConfigurationFilterDto } from '../dtos/hotel-configuration-filter.dto';
import { HotelConfigurationDto } from '../dtos/hotel-configuration.dto';

@Injectable()
export class HotelConfigurationRepository extends BaseService {
  constructor(
    @InjectRepository(HotelConfiguration, DB_NAME.POSTGRES)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(filter: HotelConfigurationFilterDto): Promise<HotelConfiguration[]> {
    try {
      const { where, relations, order } = Filter.buildCondition<
        HotelConfiguration,
        HotelConfigurationFilterDto
      >(filter);

      const hotelIds = filter.hotelId ? [filter.hotelId] : [];
      if (filter.hotelIds && filter.hotelIds.length > 0) {
        hotelIds.push(...filter.hotelIds);
      }
      where.hotelId = In(hotelIds);

      if (filter.configTypes && filter.configTypes.length > 0) {
        where.configType = In(filter.configTypes);
      }

      return this.hotelConfigurationRepository.find({
        where,
        relations,
        order
      });
    } catch (error) {
      console.log(
        'Failed to find hotel retail category (hotelRetailCategoryRepository.findAll)',
        error
      );
      throw new InternalServerErrorException(
        'Failed to find hotel retail category (hotelRetailCategoryRepository.findAll)',
        error.message
      );
    }
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

  async getPricingConfiguration(hotelId: string): Promise<{
    isIsePricingDisplay: HotelIsePricingDisplayModeEnum;
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number };
    types: RoomProductType[];
    cityTaxDisplay: 'INCLUDED' | 'EXCLUDED' | null;
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

    let isIsePricingDisplay = HotelIsePricingDisplayModeEnum.EXCLUSIVE;
    let cityTaxDisplay: 'INCLUDED' | 'EXCLUDED' | null = null;
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
          cityTaxDisplay = config.configValue?.metadata?.cityTaxMode as 'INCLUDED' | 'EXCLUDED' | null;
          isIsePricingDisplay = config.configValue?.metadata?.mode as HotelIsePricingDisplayModeEnum;
          break;
      }
    });

    const objAllowAllRoomProducts = Object.fromEntries(allowAllRoomProducts);
    const types: RoomProductType[] = Object.keys(objAllowAllRoomProducts).filter(
      (key) => objAllowAllRoomProducts[key]
    ) as RoomProductType[];

    return { isIsePricingDisplay, hotelConfigRoundingMode, types, cityTaxDisplay };
  }

  private async getPricingDecimalRoundingRuleByHotelId(hotelIds: string[]) {
    const hotelConfiguration = await this.hotelConfigurationRepository.find({
      where: {
        hotelId: In(hotelIds),
        configType: HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE
      }
    });

    return hotelConfiguration;
  }

}
