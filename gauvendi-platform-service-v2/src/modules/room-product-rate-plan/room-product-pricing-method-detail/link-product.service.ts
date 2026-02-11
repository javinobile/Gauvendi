import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomProductPricingMethodEnum } from '@src/core/enums/common';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductPricingMethodDetail } from 'src/core/entities/room-product-pricing-method-detail.entity';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { Helper } from 'src/core/helper/utils';
import { Between, Repository } from 'typeorm';
import { PricingDataSourceEnum } from '../room-product-selling-price/room-product-selling-price.dto';
import { RoomProductSellingPriceService } from '../room-product-selling-price/room-product-selling-price.service';
import { RoomProductPricingUtils } from './room-product-pricing.utils';

@Injectable()
export class LinkProductService {
  private readonly logger = new Logger(LinkProductService.name);

  constructor(
    @InjectRepository(RoomProductDailySellingPrice, DbName.Postgres)
    private readonly roomProductDailySellingPriceRepository: Repository<RoomProductDailySellingPrice>,

    @InjectRepository(RoomProductPricingMethodDetail, DbName.Postgres)
    private readonly roomProductPricingMethodDetailRepository: Repository<RoomProductPricingMethodDetail>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    private readonly roomProductSellingPriceService: RoomProductSellingPriceService
  ) {}

  async linkProduct(
    roomProductPricingMethodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string
  ) {
    try {
      const roomProduct = await this.roomProductRepository.findOne({
        where: { id: roomProductPricingMethodDetail.roomProductId },
        select: ['type']
      });

      if (!roomProduct) {
        this.logger.warn(`Room product not found for id ${roomProductPricingMethodDetail.roomProductId}`);
        return;
      }

      const { hotelId, roomProductId, ratePlanId } = roomProductPricingMethodDetail;

      if (!hotelId) {
        this.logger.warn('Hotel ID is not found');
        return;
      }

      if (!roomProductPricingMethodDetail) {
        this.logger.warn('No pricing method found');
        return;
      }

      const targetBasePriceMap: Record<string, RoomProductDailySellingPrice[]> = {};

      const inputs: any[] = [];
      const dates = Helper.generateDateRange(fromDate, toDate);

      // start get
      const basePrices = await this.roomProductDailySellingPriceRepository.find({
        where: {
          hotelId,
          ratePlanId,
          roomProductId,
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
          basePrice: basePrice.basePrice
        };

        if (!targetBasePriceMap[basePrice.date]) {
          targetBasePriceMap[basePrice.date] = [];
        }
        targetBasePriceMap[basePrice.date].push(dto);
      });

      // Process each target rate plan separately
      const results: any[] = [];

      // get linked product
      const linkedProducts = await this.roomProductPricingMethodDetailRepository.find({
        where: {
          hotelId,
          targetRoomProductId: roomProductId,
          ratePlanId,
          pricingMethod: RoomProductPricingMethodEnum.LINK
        }
      });

      for (const linkedProduct of linkedProducts) {
        const targetInputs: any[] = [];
        const {
          targetRoomProductId,
          roomProductId,
          pricingMethodAdjustmentValue,
          pricingMethodAdjustmentUnit,
          ratePlanId: linkRoomProductRatePlanId
        } = linkedProduct;

        for (const date of dates) {
          let relatedPrices = targetBasePriceMap[date]?.find(
            (price) => price.roomProductId === targetRoomProductId && price.date === date
          )?.basePrice;

          if (!relatedPrices) {
            relatedPrices = 0;
          }

          const basePrice = DecimalRoundingHelper.calculatePriceAdjustment(
            relatedPrices,
            pricingMethodAdjustmentValue,
            pricingMethodAdjustmentUnit
          );

          targetInputs.push({
            hotelId,
            roomProductId,
            ratePlanId: linkRoomProductRatePlanId,
            date,
            basePrice
          });
        }

        if (targetInputs.length === 0) {
          continue;
        }

        const filteredInputs = RoomProductPricingUtils.filterRedundantInput(
          targetBasePriceMap,
          targetInputs
        );

        if (filteredInputs.length === 0) {
          this.logger.debug(
            `No filtered inputs found for room product ${roomProductPricingMethodDetail.roomProductId}, ${linkRoomProductRatePlanId}, dates ${fromDate} to ${toDate}`
          );
          continue;
        }

        const result = await this.roomProductSellingPriceService.calculateSellingPrice({
          hotelId,
          roomProductId,
          roomProductType: roomProduct.type,
          ratePlanId: linkRoomProductRatePlanId, // Use rate plan ID for calculate
          fromDate,
          toDate,
          pricingDataSource: PricingDataSourceEnum.LINK,
          linkBasePrices: filteredInputs
        });

        const response = await this.roomProductSellingPriceService.insertSellingPrices(result, {
          hotelId,
          roomProductId,
          ratePlanId: linkRoomProductRatePlanId, // Use rate plan ID for insert
          fromDate,
          toDate
        });

        results.push(result);
      }

      return results.length;
    } catch (error) {
      this.logger.error('Error in link product', error);
      throw error;
    }
  }
}
