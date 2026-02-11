import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductPricingMethodDetail } from 'src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import {
  RoomProductPricingMethodEnum,
  RoomProductStatus,
  RoomProductType
} from 'src/core/enums/common';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { Helper } from 'src/core/helper/utils';
import { Between, In, Repository } from 'typeorm';
import { PricingDataSourceEnum } from '../room-product-selling-price/room-product-selling-price.dto';
import { RoomProductSellingPriceService } from '../room-product-selling-price/room-product-selling-price.service';
import { RoomProductPricingUtils } from './room-product-pricing.utils';

@Injectable()
export class HandlePositioningService {
  private readonly logger = new Logger(HandlePositioningService.name);
  constructor(
    @InjectRepository(RoomProductPricingMethodDetail, DbName.Postgres)
    private readonly roomProductPricingMethodDetailRepository: Repository<RoomProductPricingMethodDetail>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,

    @InjectRepository(RoomProductDailyAvailability, DbName.Postgres)
    private readonly roomProductDailyAvailabilityRepository: Repository<RoomProductDailyAvailability>,

    @InjectRepository(RoomProductDailySellingPrice, DbName.Postgres)
    private readonly roomProductDailySellingPriceRepository: Repository<RoomProductDailySellingPrice>,

    private readonly roomProductSellingPriceService: RoomProductSellingPriceService
  ) {}

  async handlePositioning(
    roomProductPricingMethodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string
  ) {
    try {
      const { hotelId, roomProductId } = roomProductPricingMethodDetail;

      if (!hotelId) {
        this.logger.warn('Hotel ID is not found');
        return;
      }

      const isMrfcPositioningEnable = roomProductPricingMethodDetail.ratePlan.mrfcPositioningMode;

      if (!isMrfcPositioningEnable) {
        this.logger.warn('Mrfc positioning is not enabled');
        return;
      }

      const isRfcAttributeMode = roomProductPricingMethodDetail.ratePlan.rfcAttributeMode;

      const roomProduct = await this.roomProductRepository.findOne({
        where: {
          hotelId,
          id: roomProductId
        },
        select: {
          type: true
        }
      });

      if (!roomProduct) {
        this.logger.warn('Room product not found');
        return;
      }

      const type = roomProduct.type;

      // handle rfc and mrfc
      if (type === RoomProductType.RFC) {
        return await this.handleRfcPositioning(roomProductPricingMethodDetail, fromDate, toDate);
      } else if (type === RoomProductType.MRFC) {
        return await this.executeMrfcFlow(
          roomProductPricingMethodDetail,
          fromDate,
          toDate,
          roomProductId
        );
      }
    } catch (error) {
      this.logger.error('Error in handle positioning', error);
      throw error;
    }
  }

