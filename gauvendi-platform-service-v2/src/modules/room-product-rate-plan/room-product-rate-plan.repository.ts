import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from '@src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import {
  ConfiguratorModeEnum,
  ConfiguratorTypeEnum,
  ConnectorTypeEnum,
  RatePlanStatusEnum,
  RoomProductPricingMethodEnum,
  RoomProductStatus,
  RoomProductType
} from '@src/core/enums/common';
import { QueryBuilderUtils } from '@src/core/utils/query-builder.utils';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  ConfiguratorSetting,
  RoomProductRatePlan
} from 'src/core/entities/room-product-rate-plan.entity';
import { BaseService } from 'src/core/services/base.service';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  IsNull,
  Raw,
  Repository
} from 'typeorm';
import { RoomProductRatePlanFilterDto } from './dtos/room-product-rate-plan-filter.dto';

interface ParsedConfiguratorDestination {
  connectorType: ConnectorTypeEnum;
  pmsRatePlanCode: string;
  pmsRoomProductCode: string;
}

@Injectable()
export class RoomProductRatePlanRepository extends BaseService {
  constructor(
    @InjectRepository(RoomProductRatePlan, DB_NAME.POSTGRES)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,

    @InjectRepository(RoomProductRatePlanAvailabilityAdjustment, DB_NAME.POSTGRES)
    private readonly roomProductRatePlanAvailabilityAdjustmentRepository: Repository<RoomProductRatePlanAvailabilityAdjustment>,

    @InjectRepository(RoomProductDailySellingPrice, DB_NAME.POSTGRES)
    private readonly roomProductDailySellingPriceRepository: Repository<RoomProductDailySellingPrice>,

    @InjectRepository(RoomProductRatePlanExtraOccupancyRateAdjustment, DB_NAME.POSTGRES)
    private readonly roomProductRatePlanExtraOccupancyRateAdjustmentRepository: Repository<RoomProductRatePlanExtraOccupancyRateAdjustment>,

    @InjectRepository(RoomProductPricingMethodDetail, DB_NAME.POSTGRES)
    private readonly roomProductPricingMethodDetailRepository: Repository<RoomProductPricingMethodDetail>,

    configService: ConfigService
  ) {
    super(configService);
  }

  findAll(
    filter: {
      ratePlanIds?: string[];
      roomProductIds?: string[];
      roomProductTypes?: RoomProductType[];
      hotelId?: string;
      hotelIds?: string[];
      isSellable?: boolean;
      relations?: FindOptionsRelations<RoomProductRatePlan>;
      order?: FindOptionsOrder<RoomProductRatePlan>;
      ratePlanStatusList?: RatePlanStatusEnum[];
    },
    select?: FindOptionsSelect<RoomProductRatePlan>
  ): Promise<RoomProductRatePlan[]> {
    const {
      ratePlanIds,
      roomProductIds,
      roomProductTypes,
      hotelId,
      hotelIds,
      isSellable,
      relations,
      order,
      ratePlanStatusList
    } = filter;
    const where: FindOptionsWhere<RoomProductRatePlan> = {};

    if (ratePlanIds && ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }
    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }
    if (roomProductTypes && roomProductTypes.length > 0) {
      where.roomProduct = {
        type: In(roomProductTypes)
      };
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }
    if (hotelIds && hotelIds.length > 0) {
      where.hotelId = In(hotelIds);
    }

