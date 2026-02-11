import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductPricingMethodDetail } from 'src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { RoomProductType } from 'src/core/enums/common';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { Helper } from 'src/core/helper/utils';
import { Repository } from 'typeorm';
import { PricingDataSourceEnum } from '../room-product-selling-price/room-product-selling-price.dto';
import { RoomProductSellingPriceService } from '../room-product-selling-price/room-product-selling-price.service';
import { HandlePositioningService } from './handle-positioning.service';
import { RoomProductPricingUtils } from './room-product-pricing.utils';

@Injectable()
export class AttributeLogicService {
  private readonly logger = new Logger(AttributeLogicService.name);

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

    private readonly roomProductSellingPriceService: RoomProductSellingPriceService,
    private readonly handlePositioningService: HandlePositioningService
  ) {}

  async executeAttributeLogic(
    roomProductPricingMethodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string
  ) {
    try {
      const { hotelId, roomProductId, ratePlan, ratePlanId } = roomProductPricingMethodDetail;

      if (!hotelId) {
        this.logger.warn('Hotel ID is not found');
        return;
      }

      const isAttributeLogicEnable = ratePlan.rfcAttributeMode;

      if (!isAttributeLogicEnable) {
        this.logger.warn('Attribute logic is not enabled');
        return;
      }

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

      if (type === RoomProductType.RFC) {
        return await this.handleRfcAttributeLogic(
          roomProductPricingMethodDetail,
          fromDate,
          toDate,
          roomProductId
        );
      } else if (type === RoomProductType.MRFC) {
        return await this.executeMrfcAttributeLogic(
          roomProductPricingMethodDetail,
          fromDate,
          toDate,
          roomProductId
        );
      }
    } catch (error) {
      this.logger.error('Error in execute attribute logic', error);
      throw error;
    }
  }

  async handleRfcAttributeLogic(
    roomProductPricingMethodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string,
    rfcRoomProductId: string
  ) {
    const roomProduct = await this.roomProductRepository.findOne({
      where: { id: rfcRoomProductId },
      select: ['type']
    });

    if (!roomProduct) {
      this.logger.warn(`Room product not found for id ${rfcRoomProductId}`);
      return;
    }

    const { hotelId, ratePlanId, pricingMethodAdjustmentValue, pricingMethodAdjustmentUnit } =
      roomProductPricingMethodDetail;

    this.logger.log(
      `Starting RFC flow for room product ${rfcRoomProductId}, rate plan ${ratePlanId}, dates ${fromDate} to ${toDate}`
    );

    if (!roomProductPricingMethodDetail) {
      this.logger.warn('No pricing method found');
      return;
    }

    const relatedMrfcRoomProductIds =
      await this.handlePositioningService.getRelatedRoomProductAssignedUnits(
        rfcRoomProductId,
        RoomProductType.MRFC
      );

    if (relatedMrfcRoomProductIds.length === 0) {
      this.logger.warn('No related room product IDs found');
      return;
    }

    const [
      validDailyMrfcAvailabilityMap,
      rfcRoomProductDailySellingPriceMap,
      relatedMrfcRoomProductDailySellingPriceMap
    ] = await Promise.all([
      this.handlePositioningService.getValidDailyRfcAvailabilityMap(
        hotelId,
        relatedMrfcRoomProductIds,
        fromDate,
        toDate
      ),
      this.handlePositioningService.getRelatedRoomProductDailySellingPriceMap(
        hotelId,
        ratePlanId,
        [rfcRoomProductId],
        fromDate,
        toDate
      ),
      this.handlePositioningService.getRelatedRoomProductDailySellingPriceMap(
        hotelId,
        ratePlanId,
        relatedMrfcRoomProductIds,
        fromDate,
        toDate
      )
    ]);

    const adjustmentUnit = pricingMethodAdjustmentUnit;
    const adjustmentValue = pricingMethodAdjustmentValue;

    const inputs: Partial<RoomProductDailySellingPrice>[] = [];
    const dates = Helper.generateDateRange(fromDate, toDate);

    for (const date of dates) {
      const relatedPrices = relatedMrfcRoomProductDailySellingPriceMap[date];

      if (!relatedPrices?.length) {
        continue;
      }

      const availableMrfcRoomProductIdList = Object.entries(validDailyMrfcAvailabilityMap)
        .filter(([_, availabilityMap]) => (availabilityMap[date] || 0) !== 0)
        .map(([roomProductId]) => roomProductId);

      if (availableMrfcRoomProductIdList.length === 0) {
        continue;
      }

      const rfcSellingPrice = rfcRoomProductDailySellingPriceMap[date].find(
        (price) => price.roomProductId === rfcRoomProductId
      );
      const mrfcSellingPrices = relatedPrices.filter(
        (price) =>
          price.basePrice > 0 && availableMrfcRoomProductIdList.includes(price.roomProductId)
      );

      if (mrfcSellingPrices.length === 0 || !mrfcSellingPrices) {
        continue;
      }

      if (!rfcSellingPrice) {
        this.logger.log(`No available rfcPrice: date=${date}`);
        continue;
      }

      const rfcPrice = rfcSellingPrice.basePrice;

      const maxMrfcPrice = Math.max(...mrfcSellingPrices.map((price) => price.basePrice));

      if (maxMrfcPrice <= 0 || rfcPrice >= maxMrfcPrice) {
        continue;
      }

      inputs.push({
        hotelId,
        roomProductId: rfcRoomProductId,
        ratePlanId,
        date,
        basePrice: maxMrfcPrice
      });
    }

    if (inputs.length === 0) {
      this.logger.warn('No attribute base prices found');
      return;
    }

    const filteredInputs = RoomProductPricingUtils.filterRedundantInput(
      relatedMrfcRoomProductDailySellingPriceMap,
      inputs
    );

    if (filteredInputs.length === 0) {
      return;
    }

    const result = await this.roomProductSellingPriceService.calculateSellingPrice({
      hotelId,
      roomProductId: rfcRoomProductId,
      roomProductType: roomProduct.type,
      ratePlanId,
      fromDate,
      toDate,
      pricingDataSource: PricingDataSourceEnum.ATTRIBUTE,
      attributeBasePrices: filteredInputs
    });

    const response = await this.roomProductSellingPriceService.insertSellingPrices(result, {
      hotelId,
      roomProductId: rfcRoomProductId,
      ratePlanId,
      fromDate,
      toDate
    });

    return result;
  }

  async executeMrfcAttributeLogic(
    roomProductPricingMethodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string,
    mrfcRoomProductId: string
  ) {
    const roomProduct = await this.roomProductRepository.findOne({
      where: { id: mrfcRoomProductId },
      select: ['type']
    });

    if (!roomProduct) {
      this.logger.warn(`Room product not found for id ${mrfcRoomProductId}`);
      return;
    }

    const { hotelId, ratePlanId, pricingMethodAdjustmentValue, pricingMethodAdjustmentUnit } =
      roomProductPricingMethodDetail;

    this.logger.log(
      `Starting MRFC Attribute flow for room product ${mrfcRoomProductId}, rate plan ${ratePlanId}, dates ${fromDate} to ${toDate}`
    );

    if (!roomProductPricingMethodDetail) {
      this.logger.warn('No pricing method found');
      return;
    }
    const relatedRoomProductIds =
      await this.handlePositioningService.getRelatedRoomProductAssignedUnits(
        mrfcRoomProductId,
        RoomProductType.RFC
      );

    if (relatedRoomProductIds.length === 0) {
      this.logger.warn('No related room product IDs found');
      return;
    }

    const [
      validDailyRfcAvailabilityMap,
      mrfcDailySellingPriceMap,
      relatedRoomProductDailySellingPriceMap
    ] = await Promise.all([
      this.handlePositioningService.getValidDailyRfcAvailabilityMap(
        hotelId,
        relatedRoomProductIds,
        fromDate,
        toDate
      ),
      this.handlePositioningService.getRelatedRoomProductDailySellingPriceMap(
        hotelId,
        ratePlanId,
        [mrfcRoomProductId],
        fromDate,
        toDate
      ),
      this.handlePositioningService.getRelatedRoomProductDailySellingPriceMap(
        hotelId,
        ratePlanId,
        relatedRoomProductIds,
        fromDate,
        toDate
      )
    ]);

    const adjustmentUnit = pricingMethodAdjustmentUnit;
    const adjustmentValue = pricingMethodAdjustmentValue;

    const inputs: Partial<RoomProductDailySellingPrice>[] = [];
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
        continue;
      }

      const rfcSellingPrices = relatedPrices.filter(
        (price) => price.basePrice > 0 && availableRoomProductIdList.includes(price.roomProductId)
      );

      const mrfcSellingPrice = mrfcDailySellingPriceMap[date].find(
        (price) => price.roomProductId === mrfcRoomProductId
      );

      if (!mrfcSellingPrice) {
        this.logger.log(`No available mrfcPrice: date=${date}`);
        continue;
      }

      if (rfcSellingPrices.length === 0 || !rfcSellingPrices) {
        continue;
      }

      const mrfcPrice = mrfcSellingPrice.basePrice;

      rfcSellingPrices.forEach((rfcSellingPrice) => {
        let basePrice = DecimalRoundingHelper.calculatePriceAdjustment(
          rfcSellingPrice.basePrice,
          adjustmentValue,
          adjustmentUnit
        );

        // if basePrice > mrfcPrice, then use basePrice
        if (basePrice < mrfcPrice) {
          basePrice = mrfcPrice;
        }
        inputs.push({
          hotelId,
          roomProductId: rfcSellingPrice.roomProductId,
          ratePlanId,
          date,
          basePrice: basePrice
        });
      });
    }

    if (inputs.length === 0) {
      this.logger.warn('No attribute base prices found');
      return;
    }

    // Group inputs by roomProductId
    const rfcRoomProductMap = new Map<string, Partial<RoomProductDailySellingPrice>[]>();
    inputs.forEach((input) => {
      if (!rfcRoomProductMap.has(input.roomProductId!)) {
        rfcRoomProductMap.set(input.roomProductId!, []);
      }
      rfcRoomProductMap.get(input.roomProductId!)!.push(input);
    });

    // Process each room product in parallel
    const roomProductPromises = Array.from(rfcRoomProductMap.entries()).map(
      async ([roomProductId, attributeBasePrices]) => {
        const filteredInputs = RoomProductPricingUtils.filterRedundantInput(
          relatedRoomProductDailySellingPriceMap,
          attributeBasePrices
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
          pricingDataSource: PricingDataSourceEnum.ATTRIBUTE,
          attributeBasePrices: filteredInputs
        });

        const response = await this.roomProductSellingPriceService.insertSellingPrices(result, {
          hotelId,
          roomProductId,
          ratePlanId,
          fromDate,
          toDate
        });

        // Trigger linked flows
        //   await this.linkProductService.linkProduct(roomProductPricingMethodDetail, fromDate, toDate);
        //   await this.derivedProductService.derivedProduct(roomProductPricingMethodDetail, fromDate, toDate);
        return { roomProductId, result, response };
      }
    );

    // Wait for all room products to be processed
    const allResults = await Promise.all(roomProductPromises);

    return allResults;
  }
}
