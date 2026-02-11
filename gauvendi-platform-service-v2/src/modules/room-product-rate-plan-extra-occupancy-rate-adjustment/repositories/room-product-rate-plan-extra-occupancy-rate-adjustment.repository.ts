import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { getAllowedDateByDayOfWeek } from '@src/core/utils/datetime.util';
import { DayOfWeek, Weekday } from 'src/core/enums/common';
import { BadRequestException, InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { DataSource, FindOptionsSelect, FindOptionsWhere, In, Raw, Repository } from 'typeorm';
import { DbName } from '../../../core/constants/db-name.constant';
import { Filter } from '../../../core/dtos/common.dto';
import { RoomProductExtraOccupancyRate } from '../../../core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from '../../../core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductRatePlan } from '../../../core/entities/room-product-rate-plan.entity';
import {
  DailyExtraOccupancyRateDto,
  DailyRfcRatePlanExtraOccupancyRateFilterDto,
  DailyRoomProductRatePlanExtraOccupancyRateFilterDto,
  ExtraOccupancyRateDto,
  RoomProductRatePlanExtraOccupancyRateAdjustmentFilterDto,
  RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto
} from '../dto';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentDeleteFilterDto } from '../dto/room-product-rate-plan-extra-occupancy-rate-adjustment-delete-filter.dto';

@Injectable()
export class RoomProductRatePlanExtraOccupancyRateAdjustmentRepository extends BaseService {
  constructor(
    @InjectRepository(RoomProductRatePlanExtraOccupancyRateAdjustment, DbName.Postgres)
    private readonly adjustmentRepository: Repository<RoomProductRatePlanExtraOccupancyRateAdjustment>,

    @InjectRepository(RoomProductRatePlan, DbName.Postgres)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,

    @InjectRepository(RoomProductExtraOccupancyRate, DbName.Postgres)
    private readonly roomProductExtraOccupancyRateRepository: Repository<RoomProductExtraOccupancyRate>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    configService: ConfigService
  ) {
    super(configService);
  }

  findAllV2(
    filter: DailyRfcRatePlanExtraOccupancyRateFilterDto,
    select?: FindOptionsSelect<RoomProductRatePlanExtraOccupancyRateAdjustment>
  ): Promise<RoomProductRatePlanExtraOccupancyRateAdjustment[]> {
    if ((!filter.fromDate && !filter.toDate) || filter.fromDate > filter.toDate) {
      throw new BadRequestException('Invalid date range');
    }

    const where: FindOptionsWhere<RoomProductRatePlanExtraOccupancyRateAdjustment> = {};

    if (filter.fromDate && filter.toDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date AND "date"::date <= :toDate::date`, {
        fromDate: filter.fromDate,
        toDate: filter.toDate
      });
    } else if (filter.fromDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date`, { fromDate: filter.fromDate });
    } else if (filter.toDate) {
      where.date = Raw(() => `"date"::date <= :toDate::date`, { toDate: filter.toDate });
    }

    if (filter.rfcRatePlanIdList && filter.rfcRatePlanIdList.length > 0) {
      where.roomProductRatePlanId = In(filter.rfcRatePlanIdList);
    }

