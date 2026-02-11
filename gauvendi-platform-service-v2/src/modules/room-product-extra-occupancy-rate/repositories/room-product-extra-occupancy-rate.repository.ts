import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { Filter } from 'src/core/dtos/common.dto';
import { RoomProductExtraOccupancyRate } from 'src/core/entities/room-product-extra-occupancy-rate.entity';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsSelect, In, Repository, SelectQueryBuilder } from 'typeorm';
import { RoomProductExtraOccupancyRateFilterDto } from '../dto/room-product-extra-occupancy-rate-filter.dto';
import { RoomProductExtraOccupancyRateInputDto } from '../dto/room-product-extra-occupancy-rate-input.dto';

@Injectable()
export class RoomProductExtraOccupancyRateRepository extends BaseService {
  constructor(
    @InjectRepository(RoomProductExtraOccupancyRate, DbName.Postgres)
    private readonly roomProductExtraOccupancyRateRepository: Repository<RoomProductExtraOccupancyRate>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(filter: RoomProductExtraOccupancyRateFilterDto): Promise<{
    data: RoomProductExtraOccupancyRate[];
    count: number;
    pageSize?: number;
  }> {
    // Set default filter values
    filter = Filter.setDefaultValue(filter, RoomProductExtraOccupancyRateFilterDto);

    // Create query builder
    const queryBuilder =
      this.roomProductExtraOccupancyRateRepository.createQueryBuilder('roomProductExtraOccupancyRate');

    // Apply filters
    this.setFilterForQuery(queryBuilder, filter);

    // Apply pagination
    Filter.setPagingFilter(queryBuilder, filter);

    // Execute query
    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    return {
      data: entities,
      count: totalCount,
      pageSize: filter.pageSize
    };
  }

  async createOrUpdate(
    input: RoomProductExtraOccupancyRateInputDto
  ): Promise<RoomProductExtraOccupancyRate> {
    try {
      // Find existing entity by hotelId, rfcId, and extraPeople
      const existingEntity = await this.roomProductExtraOccupancyRateRepository.findOne({
        where: {
          hotelId: input.hotelId,
          roomProductId: input.roomProductId,
          extraPeople: input.extraPeople
        }
      });

      let entity: RoomProductExtraOccupancyRate;

      if (!existingEntity) {
        // Create new entity
        entity = new RoomProductExtraOccupancyRate();
        entity.roomProductId = input.roomProductId;
        entity.hotelId = input.hotelId;
        entity.extraPeople = input.extraPeople;
        entity.extraRate = input.extraRate ? Number(input.extraRate) : undefined;

        if (!this.isProd) {
          entity.createdBy = this.currentSystem;
          entity.updatedBy = this.currentSystem;
        }

      } else {
        // Update existing entity
        entity = existingEntity;
        entity.extraRate = input.extraRate ? Number(input.extraRate) : undefined;
      }

      // Save entity
      const savedEntity = await this.roomProductExtraOccupancyRateRepository.save(entity);

      return savedEntity;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create or update RFC extra occupancy rate: ' + error.message
      );
    }
  }

  async delete(
    input: RoomProductExtraOccupancyRateInputDto
  ): Promise<RoomProductExtraOccupancyRate[]> {
    try {
      // Build query to find entities to delete
      const queryBuilder = this.roomProductExtraOccupancyRateRepository
        .createQueryBuilder('rfcExtraOccupancyRate')
        .where('rfcExtraOccupancyRate.roomProductId = :roomProductId', {
          roomProductId: input.roomProductId
        });

      // If extraPeople is specified, filter by it
      if (input.extraPeople !== undefined && input.extraPeople !== null) {
        queryBuilder.andWhere('rfcExtraOccupancyRate.extraPeople = :extraPeople', {
          extraPeople: input.extraPeople
        });
      }

      // Find entities to delete
      const entities = await queryBuilder.getMany();

      if (!entities || entities.length === 0) {
        throw new NotFoundException('Room product extra occupancy rate not found');
      }

      // Delete entities (hard delete to match Java behavior)
      await this.roomProductExtraOccupancyRateRepository.remove(entities);

      return entities;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete room product extra occupancy rate: ' + error.message
      );
    }
  }

  async findByRoomProductIds(
    roomProductIds: string[],
    select?: FindOptionsSelect<RoomProductExtraOccupancyRate>
  ): Promise<RoomProductExtraOccupancyRate[]> {
    return await this.roomProductExtraOccupancyRateRepository.find({
      where: {
        roomProductId: In(roomProductIds)
      },
      select
    });
  }

  // Private helper methods

  private setFilterForQuery(
    queryBuilder: SelectQueryBuilder<RoomProductExtraOccupancyRate>,
    filter: RoomProductExtraOccupancyRateFilterDto
  ): void {
    // Filter by hotel ID
    if (filter.hotelId) {
      queryBuilder.andWhere('roomProductExtraOccupancyRate.hotelId = :hotelId', {
        hotelId: filter.hotelId
      });
    }

    // Filter by RFC ID list
    if (filter.roomProductIdList && filter.roomProductIdList.length > 0) {
      queryBuilder.andWhere('roomProductExtraOccupancyRate.roomProductId IN (:...roomProductIdList)', {
        roomProductIdList: filter.roomProductIdList
      });
    }

    // Filter by ID list
    if (filter.idList && filter.idList.length > 0) {
      queryBuilder.andWhere('roomProductExtraOccupancyRate.id IN (:...idList)', {
        idList: filter.idList
      });
    }

    // Add ordering
    queryBuilder.orderBy('roomProductExtraOccupancyRate.createdAt', 'DESC');
  }
}