  /**
   * Execute MRFC (Market Rate Forecasting Calculation) positioning flow
   * This is the TypeScript/NestJS equivalent of the Java executeMrfcFlow method
   */
  async executeMrfcFlow(
    roomProductPricingMethodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string,
    roomProductId: string
  ) {
    const roomProduct = await this.roomProductRepository.findOne({
      where: { id: roomProductId },
      select: ['type']
    });
    if (!roomProduct) {
      this.logger.warn(`Room product not found for id ${roomProductId}`);
      return;
    }

    const { hotelId, ratePlanId, pricingMethodAdjustmentValue, pricingMethodAdjustmentUnit } =
      roomProductPricingMethodDetail;

    this.logger.log(
      `Starting MRFC Positioning flow for room product ${roomProductId}, rate plan ${ratePlanId}, dates ${fromDate} to ${toDate}`
    );

    if (!roomProductPricingMethodDetail) {
      this.logger.warn('No pricing method found');
      return;
    }
    const relatedRoomProductIds = await this.getMappingRoomProductIds(roomProductId);

    if (relatedRoomProductIds.length === 0) {
      this.logger.warn('No related room product IDs found');
      return;
    }

    const [occPerDate, validDailyRfcAvailabilityMap, relatedRoomProductDailySellingPriceMap] =
      await Promise.all([
        this.getDailyOccRatePerDate(hotelId, fromDate, toDate),
        this.getValidDailyRfcAvailabilityMap(hotelId, relatedRoomProductIds, fromDate, toDate),
        this.getRelatedRoomProductDailySellingPriceMap(
          hotelId,
          ratePlanId,
          relatedRoomProductIds,
          fromDate,
          toDate
        )
      ]);

    // Get daily occupancy rates per date
    if (Object.keys(occPerDate).length === 0) {
      this.logger.warn('No occupancy data found');
      return;
    }

    const adjustmentUnit = pricingMethodAdjustmentUnit;
    const adjustmentValue = pricingMethodAdjustmentValue;

    const inputs: any[] = [];
    const dates = Helper.generateDateRange(fromDate, toDate);

    for (const date of dates) {
      const relatedPrices = relatedRoomProductDailySellingPriceMap[date];

      if (!relatedPrices?.length) {
        continue;
      }

      const availableRoomProductIdList = Object.entries(validDailyRfcAvailabilityMap)
        .filter(([_, availabilityMap]) => (availabilityMap[date] || 0) !== 0)
        .map(([roomProductId]) => roomProductId);

      if (availableRoomProductIdList.length === 0) {
        if (
          roomProductPricingMethodDetail.pricingMethod ===
          RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING
        ) {
          const highestPrice = Math.max(...relatedPrices.map((p) => p.basePrice ?? 0));
          if (highestPrice > 0) {
            inputs.push({
              hotelId,
              roomProductId,
              ratePlanId,
              date,
              basePrice: DecimalRoundingHelper.calculatePriceAdjustment(
                highestPrice,
                adjustmentValue,
                adjustmentUnit
              )
            });
          }
        }
        continue;
      }

      const filteredPrices = relatedPrices.filter(
        (price) => price.basePrice > 0 && availableRoomProductIdList.includes(price.roomProductId)
      );

      if (!filteredPrices.length) {
        this.logger.log(`No available relatedRoomProductDailySellingPrice: date=${date}`);
        continue;
      }

      const sortedPrices = [...filteredPrices].sort((a, b) => a.basePrice - b.basePrice);
      const occPercentage = Math.max(0, Math.min(1, occPerDate[date] || 0));

      let basePrice: number;
      if (occPercentage === 0) {
        basePrice = sortedPrices[0].basePrice;
      } else {
        const cutoff = Math.ceil(occPercentage * sortedPrices.length);
        const avg = sortedPrices.slice(0, cutoff).reduce((sum, p) => sum + p.basePrice, 0) / cutoff;
        basePrice = avg;
      }

      if (
        roomProductPricingMethodDetail.pricingMethod ===
        RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING
      ) {
        basePrice = DecimalRoundingHelper.calculatePriceAdjustment(
          basePrice,
          adjustmentValue,
          adjustmentUnit
        );
      }

      inputs.push({
        hotelId,
        roomProductId, // again: ensure this is the correct one, not outer-scope
        ratePlanId,
        date,
        basePrice
      });
    }

    const filteredInputs = RoomProductPricingUtils.filterRedundantInput(
      relatedRoomProductDailySellingPriceMap,
      inputs
    );

    if (filteredInputs.length === 0) {
      return;
    }

    const result = await this.roomProductSellingPriceService.calculateSellingPrice({
      hotelId,
      roomProductId,
      roomProductType: roomProduct.type,
      ratePlanId,
      fromDate,
      toDate,
      pricingDataSource: PricingDataSourceEnum.POSITIONING,
      positioningBasePrices: filteredInputs
    });

    const response = await this.roomProductSellingPriceService.insertSellingPrices(result, {
      hotelId,
      roomProductId,
      ratePlanId,
      fromDate,
      toDate
    });

    return result;
  }

  async handleRfcPositioning(
    roomProductPricingMethodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string
  ) {
    const { roomProductId } = roomProductPricingMethodDetail;

    const relatedRoomProductIds = await this.getRelatedRoomProductAssignedUnits(
      roomProductId,
      RoomProductType.MRFC
    );

    if (relatedRoomProductIds.length === 0) {
      this.logger.warn('No related room product IDs found');
      return;
    }

    return Promise.all(
      relatedRoomProductIds.map((id) =>
        this.executeMrfcFlow(roomProductPricingMethodDetail, fromDate, toDate, id)
      )
    );
  }