    return this.adjustmentRepository.find({
      where,
      select,
      relations: {
        roomProductRatePlan: true
      }
    });
  }

  async findAll(filter: RoomProductRatePlanExtraOccupancyRateAdjustmentFilterDto): Promise<{
    data: RoomProductRatePlanExtraOccupancyRateAdjustment[];
    count: number;
    totalPage: number;
  }> {
    try {
      // Set default filter values (preserving Java logic)
      const processedFilter = Filter.setDefaultValue(
        filter,
        RoomProductRatePlanExtraOccupancyRateAdjustmentFilterDto
      );

      // Build query using TypeORM QueryBuilder (similar to Ebean QRfcRatePlanExtraOccupancyRateAdjustment)
      const queryBuilder = this.adjustmentRepository.createQueryBuilder('adjustment');

      // Apply filters (preserving exact Java filtering logic)
      this.setFilterForQuery(queryBuilder, processedFilter);

      // Set paging (matching Java implementation)
      Filter.setPagingFilter(queryBuilder, processedFilter);

      // Execute query
      const entities = await queryBuilder.getMany();

      // Return response in same format as Java (preserving exact response structure)
      return {
        data: entities,
        count: entities.length,
        totalPage: 1
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get room product rate plan extra occupancy rate adjustments',
        error.message
      );
    }
  }

  async createOrUpdate(
    input: RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto
  ): Promise<RoomProductRatePlanExtraOccupancyRateAdjustment[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Convert DayOfWeek enum to weekday values (matching Java logic)

      const allowedDays = getAllowedDateByDayOfWeek(input.fromDate, input.toDate, input.dayList || []);


      const existedAdjustments = await queryRunner.manager.find(
        RoomProductRatePlanExtraOccupancyRateAdjustment,
        {
          where: {
            hotelId: input.hotelId,
            roomProductRatePlanId: input.rfcRatePlanId ,
            extraPeople: input.extraPeople,
            date: In(allowedDays)
          }
        }
      )



      // Delete existing adjustments (matching Java deleteAllPermanent logic)
      if (existedAdjustments.length > 0) {
        await queryRunner.manager.remove(existedAdjustments);
      }

      // Generate new adjustments for the date range and specified days (preserving Java Stream logic)
      const adjustments = this.generateAdjustments(input);

      // Save new adjustments (matching Java saveAll logic)
      const savedAdjustments = await queryRunner.manager.save(adjustments);

      await queryRunner.commitTransaction();

      return savedAdjustments;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Error creating/updating adjustments: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async delete(
    input: RoomProductRatePlanExtraOccupancyRateAdjustmentDeleteFilterDto
  ): Promise<RoomProductRatePlanExtraOccupancyRateAdjustment[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Build delete query (matching Java delete logic)
      let queryBuilder = queryRunner.manager
        .createQueryBuilder(RoomProductRatePlanExtraOccupancyRateAdjustment, 'adjustment')
        .where('adjustment.roomProductRatePlanId = :roomProductRatePlanId', {
          roomProductRatePlanId: input.roomProductRatePlanId
        });

      // Apply optional filters (preserving Java conditional logic)
      if (input.extraPeople !== undefined && input.extraPeople !== null) {
        queryBuilder = queryBuilder.andWhere('adjustment.extraPeople = :extraPeople', {
          extraPeople: input.extraPeople
        });
      }

      if (input.fromDate) {
        queryBuilder = queryBuilder.andWhere('adjustment.date::date >= :fromDate', {
          fromDate: this.formatDate(input.fromDate)
        });
      }

      if (input.toDate) {
        queryBuilder = queryBuilder.andWhere('adjustment.date::date <= :toDate', {
          toDate: this.formatDate(input.toDate)
        });
      }

      if (input.dayList && input.dayList.length > 0) {
        const dayValues = input.dayList.map((day) => this.dayOfWeekToPostgreSQLDOW(day));
        const dayValuesString = dayValues.join(',');
        queryBuilder = queryBuilder.andWhere(
          `EXTRACT(DOW FROM adjustment.date::date) IN (${dayValuesString})`
        );
      }

      // Find and delete adjustments (matching Java logic)
      const existedAdjustments = await queryBuilder.getMany();

      if (existedAdjustments.length > 0) {
        await queryRunner.manager.remove(existedAdjustments);
      }

      await queryRunner.commitTransaction();
      return existedAdjustments;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`Error deleting adjustments: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findDaily(filter: DailyRoomProductRatePlanExtraOccupancyRateFilterDto): Promise<{
    data: DailyExtraOccupancyRateDto[];
    count: number;
    totalPage: number;
  }> {
    try {
      // Validate date range (matching Java validation logic)
      if (!filter.fromDate || !filter.toDate || filter.fromDate > filter.toDate) {
        return {
          data: [],
          count: 0,
          totalPage: 0
        };
      }

      // Step 1: Find room product rate plans by IDs (matching Java QRfcRatePlan query)
      const roomProductRatePlanList = await this.roomProductRatePlanRepository
        .createQueryBuilder('roomProductRatePlan')
        .where('roomProductRatePlan.id IN (:...ids)', { ids: filter.roomProductRatePlanIdList })
        .getMany();

      if (!roomProductRatePlanList || roomProductRatePlanList.length === 0) {
        return {
          data: [],
          count: 0,
          totalPage: 0
        };
      }

      // Step 2: Get room product IDs and find base extra occupancy rates (matching Java rfcExtraOccupancyRates logic)
      const roomProductIdList = roomProductRatePlanList.map((rp) => rp.roomProductId);
      const roomProductExtraOccupancyRates = await this.roomProductExtraOccupancyRateRepository
        .createQueryBuilder('rate')
        .where('rate.roomProductId IN (:...roomProductIds)', { roomProductIds: roomProductIdList })
        .getMany();

      // Group base rates by room product ID (matching Java groupingBy logic)
      const roomProductExtraOccupancyRatesMap = new Map<string, RoomProductExtraOccupancyRate[]>();
      for (const rate of roomProductExtraOccupancyRates) {
        if (!roomProductExtraOccupancyRatesMap.has(rate.roomProductId)) {
          roomProductExtraOccupancyRatesMap.set(rate.roomProductId, []);
        }
        roomProductExtraOccupancyRatesMap.get(rate.roomProductId)!.push(rate);
      }

      // Step 3: Get adjustments for the date range (matching Java adjustment query)
      const adjustments = await this.adjustmentRepository
        .createQueryBuilder('adjustment')
        .where('adjustment.roomProductRatePlanId IN (:...ratePlanIds)', {
          ratePlanIds: filter.roomProductRatePlanIdList
        })
        .andWhere('adjustment.date::date >= :fromDate', {
          fromDate: this.formatDate(filter.fromDate)
        })
        .andWhere('adjustment.date::date <= :toDate', { toDate: this.formatDate(filter.toDate) })
        .getMany();

      // Group adjustments by room product rate plan ID (matching Java groupingBy logic)
      const adjustmentsPerRatePlanId = new Map<
        string,
        RoomProductRatePlanExtraOccupancyRateAdjustment[]
      >();
      for (const adjustment of adjustments) {
        if (!adjustmentsPerRatePlanId.has(adjustment.roomProductRatePlanId)) {
          adjustmentsPerRatePlanId.set(adjustment.roomProductRatePlanId, []);
        }
        adjustmentsPerRatePlanId.get(adjustment.roomProductRatePlanId)!.push(adjustment);
      }

      // Step 4: Create room product rate plan to adjustment mapping (matching Java logic)
      const ratePlanAdjustmentMap = new Map<
        RoomProductRatePlan,
        RoomProductRatePlanExtraOccupancyRateAdjustment[]
      >();
      for (const ratePlan of roomProductRatePlanList) {
        const adjustmentList = adjustmentsPerRatePlanId.get(ratePlan.id) || [];
        ratePlanAdjustmentMap.set(ratePlan, adjustmentList);
      }

      // Step 5: Process each rate plan and generate daily rates (matching Java complex logic)
      const result: DailyExtraOccupancyRateDto[] = [];

      for (const [ratePlan, ratePlanAdjustmentList] of ratePlanAdjustmentMap.entries()) {
        const baseRateList = roomProductExtraOccupancyRatesMap.get(ratePlan.roomProductId) || [];

        // Group adjustments by date (matching Java groupingBy logic)
        const adjustmentsPerDate = new Map<
          string,
          RoomProductRatePlanExtraOccupancyRateAdjustment[]
        >();
        for (const adjustment of ratePlanAdjustmentList) {
          const dateKey = adjustment.date;
          if (!adjustmentsPerDate.has(dateKey)) {
            adjustmentsPerDate.set(dateKey, []);
          }
          adjustmentsPerDate.get(dateKey)!.push(adjustment);
        }

        // Generate daily rates for date range (matching Java Stream.iterate logic)
        const dailyRates = this.generateDateRange(filter.fromDate, filter.toDate).map((date) => {
          const dateKey = this.formatDate(date);

          // Get adjustments for this date (matching Java getOrDefault logic)
          const dateAdjustments = adjustmentsPerDate.get(dateKey) || [];

          // Convert adjustments to ExtraOccupancyRate objects (matching Java map logic)
          const extraOccupancyRates: ExtraOccupancyRateDto[] = dateAdjustments.map(
            (adjustment) => ({
              extraPeople: adjustment.extraPeople,
              extraRate: parseFloat(adjustment.extraRate)
            })
          );

          // Get list of adjusted extra people counts (matching Java logic)
          const adjustedExtraPeoples = extraOccupancyRates.map((rate) => rate.extraPeople);

          // Add base rates for extra people not covered by adjustments (matching Java logic)
          for (const baseRate of baseRateList) {
            if (
              baseRate.extraPeople !== undefined &&
              baseRate.extraPeople !== null &&
              !adjustedExtraPeoples.includes(baseRate.extraPeople)
            ) {
              extraOccupancyRates.push({
                extraPeople: baseRate.extraPeople,
                extraRate: parseFloat(baseRate.extraRate?.toString() || '0')
              });
            }
          }

          // Ensure default rate (extraPeople = 0) exists (matching Java hasDefault logic)
          const hasDefault = extraOccupancyRates.some((rate) => rate.extraPeople === 0);
          if (!hasDefault) {
            extraOccupancyRates.push(new ExtraOccupancyRateDto(0, 0));
          }

          // Sort by extra people count (matching Java sorted logic)
          extraOccupancyRates.sort((a, b) => a.extraPeople - b.extraPeople);

          // Create daily rate object (matching Java DailyExtraOccupancyRate creation)
          const dailyRate: DailyExtraOccupancyRateDto = {
            roomProductRatePlanId: ratePlan.id,
            date: date,
            extraOccupancyRateList: extraOccupancyRates
          };

          return dailyRate;
        });

        // Add all daily rates to result (matching Java addAll logic)
        result.push(...dailyRates);
      }

      // Return response data (matching Java response format)
      return {
        data: result,
        count: result.length,
        totalPage: 1
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get room product rate plan extra occupancy rate adjustments',
        error.message
      );
    }
  }

  private setFilterForQuery(
    queryBuilder: any,
    filter: RoomProductRatePlanExtraOccupancyRateAdjustmentFilterDto
  ): void {
    // Apply filters exactly as in Java setFilterForQuery method
    if (filter.hotelId) {
      queryBuilder.andWhere('adjustment.hotelId = :hotelId', { hotelId: filter.hotelId });
    }

    if (filter.roomProductRatePlanIdList && filter.roomProductRatePlanIdList.length > 0) {
      queryBuilder.andWhere('adjustment.roomProductRatePlanId IN (:...roomProductRatePlanIds)', {
        roomProductRatePlanIds: filter.roomProductRatePlanIdList
      });
    }

    if (filter.idList && filter.idList.length > 0) {
      queryBuilder.andWhere('adjustment.id IN (:...ids)', { ids: filter.idList });
    }

    if (filter.fromDate) {
      queryBuilder.andWhere('adjustment.date::date >= :fromDate::date', {
        fromDate: this.formatDate(filter.fromDate)
      });
    }

    if (filter.toDate) {
      queryBuilder.andWhere('adjustment.date::date <= :toDate::date', {
        toDate: this.formatDate(filter.toDate)
      });
    }
  }

  private generateAdjustments(
    input: RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto
  ): RoomProductRatePlanExtraOccupancyRateAdjustment[] {
    // Preserve the exact Java Stream logic for generating date-based adjustments
    const adjustments: RoomProductRatePlanExtraOccupancyRateAdjustment[] = [];


    // Convert DayOfWeek enum to JavaScript day numbers for filtering


    const allowedDays = getAllowedDateByDayOfWeek(input.fromDate, input.toDate, input.dayList || []);

    for (const date of allowedDays) {
      const adjustment = new RoomProductRatePlanExtraOccupancyRateAdjustment();
      adjustment.hotelId = input.hotelId;
      adjustment.roomProductRatePlanId = input.rfcRatePlanId ;
      adjustment.extraPeople = input.extraPeople;
      adjustment.extraRate = input.extraRate.toString(); // Convert to string to match entity
      adjustment.date = date; // Format as YYYY-MM-DD

      if (!this.isProd) {
        adjustment.createdBy = this.currentSystem;
        adjustment.updatedBy = this.currentSystem;
      }

      adjustments.push(adjustment);
    }


    return adjustments;
  }

  private dayOfWeekToPostgreSQLDOW(dayOfWeek: Weekday): number {
    // Convert DayOfWeek enum to PostgreSQL EXTRACT(DOW) values (Sunday = 0, Monday = 1, Saturday = 6)
    // PostgreSQL DOW: Sunday = 0, Monday = 1, Tuesday = 2, ..., Saturday = 6
    const mapping = {
      [Weekday.Sunday]: 0,
      [Weekday.Monday]: 1,
      [Weekday.Tuesday]: 2,
      [Weekday.Wednesday]: 3,
      [Weekday.Thursday]: 4,
      [Weekday.Friday]: 5,
      [Weekday.Saturday]: 6
    };
    return mapping[dayOfWeek];
  }

  private dayOfWeekToJSDay(dayOfWeek: DayOfWeek): number {
    // Convert DayOfWeek enum to JavaScript day numbers (Sunday = 0, Saturday = 6)
    const mapping = {
      [DayOfWeek.Sunday]: 0,
      [DayOfWeek.MONDAY]: 1,
      [DayOfWeek.TUESDAY]: 2,
      [Weekday.Wednesday]: 3,
      [DayOfWeek.THURSDAY]: 4,
      [DayOfWeek.FRIDAY]: 5,
      [DayOfWeek.SATURDAY]: 6
    };
    return mapping[dayOfWeek];
  }

  private formatDate(date: Date): string {
    // Format date as YYYY-MM-DD to match database format
    return date.toISOString().split('T')[0];
  }

  private generateDateRange(fromDate: Date, toDate: Date): Date[] {
    // Generate date range matching Java Stream.iterate logic
    const dates: Date[] = [];
    const currentDate = new Date(fromDate);
    const endDate = new Date(toDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }
}
