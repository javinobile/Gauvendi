import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from '@src/core/constants/db.const';
import {
  HotelRetailFeature,
  HotelRetailFeatureStatusEnum
} from '@src/core/entities/hotel-retail-feature.entity';
import { FeatureDailyAdjustment } from '@src/core/entities/pricing-entities/feature-daily-adjustment.entity';
import { RatePlanFeatureDailyRate } from '@src/core/entities/pricing-entities/rate-plan-feature-daily-rate.entity';
import { RoomProductFeatureRateAdjustment } from '@src/core/entities/room-product-feature-rate-adjustment.entity';
import {
  DeleteResult,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  InsertResult,
  Repository
} from 'typeorm';

@Injectable()
export class FeatureRepository {
  constructor(
    @InjectRepository(HotelRetailFeature, DB_NAME.POSTGRES)
    private readonly hotelRetailFeatureRepository: Repository<HotelRetailFeature>,

    @InjectRepository(RatePlanFeatureDailyRate, DB_NAME.POSTGRES)
    private readonly ratePlanFeatureDailyRateRepository: Repository<RatePlanFeatureDailyRate>,

    @InjectRepository(RoomProductFeatureRateAdjustment, DB_NAME.POSTGRES)
    private readonly roomProductFeatureRateAdjustmentRepository: Repository<RoomProductFeatureRateAdjustment>,

    @InjectRepository(FeatureDailyAdjustment, DB_NAME.POSTGRES)
    private readonly featureDailyAdjustmentRepository: Repository<FeatureDailyAdjustment>
  ) {}

  async findFeatures(
    input: {
      hotelId: string;
      status?: HotelRetailFeatureStatusEnum;
      relations?: FindOptionsRelations<HotelRetailFeature>;
    },
    select?: FindOptionsSelect<HotelRetailFeature>
  ): Promise<HotelRetailFeature[]> {
    const { hotelId, status, relations } = input;
    const where: FindOptionsWhere<HotelRetailFeature> = { hotelId };
    if (status) {
      where.status = status;
    }
    return await this.hotelRetailFeatureRepository.find({
      where,
      relations,
      select
    });
  }

  async findRatePlanFeatureDailyRates(
    filter: {
      ratePlanIds?: string[];
      dates: string[];
    },
    select?: FindOptionsSelect<RatePlanFeatureDailyRate>
  ): Promise<RatePlanFeatureDailyRate[]> {
    const { dates, ratePlanIds } = filter;
    const where: FindOptionsWhere<RatePlanFeatureDailyRate> = {};

    if (dates && dates.length > 0) {
      where.date = In(dates);
    }

    if (ratePlanIds && ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }
    return this.ratePlanFeatureDailyRateRepository.find({
      where,
      select
    });
  }

  async upsertRatePlanFeatureDailyRates(input: RatePlanFeatureDailyRate[]): Promise<InsertResult> {
    return this.ratePlanFeatureDailyRateRepository.upsert(input, {
      conflictPaths: ['featureId', 'ratePlanId', 'date']
    });
  }

  async upsertFeatureDailyAdjustments(input: FeatureDailyAdjustment[]): Promise<InsertResult> {
    return this.featureDailyAdjustmentRepository.upsert(input, {
      conflictPaths: ['hotelId', 'featureId', 'date']
    });
  }

  async findRoomProductFeatureRateAdjustments(
    filter: {
      hotelId: string;
      roomProductId?: string;
      roomProductIds?: string[];
      featureId?: string;
      featureIds?: string[];
      dates?: string[];
      take?: number;
      skip?: number;
    },
    select?: FindOptionsSelect<RoomProductFeatureRateAdjustment>
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    const { roomProductId, roomProductIds, dates, hotelId, featureId, featureIds, take, skip } =
      filter;
    const where: FindOptionsWhere<RoomProductFeatureRateAdjustment> = {
      hotelId: hotelId
    };

    if (dates && dates.length > 0) {
      where.date = In(dates);
    }

    if (roomProductId) {
      where.roomProductId = roomProductId;
    }

    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }

    if (featureId) {
      where.featureId = featureId;
    }

    if (featureIds && featureIds.length > 0) {
      where.featureId = In(featureIds);
    }

    return this.roomProductFeatureRateAdjustmentRepository.find({
      where,
      select,
      take,
      skip
    });
  }
  async findFeatureDailyAdjustments(
    filter: {
      hotelId: string;
      featureId?: string;
      featureIds?: string[];
      dates: string[];
    },
    select?: FindOptionsSelect<FeatureDailyAdjustment>
  ): Promise<FeatureDailyAdjustment[]> {
    const { hotelId, featureId, featureIds, dates } = filter;
    const where: FindOptionsWhere<FeatureDailyAdjustment> = {};
    if (hotelId) {
      where.hotelId = hotelId;
    }
    if (featureId) {
      where.featureId = featureId;
    }
    if (featureIds && featureIds.length > 0) {
      where.featureId = In(featureIds);
    }
    if (dates && dates.length > 0) {
      where.date = In(dates);
    }
    return this.featureDailyAdjustmentRepository.find({
      where,
      select
    });
  }

  async removeFeatureDailyAdjustments(filter: {
    hotelId: string;
    featureId: string;
    dates: string[];
  }): Promise<DeleteResult> {
    const { hotelId, featureId, dates } = filter;
    const where: FindOptionsWhere<FeatureDailyAdjustment> = {};
    if (dates && dates.length > 0) {
      where.date = In(dates);
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }
    if (featureId) {
      where.featureId = featureId;
    }
    return this.featureDailyAdjustmentRepository.delete(where);
  }
}