  async getRelatedRoomProductAssignedUnits(roomProductId: string, type: RoomProductType) {
    // step 1: find related room product by assigned unit
    const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository.find({
      where: {
        roomProductId
      },
      select: {
        roomUnitId: true
      }
    });

    if (!roomProductAssignedUnits || roomProductAssignedUnits.length === 0) {
      return [];
    }

    const unitIds = roomProductAssignedUnits.map((unit) => unit.roomUnitId);

    // get related assigned unit
    const relatedAssignedUnits = await this.roomProductAssignedUnitRepository.find({
      where: {
        roomUnitId: In(unitIds),
        roomProduct: {
          type: type,
          status: RoomProductStatus.ACTIVE
        }
      },
      select: {
        roomProductId: true
      },
      relations: ['roomProduct']
    });

    const relatedRoomProductIds = relatedAssignedUnits.map((unit) => unit.roomProductId);

    const mappedRoomProductIds = [...new Set(relatedRoomProductIds)];

    return mappedRoomProductIds;
  }

  /**
   * Get mapping room product IDs from pricing method
   */
  private async getMappingRoomProductIds(roomProductId: string): Promise<string[]> {
    // Otherwise, get related room products by assigned units
    return await this.getRelatedRoomProductAssignedUnits(roomProductId, RoomProductType.RFC);
  }

  /**
   * Get daily occupancy rate per date
   */
  private getDailyOccRatePerDate(
    hotelId: string,
    fromDate: string,
    toDate: string
  ): Record<string, number> {
    // This is a placeholder - you'll need to implement occupancy calculation logic
    // based on your business requirements
    const occPerDate: Record<string, number> = {};
    const dates = Helper.generateDateRange(fromDate, toDate);

    // For now, return a default occupancy of 0.5 for all dates
    // You should replace this with actual occupancy calculation
    dates.forEach((date) => {
      occPerDate[date] = 0.5; // 50% occupancy as default
    });

    return occPerDate;
  }

  /**
   * Get valid daily RFC availability map
   */
  async getValidDailyRfcAvailabilityMap(
    hotelId: string,
    relatedRoomProductIds: string[],
    fromDate: string,
    toDate: string
  ): Promise<Record<string, Record<string, number>>> {
    const availabilityMap: Record<string, Record<string, number>> = {};

    const availabilities = await this.roomProductDailyAvailabilityRepository.find({
      where: {
        hotelId,
        roomProductId: In(relatedRoomProductIds),
        date: Between(fromDate, toDate)
      },
      select: {
        roomProductId: true,
        date: true,
        available: true
      },
      order: {
        date: 'ASC'
      }
    });

    availabilities.forEach((availability) => {
      if (!availabilityMap[availability.roomProductId]) {
        availabilityMap[availability.roomProductId] = {};
      }
      availabilityMap[availability.roomProductId][availability.date] = availability.available;
    });

    return availabilityMap;
  }

  /**
   * Get related room product daily base price map
   */
  async getRelatedRoomProductDailySellingPriceMap(
    hotelId: string,
    ratePlanId: string,
    mappingRoomProductIds: string[],
    fromDate: string,
    toDate: string
  ): Promise<Record<string, RoomProductDailySellingPrice[]>> {
    const basePriceMap: Record<string, RoomProductDailySellingPrice[]> = {};

    const basePrices = await this.roomProductDailySellingPriceRepository.find({
      where: {
        hotelId,
        ratePlanId,
        roomProductId: In(mappingRoomProductIds),
        date: Between(fromDate, toDate)
      },
      select: {
        roomProductId: true,
        date: true,
        basePrice: true
      },
      order: {
        date: 'ASC'
      }
    });

    basePrices.forEach((basePrice) => {
      const dto: any = {
        roomProductId: basePrice.roomProductId,
        date: basePrice.date,
        basePrice: basePrice.basePrice,
        ratePlanId: basePrice.ratePlanId
      };

      if (!basePriceMap[basePrice.date]) {
        basePriceMap[basePrice.date] = [];
      }
      basePriceMap[basePrice.date].push(dto);
    });

    return basePriceMap;
  }
}
