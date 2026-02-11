import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
// Note: Using manual transaction management instead of @Transactional decorator
import { ConfigService } from '@nestjs/config';
import { DbName } from 'src/core/constants/db-name.constant';
import { BaseService } from 'src/core/services/base.service';
import { Filter } from '../../../core/dtos/common.dto';
import { RoomProductDailyBasePrice } from '../../../core/entities/room-product-daily-base-price.entity';
import { RoomProductFeatureRateAdjustment } from '../../../core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductRatePlan } from '../../../core/entities/room-product-rate-plan.entity';
import {
  DynamicRoomProductFeatureRateAdjustmentInputDto,
  RoomProductFeatureRateAdjustmentDeleteFilterDto,
  RoomProductFeatureRateAdjustmentFilterDto,
  RoomProductFeatureRateAdjustmentInputDto,
  RoomProductRatePlanInputDto
} from '../dto';
import {
  RoomProductFeatureRateAdjustmentValidationMessage,
  RoomProductFeatureRateAdjustmentValidationMessages
} from '../enums/room-product-feature-rate-adjustment-validation-message.enum';
import { Weekday } from 'src/core/enums/common';


@Injectable()
export class RoomProductFeatureRateAdjustmentRepository extends BaseService {
  private readonly logger = new Logger(RoomProductFeatureRateAdjustmentRepository.name);

  constructor(
    @InjectRepository(RoomProductFeatureRateAdjustment, DbName.Postgres)
    private readonly roomProductFeatureRateAdjustmentRepository: Repository<RoomProductFeatureRateAdjustment>,
    @InjectRepository(RoomProductRatePlan, DbName.Postgres)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,
    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,
    configService: ConfigService
  ) {
    super(configService);
  }