    if (isSellable !== undefined && isSellable !== null) {
      where.isSellable = isSellable;
    }
    if (ratePlanStatusList && ratePlanStatusList.length > 0) {
      where.ratePlan = {
        status: In(ratePlanStatusList)
      };
    }
    return this.roomProductRatePlanRepository.find({
      where,
      relations,
      order,
      select
    });
  }

  findOne(
    filter: {
      ratePlanId?: string;
      roomProductId?: string;
      id?: string;
      hotelId?: string;
      relations?: FindOptionsRelations<RoomProductRatePlan>;
    },
    select?: FindOptionsSelect<RoomProductRatePlan>
  ): Promise<RoomProductRatePlan | null> {
    const { ratePlanId, roomProductId, id, hotelId, relations } = filter;

    const where: FindOptionsWhere<RoomProductRatePlan> = {};
    if (ratePlanId) {
      where.ratePlanId = ratePlanId;
    }
    if (roomProductId) {
      where.roomProductId = roomProductId;
    }
    if (id) {
      where.id = id;
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }

    return this.roomProductRatePlanRepository.findOne({
      where,
      relations,
      select
    });
  }

  findAvailabilities(
    filter: {
      roomProductRatePlanIds?: string[];
      ratePlanIds?: string[];
      dates?: string[];
      hotelId?: string;
      hotelIds?: string[];
      isSellable?: boolean;
      relations?: FindOptionsRelations<RoomProductRatePlanAvailabilityAdjustment>;
      order?: FindOptionsOrder<RoomProductRatePlanAvailabilityAdjustment>;
    },
    select?: FindOptionsSelect<RoomProductRatePlanAvailabilityAdjustment>
  ): Promise<RoomProductRatePlanAvailabilityAdjustment[]> {
    const {
      roomProductRatePlanIds,
      ratePlanIds,
      dates,
      hotelId,
      hotelIds,
      isSellable,
      relations,
      order
    } = filter;
    const where: FindOptionsWhere<RoomProductRatePlanAvailabilityAdjustment> = {};

    if (roomProductRatePlanIds && roomProductRatePlanIds.length > 0) {
      where.roomProductRatePlanId = In(roomProductRatePlanIds);
    }
    if (ratePlanIds && ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }
    if (dates && dates.length > 0) {
      where.date = In(dates);
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }
    if (hotelIds && hotelIds.length > 0) {
      where.hotelId = In(hotelIds);
    }

    if (isSellable !== undefined && isSellable !== null) {
      where.isSellable = isSellable;
    }

    return this.roomProductRatePlanAvailabilityAdjustmentRepository.find({
      where,
      relations,
      order,
      select
    });
  }

  findDailySellingPrices(
    filter: {
      roomProductIds?: string[];
      ratePlanIds?: string[];
      // roomProductRatePlanIds?: string[];
      dates?: string[];
      fromDate?: string;
      toDate?: string;
      hotelId?: string;
      hotelIds?: string[];
      relations?: FindOptionsRelations<RoomProductDailySellingPrice>;
      order?: FindOptionsOrder<RoomProductDailySellingPrice>;
    },
    select?: FindOptionsSelect<RoomProductDailySellingPrice>
  ): Promise<RoomProductDailySellingPrice[]> {
    const {
      dates,
      hotelId,
      hotelIds,
      relations,
      order,
      roomProductIds,
      ratePlanIds,
      fromDate,
      toDate
    } = filter;
    const where: FindOptionsWhere<RoomProductDailySellingPrice> = {};

    if (dates && dates.length > 0) {
      where.date = In(dates);
    }
    if (fromDate && toDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date AND "date"::date <= :toDate::date`, {
        fromDate: fromDate,
        toDate: toDate
      });
    } else if (fromDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date`, { fromDate: fromDate });
    } else if (toDate) {
      where.date = Raw(() => `"date"::date <= :toDate::date`, { toDate: toDate });
    }

    if (hotelId) {
      where.hotelId = hotelId;
    }
    if (hotelIds && hotelIds.length > 0) {
      where.hotelId = In(hotelIds);
    }
    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }
    if (ratePlanIds && ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }

    return this.roomProductDailySellingPriceRepository.find({
      where,
      relations,
      order,
      select
    });
  }

  findDailyExtraOccupancyRate(
    filter: {
      fromDate: string;
      toDate: string;
      roomProductRatePlanIds?: string[];
      relations?: FindOptionsRelations<RoomProductRatePlanExtraOccupancyRateAdjustment>;
    },
    select?: FindOptionsSelect<RoomProductRatePlanExtraOccupancyRateAdjustment>
  ) {
    const { fromDate, toDate, roomProductRatePlanIds, relations } = filter;
    if ((!fromDate && !toDate) || fromDate > toDate) {
      throw new BadRequestException('Invalid date range');
    }

    const where: FindOptionsWhere<RoomProductRatePlanExtraOccupancyRateAdjustment> = {};

    if (roomProductRatePlanIds && roomProductRatePlanIds.length > 0) {
      where.roomProductRatePlanId = In(roomProductRatePlanIds);
    }

    if (fromDate && toDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date AND "date"::date <= :toDate::date`, {
        fromDate: fromDate,
        toDate: toDate
      });
    } else if (fromDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date`, { fromDate: fromDate });
    } else if (toDate) {
      where.date = Raw(() => `"date"::date <= :toDate::date`, { toDate: toDate });
    }

    return this.roomProductRatePlanExtraOccupancyRateAdjustmentRepository.find({
      where,
      relations: relations,
      select
    });
  }

  async updateConfiguratorSetting(
    roomProductRatePlanId: string,
    setting: {
      type: ConfiguratorTypeEnum;
      connectorType: ConnectorTypeEnum;
      pmsRatePlanCode?: string;
      pmsRoomProductCode?: string;
      lastPushedAt?: string;
      mode: ConfiguratorModeEnum;
    }
  ) {
    const roomProductRatePlan = await this.roomProductRatePlanRepository.findOne({
      where: { id: roomProductRatePlanId },
      select: { configuratorSetting: true }
    });

    const currentConfiguratorSetting =
      roomProductRatePlan?.configuratorSetting || ({} as ConfiguratorSetting);

    if (setting.type) {
      currentConfiguratorSetting.type = setting.type;
    }

    if (setting.mode) {
      currentConfiguratorSetting.mode = setting.mode;
    }

    if (setting.lastPushedAt) {
      currentConfiguratorSetting.lastPushedAt = setting.lastPushedAt;
    }

    const parsedDestinations =
      currentConfiguratorSetting.destination?.map((raw) =>
        this.parseConfiguratorDestinationString(raw)
      ) || [];

    const updateIndex = parsedDestinations.findIndex(
      (destination) => destination.connectorType === setting.connectorType
    );

    if (setting.pmsRatePlanCode && setting.pmsRoomProductCode) {
      if (updateIndex !== -1) {
        parsedDestinations[updateIndex] = {
          connectorType: setting.connectorType,
          pmsRatePlanCode: setting.pmsRatePlanCode,
          pmsRoomProductCode: setting.pmsRoomProductCode
        };
      } else {
        parsedDestinations.push({
          connectorType: setting.connectorType,
          pmsRatePlanCode: setting.pmsRatePlanCode,
          pmsRoomProductCode: setting.pmsRoomProductCode
        });
      }

      currentConfiguratorSetting.destination = parsedDestinations.map(
        this.formatConfiguratorDestinationString
      );
    }

    await this.roomProductRatePlanRepository.update(roomProductRatePlanId, {
      configuratorSetting: currentConfiguratorSetting
    });

    return currentConfiguratorSetting;
  }

  async update(roomProductRatePlanId: string, data: Partial<RoomProductRatePlan>) {
    await this.roomProductRatePlanRepository.update(roomProductRatePlanId, data);
  }

  getPmsCodeFromConfiguratorSetting(
    configuratorSetting: ConfiguratorSetting | null | undefined,
    connectorType: ConnectorTypeEnum
  ): ParsedConfiguratorDestination | null {
    if (!configuratorSetting) {
      return null;
    }

    const parsedDestinations = configuratorSetting?.destination?.map((raw) =>
      this.parseConfiguratorDestinationString(raw)
    );
    const destination = parsedDestinations?.find(
      (destination) => destination.connectorType === connectorType
    );

    if (!destination) {
      return null;
    }
    return destination;
  }

  private parseConfiguratorDestinationString(str: string): ParsedConfiguratorDestination {
    const [connectorType, ids] = str.split(':');
    const [pmsRatePlanCode, pmsRoomProductCode] = ids.split(';');

    return {
      connectorType: connectorType as ConnectorTypeEnum,
      pmsRatePlanCode,
      pmsRoomProductCode
    };
  }

  private formatConfiguratorDestinationString(
    parsedDestination: ParsedConfiguratorDestination
  ): string {
    return `${parsedDestination.connectorType}:${parsedDestination.pmsRatePlanCode};${parsedDestination.pmsRoomProductCode}`;
  }

  findRoomProductPricingMethodDetail(
    filter: {
      hotelId: string;
      roomProductIds?: string[];
      ratePlanIds?: string[];
      ratePlanStatusList?: RatePlanStatusEnum[];
      roomProductStatusList?: RoomProductStatus[];
      targetRatePlanIds?: string[];
      pricingMethods?: RoomProductPricingMethodEnum[];
    },
    select?: FindOptionsSelect<RoomProductPricingMethodDetail>
  ): Promise<RoomProductPricingMethodDetail[]> {
    const {
      hotelId,
      roomProductIds,
      ratePlanIds,
      pricingMethods,
      targetRatePlanIds,
      ratePlanStatusList,
      roomProductStatusList
    } = filter;

    const where: FindOptionsWhere<RoomProductPricingMethodDetail> = {
      hotelId,
      roomProduct: {
        deletedAt: IsNull()
      }
    };

    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }
    if (ratePlanIds && ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }
    if (ratePlanStatusList && ratePlanStatusList.length > 0) {
      where.ratePlan = {
        status: In(ratePlanStatusList)
      };
    }

    if (roomProductStatusList && roomProductStatusList.length > 0) {
      where.roomProduct = {
        status: In(roomProductStatusList)
      };
    }
    if (targetRatePlanIds && targetRatePlanIds.length > 0) {
      where.targetRatePlanId = In(targetRatePlanIds);
    }

    if (pricingMethods && pricingMethods.length > 0) {
      where.pricingMethod = In(pricingMethods);
    }

    return this.roomProductPricingMethodDetailRepository.find({
      where,
      select
    });
  }

  private setFilterForQuery(queryBuilder: any, filter: RoomProductRatePlanFilterDto): void {
    // Filter by hotel
    if (filter.hotelIdList && filter.hotelIdList.length > 0) {
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProductRatePlan.hotelId',
        filter.hotelIdList,
        'hotelIdList'
      );
    }
    // Filter by Rate plan id list
    if (filter.idList && filter.idList.length > 0) {
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProductRatePlan.id',
        filter.idList,
        'idList'
      );
    }

    // Filter by Rate Plan ID list
    if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProductRatePlan.ratePlanId',
        filter.ratePlanIdList,
        'ratePlanIdList'
      );
    }
    // Filter by code list
    if (filter.codeList && filter.codeList.length > 0) {
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProductRatePlan.code',
        filter.codeList,
        'codeList'
      );
    }

    // Filter by rate plan status (requires join with ratePlan)
    if (filter.ratePlanStatusList && filter.ratePlanStatusList.length > 0) {
      queryBuilder = queryBuilder.leftJoin('roomProductRatePlan.ratePlan', 'ratePlan');
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'ratePlan.status',
        filter.ratePlanStatusList,
        'ratePlanStatusList'
      );
    }

    // Filter by isAutomatePricing

    if (filter.isAutomatePricing !== undefined && filter.isAutomatePricing !== null) {
      // TODO RoomProductRatePlan: Implement this
      // queryBuilder = queryBuilder.andWhere(
      //   'roomProductRatePlan.isAutomatePricing = :isAutomatePricing',
      //   { isAutomatePricing: filter.isAutomatePricing }
      // );
    }

    // Filter by isSellable
    // if (filter.isSellable !== undefined && filter.isSellable !== null) {
    //   // Ensure ratePlan is joined if not already
    //   if (
    //     !queryBuilder.expressionMap.joinAttributes.find(
    //       (join: any) => join.alias.name === 'ratePlan'
    //     )
    //   ) {
    //     queryBuilder = queryBuilder.leftJoin('roomProductRatePlan.ratePlan', 'ratePlan');
    //   }

    //   /*
    //    * 3 states: True, False, Null
    //    * if filter True -> filter != False
    //    * and vice versa
    //    */
    //   queryBuilder = queryBuilder.andWhere('ratePlan.isSellable != :notIsSellable', {
    //     notIsSellable: !filter.isSellable
    //   });
    // }
  }
}