  async createOrUpdate(
    input: RoomProductFeatureRateAdjustmentInputDto
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        // Validate input (basic validation)
        if (!input) {
          this.logger.error('Null input in createOrUpdateRoomProductFeatureRateAdjustment');
          throw new Error('Null input in createOrUpdateRoomProductFeatureRateAdjustment');
        }

        // Create filter for existing adjustments
        const filter: RoomProductFeatureRateAdjustmentFilterDto = {
          fromDate: input.fromDate,
          toDate: input.toDate,
          days: input.days,
          featureId: input.featureId,
          roomProductRatePlanId: input.roomProductRatePlanId,
          pageSize: -1,
          offset: 0
        };

        // Find and delete existing adjustments using transaction manager
        const existingAdjustments = await this.findAdjustmentsByFilterWithManager(manager, filter);
        if (existingAdjustments.length > 0) {
          await manager.remove(RoomProductFeatureRateAdjustment, existingAdjustments);
        }

        // Generate date range and create new adjustments
        const adjustments = this.generateAdjustmentsForDateRange(input);

        // Save new adjustments using transaction manager
        const savedAdjustments = await manager.save(RoomProductFeatureRateAdjustment, adjustments);

        // Update daily feature adjustment in base price using transaction manager
        await this.updateDailyFeatureAdjustmentInBasePriceWithManager(manager, input);

        return savedAdjustments;
      } catch (error) {
        this.logger.error('Error in createOrUpdateRoomProductFeatureRateAdjustment:', error);
        throw new Error(
          'Failed to create or update room product feature rate adjustment: ' + error.message
        );
      }
    });
  }

  async findAll(
    filter: RoomProductFeatureRateAdjustmentFilterDto
  ): Promise<{ data: RoomProductFeatureRateAdjustment[]; totalCount: number }> {
    // Set default filter values
    filter = Filter.setDefaultValue(filter, RoomProductFeatureRateAdjustmentFilterDto);

    // Create query builder
    const queryBuilder = this.roomProductFeatureRateAdjustmentRepository
      .createQueryBuilder('adjustment')
      .leftJoinAndSelect('adjustment.roomProductRatePlan', 'roomProductRatePlan')
      .leftJoinAndSelect('roomProductRatePlan.ratePlan', 'ratePlan');

    // Apply filters
    this.setFilterForQuery(queryBuilder, filter);

    // Apply pagination
    Filter.setPagingFilter(queryBuilder, filter);

    // Execute query
    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    // Map to DTOs

    return { data: entities, totalCount };
  }

  async update(
    inputs: RoomProductFeatureRateAdjustmentInputDto[]
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        // Validate inputs
        if (!inputs || inputs.length === 0) {
          throw new Error(
            RoomProductFeatureRateAdjustmentValidationMessages[
              RoomProductFeatureRateAdjustmentValidationMessage.NULL_INPUT
            ]
          );
        }

        // Create map of rate original by feature ID
        const rateOriginalMap = new Map<string, string>();
        inputs.forEach((input) => {
          rateOriginalMap.set(input.featureId, input.rateOriginal);
        });

        // Find adjustments to update using transaction manager
        // TODO RoomProductFeatureRateAdjustment: isAutomatePricing using in Java code but not in Nestjs Entity
        const featureIds = Array.from(rateOriginalMap.keys());
        const adjustments = await manager.find(RoomProductFeatureRateAdjustment, {
          where: { featureId: In(featureIds) },
          relations: ['roomProductRatePlan', 'roomProductRatePlan.ratePlan']
        });

        // Update rate original for each adjustment
        adjustments.forEach((adjustment) => {
          const newRateOriginal = rateOriginalMap.get(adjustment.featureId);
          if (newRateOriginal) {
            adjustment.rateOriginal = parseFloat(newRateOriginal);
          }
        });

        // Save updated adjustments using transaction manager
        const savedAdjustments = await manager.save(RoomProductFeatureRateAdjustment, adjustments);

        // Update daily feature adjustment in base price for each input using transaction manager
        for (const input of inputs) {
          await this.updateDailyFeatureAdjustmentInBasePriceWithManager(manager, input);
        }

        return savedAdjustments;
      } catch (error) {
        this.logger.error('Error in updateRoomProductFeatureRateAdjustment:', error);
        throw new Error('Failed to update room product feature rate adjustment: ' + error.message);
      }
    });
  }

  async delete(
    input: RoomProductFeatureRateAdjustmentDeleteFilterDto
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        // Validate input
        if (!input) {
          throw new Error(
            RoomProductFeatureRateAdjustmentValidationMessages[
              RoomProductFeatureRateAdjustmentValidationMessage.NULL_INPUT
            ]
          );
        }

        // Create filter for adjustments to delete
        const filter: RoomProductFeatureRateAdjustmentFilterDto = {
          fromDate: input.fromDate,
          toDate: input.toDate,
          days: input.days,
          featureId: input.featureId,
          roomProductRatePlanId: input.roomProductRatePlanId,
          pageSize: -1,
          offset: 0
        };

        // Find adjustments to delete using transaction manager
        const adjustments = await this.findAdjustmentsByFilterWithManager(manager, filter);

        // Delete adjustments using transaction manager
        await manager.remove(RoomProductFeatureRateAdjustment, adjustments);

        return adjustments;
      } catch (error) {
        this.logger.error('Error in deleteRoomProductFeatureRateAdjustment:', error);
        throw new Error('Failed to delete room product feature rate adjustment: ' + error.message);
      }
    });
  }

  async createOrUpdateList(
    inputs: RoomProductFeatureRateAdjustmentInputDto[]
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    try {
      const results: RoomProductFeatureRateAdjustment[] = [];
      for (const input of inputs) {
        // Find room product rate plan
        const roomProductRatePlan = await this.roomProductRatePlanRepository.findOne({
          where: { id: input.roomProductRatePlanId }
        });

        if (roomProductRatePlan) {
          // Find and delete existing adjustments
          const queryBuilder = this.roomProductFeatureRateAdjustmentRepository
            .createQueryBuilder('adjustment')
            .where('adjustment.roomProductRatePlanId = :roomProductRatePlanId', {
              roomProductRatePlanId: input.roomProductRatePlanId
            })
            .andWhere('adjustment.featureId = :featureId', { featureId: input.featureId })
            .andWhere('adjustment.date::date >= :fromDate::date', { fromDate: input.fromDate })
            .andWhere('adjustment.date::date <= :toDate::date', { toDate: input.toDate });

          if (input.days && input.days.length > 0) {
            const dayValues = input.days.map((day) => this.convertDayOfWeekToNumber(day)).join(',');
            queryBuilder.andWhere(`EXTRACT(DOW FROM adjustment.date::date) IN (${dayValues})`);
          }

          const existingAdjustments = await queryBuilder.getMany();

          if (existingAdjustments.length > 0) {
            await this.roomProductFeatureRateAdjustmentRepository.remove(existingAdjustments);
          }

          // Generate and save new adjustments
          const adjustments = this.generateAdjustmentsForDateRange(input);
          const savedAdjustments =
            await this.roomProductFeatureRateAdjustmentRepository.save(adjustments);
          results.push(...savedAdjustments);
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error in createOrUpdateRoomProductFeatureRateAdjustmentList:', error);
      throw new Error(
        'Failed to create or update room product feature rate adjustment list: ' + error.message
      );
    }
  }

  async purge(inputs: RoomProductRatePlanInputDto[]): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const roomProductRatePlanIds = inputs.map((input) => input.id);
        const existingAdjustments = await manager.find(RoomProductFeatureRateAdjustment, {
          where: { roomProductRatePlanId: In(roomProductRatePlanIds) }
        });

        await manager.remove(RoomProductFeatureRateAdjustment, existingAdjustments);

        return existingAdjustments;
      } catch (error) {
        this.logger.error('Error in purgeRoomProductFeatureRateAdjustmentList:', error);
        throw new Error(
          'Failed to purge room product feature rate adjustment list: ' + error.message
        );
      }
    });
  }

  async dynamicAdjust(
    inputs: DynamicRoomProductFeatureRateAdjustmentInputDto[]
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const createAdjustments: RoomProductFeatureRateAdjustment[] = [];
        const updateAdjustments: RoomProductFeatureRateAdjustment[] = [];

        // Merge inputs by roomProductRatePlanId and date
        const mergedInputs = this.mergeInputsByRatePlanAndDate(inputs);

        for (const input of mergedInputs) {
          try {
            // Find existing adjustment using transaction manager
            const existingAdjustment = await manager.findOne(RoomProductFeatureRateAdjustment, {
              where: {
                roomProductRatePlanId: input.roomProductRatePlanId,
                featureId: input.featureId,
                date: input.date
              }
            });

            if (existingAdjustment) {
              // Update existing adjustment
              const currentAdjustment = parseFloat(
                existingAdjustment.rateAdjustment?.toString() || '0'
              );
              const priceGap = parseFloat(input.priceGap);
              existingAdjustment.rateAdjustment = currentAdjustment + priceGap;
              updateAdjustments.push(existingAdjustment);
            } else {
              // Create new adjustment
              const rateOriginal = parseFloat(input.rateOriginal);
              const priceGap = parseFloat(input.priceGap);
              const adjustment = new RoomProductFeatureRateAdjustment();

              // Get hotel ID and room product ID from room product rate plan using transaction manager
              const roomProductRatePlan = await manager.findOne(RoomProductRatePlan, {
                where: { id: input.roomProductRatePlanId }
              });

              if (roomProductRatePlan) {
                adjustment.hotelId = roomProductRatePlan.hotelId;
                adjustment.roomProductId = roomProductRatePlan.roomProductId;
                adjustment.roomProductRatePlanId = input.roomProductRatePlanId;
                adjustment.featureId = input.featureId;
                adjustment.date = input.date;
                adjustment.rateOriginal = rateOriginal;
                adjustment.rateAdjustment = rateOriginal + priceGap;

                if (!this.isProd) {
                  adjustment.createdBy = this.currentSystem;
                  adjustment.updatedBy = this.currentSystem;
                }

                createAdjustments.push(adjustment);
              }
            }
          } catch (error) {
            this.logger.error('dynamicAdjustRoomProductFeatureRate input error:', input, error);
            throw new Error('Failed to dynamic adjust room product feature rate: ' + error.message);
          }
        }

        const allAdjustments: RoomProductFeatureRateAdjustment[] = [];

        // Save create adjustments using transaction manager
        if (createAdjustments.length > 0) {
          const savedCreateAdjustments = await manager.save(
            RoomProductFeatureRateAdjustment,
            createAdjustments
          );
          allAdjustments.push(...savedCreateAdjustments);
        }

        // Save update adjustments using transaction manager
        if (updateAdjustments.length > 0) {
          const savedUpdateAdjustments = await manager.save(
            RoomProductFeatureRateAdjustment,
            updateAdjustments
          );
          allAdjustments.push(...savedUpdateAdjustments);
        }

        return allAdjustments;
      } catch (error) {
        this.logger.error('Error in dynamicAdjustRoomProductFeatureRate:', error);
        throw new Error('Failed to dynamic adjust room product feature rate: ' + error.message);
      }
    });
  }

  async deleteByRoomProductRatePlanId(
    roomProductRatePlanIds: string[]
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.dataSource.transaction(async (manager) => {
      const entities = await manager.find(RoomProductFeatureRateAdjustment, {
        where: { roomProductRatePlanId: In(roomProductRatePlanIds) }
      });

      await manager.remove(RoomProductFeatureRateAdjustment, entities);
      return entities;
    });
  }

  // Private helper methods

  private generateAdjustmentsForDateRange(
    input: RoomProductFeatureRateAdjustmentInputDto
  ): RoomProductFeatureRateAdjustment[] {
    const adjustments: RoomProductFeatureRateAdjustment[] = [];
    const fromDate = new Date(input.fromDate);
    const toDate = new Date(input.toDate);

    for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = this.convertNumberToWeekday(date.getDay());

      // Check if this day should be included
      if (!input.days || input.days.length === 0 || input.days.includes(dayOfWeek)) {
        const adjustment = new RoomProductFeatureRateAdjustment();
        // Note: hotelId and roomProductId need to be set from roomProductRatePlan
        adjustment.hotelId = input.hotelId;
        adjustment.roomProductId = input.roomProductId;
        adjustment.roomProductRatePlanId = input.roomProductRatePlanId;
        adjustment.featureId = input.featureId;
        adjustment.rateAdjustment = parseFloat(input.rateAdjustment);
        adjustment.rateOriginal = parseFloat(input.rateOriginal);
        adjustment.date = this.formatDate(date); // Remove new Date() wrapper since date is already Date object
        adjustments.push(adjustment);

        if (!this.isProd) {
          adjustment.createdBy = this.currentSystem;
          adjustment.updatedBy = this.currentSystem;
        }
      }
    }

    return adjustments;
  }

  private setFilterForQuery(
    queryBuilder: any,
    filter: RoomProductFeatureRateAdjustmentFilterDto
  ): void {
    if (filter.roomProductRatePlanId) {
      queryBuilder.andWhere('adjustment.roomProductRatePlanId = :roomProductRatePlanId', {
        roomProductRatePlanId: filter.roomProductRatePlanId
      });
    }

    if (filter.hotelId) {
      queryBuilder.andWhere('adjustment.hotelId = :hotelId', { hotelId: filter.hotelId });
    }

    if (filter.roomProductId) {
      queryBuilder.andWhere('adjustment.roomProductId = :roomProductId', {
        roomProductId: filter.roomProductId
      });
    }

    if (filter.featureId) {
      queryBuilder.andWhere('adjustment.featureId = :featureId', { featureId: filter.featureId });
    }

    if (filter.fromDate) {
      queryBuilder.andWhere('adjustment.date::date >= :fromDate::date', {
        fromDate: filter.fromDate
      });
    }

    if (filter.toDate) {
      queryBuilder.andWhere('adjustment.date::date <= :toDate::date', { toDate: filter.toDate });
    }

    if (filter.roomProductRatePlanIdList && filter.roomProductRatePlanIdList.length > 0) {
      queryBuilder.andWhere('adjustment.roomProductRatePlanId IN (:...roomProductRatePlanIdList)', {
        roomProductRatePlanIdList: filter.roomProductRatePlanIdList
      });
    }

    if (filter.featureIdList && filter.featureIdList.length > 0) {
      queryBuilder.andWhere('adjustment.featureId IN (:...featureIdList)', {
        featureIdList: filter.featureIdList
      });
    }

    if (filter.roomProductIdList && filter.roomProductIdList.length > 0) {
      queryBuilder.andWhere('adjustment.roomProductId IN (:...roomProductIdList)', {
        roomProductIdList: filter.roomProductIdList
      });
    }

    if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
      queryBuilder.andWhere('ratePlan.id IN (:...ratePlanIdList)', {
        ratePlanIdList: filter.ratePlanIdList
      });
    }

    // Filter by days of week
    if (filter.days && filter.days.length > 0) {
      const dayValues = filter.days.map((day) => this.convertDayOfWeekToNumber(day)).join(',');
      queryBuilder.andWhere(`EXTRACT(DOW FROM adjustment.date::date) IN (${dayValues})`);
    }

    // Add ordering
    queryBuilder.orderBy('adjustment.createdAt', 'DESC');
  }

  private mergeInputsByRatePlanAndDate(
    inputs: DynamicRoomProductFeatureRateAdjustmentInputDto[]
  ): DynamicRoomProductFeatureRateAdjustmentInputDto[] {
    const mergedInputs: DynamicRoomProductFeatureRateAdjustmentInputDto[] = [];

    if (!inputs || inputs.length === 0) return mergedInputs;

    // Group inputs by roomProductRatePlanId and date
    const inputsByRatePlanAndDate = new Map<
      string,
      Map<string, DynamicRoomProductFeatureRateAdjustmentInputDto[]>
    >();

    inputs.forEach((input) => {
      if (input.roomProductRatePlanId && input.date) {
        if (!inputsByRatePlanAndDate.has(input.roomProductRatePlanId)) {
          inputsByRatePlanAndDate.set(input.roomProductRatePlanId, new Map());
        }
        const dateMap = inputsByRatePlanAndDate.get(input.roomProductRatePlanId);
        if (dateMap) {
          if (!dateMap.has(input.date)) {
            dateMap.set(input.date, []);
          }
          const inputList = dateMap.get(input.date);
          if (inputList) {
            inputList.push(input);
          }
        }
      }
    });

    // Merge inputs for each roomProductRatePlanId and date
    inputsByRatePlanAndDate.forEach((dateMap, roomProductRatePlanId) => {
      dateMap.forEach((inputList, date) => {
        let rateOriginalSum = 0;
        let priceGapSum = 0;

        inputList.forEach((input) => {
          rateOriginalSum += parseFloat(input.rateOriginal);
          priceGapSum += parseFloat(input.priceGap);
        });

        const mergedInput: DynamicRoomProductFeatureRateAdjustmentInputDto = {
          roomProductRatePlanId,
          featureId: roomProductRatePlanId, // fake id as per Java logic
          rateOriginal: rateOriginalSum.toString(),
          priceGap: priceGapSum.toString(),
          date
        };

        mergedInputs.push(mergedInput);
      });
    });

    return mergedInputs;
  }

  private convertDayOfWeekToNumber(weekday: Weekday): number {
    // PostgreSQL EXTRACT(DOW FROM date) returns: 0=Sunday, 1=Monday, ..., 6=Saturday
    const weekdayMap: Record<Weekday, number> = {
      [Weekday.Sunday]: 0,
      [Weekday.Monday]: 1,
      [Weekday.Tuesday]: 2,
      [Weekday.Wednesday]: 3,
      [Weekday.Thursday]: 4,
      [Weekday.Friday]: 5,
      [Weekday.Saturday]: 6
    };
    return weekdayMap[weekday] ?? 0;
  }

  private convertNumberToWeekday(dayNumber: number): Weekday {
    const numberMap: Record<number, Weekday> = {
      0: Weekday.Sunday,
      1: Weekday.Monday,
      2: Weekday.Tuesday,
      3: Weekday.Wednesday,
      4: Weekday.Thursday,
      5: Weekday.Friday,
      6: Weekday.Saturday
    };
    return numberMap[dayNumber] ?? Weekday.Sunday;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Transaction-aware helper methods
  private async findAdjustmentsByFilterWithManager(
    manager: EntityManager,
    filter: RoomProductFeatureRateAdjustmentFilterDto
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    const queryBuilder = manager
      .createQueryBuilder(RoomProductFeatureRateAdjustment, 'adjustment')
      .leftJoinAndSelect('adjustment.roomProductRatePlan', 'roomProductRatePlan')
      .leftJoinAndSelect('roomProductRatePlan.ratePlan', 'ratePlan');
    this.setFilterForQuery(queryBuilder, filter);
    return await queryBuilder.getMany();
  }

  private async updateDailyFeatureAdjustmentInBasePriceWithManager(
    manager: EntityManager,
    input: RoomProductFeatureRateAdjustmentInputDto
  ): Promise<void> {
    try {
      const roomProductRatePlan = await manager.findOne(RoomProductRatePlan, {
        where: { id: input.roomProductRatePlanId },
        relations: ['ratePlan']
      });

      if (roomProductRatePlan && roomProductRatePlan.ratePlan) {
        let dayValues = '';
        if (input.days && input.days.length > 0) {
          dayValues = input.days.map((day) => this.convertDayOfWeekToNumber(day)).join(',');
        }

        // Find room product daily base prices to update
        const queryBuilder = manager
          .createQueryBuilder(RoomProductDailyBasePrice, 'bp')
          .where('bp.ratePlanId = :ratePlanId', {
            ratePlanId: roomProductRatePlan.ratePlan.id
          })
          .andWhere('bp.hotelId = :hotelId', { hotelId: roomProductRatePlan.hotelId })
          .andWhere('bp.roomProductId = :roomProductId', {
            roomProductId: roomProductRatePlan.roomProductId
          })
          .andWhere('bp.date::date >= :fromDate::date', { fromDate: input.fromDate })
          .andWhere('bp.date::date <= :toDate::date', { toDate: input.toDate });

        if (dayValues) {
          queryBuilder.andWhere(`EXTRACT(DOW FROM bp.date::date) IN (${dayValues})`);
        }

        const roomProductDailyBasePrices = await queryBuilder.getMany();

        if (roomProductDailyBasePrices.length > 0) {
          // Find feature rate adjustments for the same period
          const adjustmentQueryBuilder = manager
            .createQueryBuilder(RoomProductFeatureRateAdjustment, 'adjustment')
            .where('adjustment.roomProductRatePlanId = :roomProductRatePlanId', {
              roomProductRatePlanId: input.roomProductRatePlanId
            })
            .andWhere('adjustment.date::date >= :fromDate::date', { fromDate: input.fromDate })
            .andWhere('adjustment.date::date <= :toDate::date', { toDate: input.toDate });

          if (dayValues) {
            adjustmentQueryBuilder.andWhere(
              `EXTRACT(DOW FROM adjustment.date::date) IN (${dayValues})`
            );
          }

          const featureRateAdjustments = await adjustmentQueryBuilder.getMany();

          // Group adjustments by roomProductRatePlanId and date
          const adjustmentMap = new Map<string, Map<string, RoomProductFeatureRateAdjustment[]>>();
          featureRateAdjustments.forEach((adjustment) => {
            if (!adjustmentMap.has(adjustment.roomProductRatePlanId)) {
              adjustmentMap.set(adjustment.roomProductRatePlanId, new Map());
            }
            const dateMap = adjustmentMap.get(adjustment.roomProductRatePlanId);
            if (dateMap) {
              if (!dateMap.has(adjustment.date)) {
                dateMap.set(adjustment.date, []);
              }
              const adjustmentList = dateMap.get(adjustment.date);
              if (adjustmentList) {
                adjustmentList.push(adjustment);
              }
            }
          });

          // Update feature adjustments in base prices
          roomProductDailyBasePrices.forEach((basePrice) => {
            const adjustmentPerDayMap = adjustmentMap.get(roomProductRatePlan.id);
            if (adjustmentPerDayMap) {
              const featureAdjustmentListPerDay = adjustmentPerDayMap.get(basePrice.date) || [];
              let featureAdjustment = 0;

              featureAdjustmentListPerDay.forEach((adjustment) => {
                const rateAdjustment = parseFloat(adjustment.rateAdjustment?.toString() || '0');
                const rateOriginal = parseFloat(adjustment.rateOriginal?.toString() || '0');
                featureAdjustment += rateAdjustment - rateOriginal;
              });

              basePrice.featurePriceAdjustment = featureAdjustment;
            }
          });

          await manager.save(RoomProductDailyBasePrice, roomProductDailyBasePrices);
        }
      }
    } catch (error) {
      this.logger.error('Error in updateDailyFeatureAdjustmentInBasePriceWithManager:', error);
      throw new Error('Failed to update daily feature adjustment in base price: ' + error.message);
    }
  }
}
