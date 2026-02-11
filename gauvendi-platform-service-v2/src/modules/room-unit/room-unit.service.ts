import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { BadRequestException } from '@src/core/exceptions';
import { getAllowedDateByDayOfWeek } from '@src/core/utils/datetime.util';
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  parseISO,
  startOfDay
} from 'date-fns';
import { chunk, groupBy } from 'lodash';
import { DATE_FORMAT, DATE_TIME_ISO8601 } from 'src/core/constants/date.constant';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomUnitRetailFeature } from 'src/core/entities/room-unit-retail-feature.entity';
import { RoomUnit } from 'src/core/entities/room-unit.entity';
import {
  ConnectorTypeEnum,
  HotelConfigurationTypeEnum,
  HotelRetailFeatureStatusEnum,
  ResponseStatusEnum,
  RoomProductType,
  RoomUnitAvailabilityStatus
} from 'src/core/enums/common';
import { Helper } from 'src/core/helper/utils';
import {
  DataSource,
  Equal,
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Raw,
  Repository
} from 'typeorm';
import { RoomUnitMaintenanceMappingDto, RoomUnitMappingDto } from '../pms/pms.dto';
import { PmsService } from '../pms/pms.service';
import { RoomProductAvailabilityService } from '../room-product-availability/room-product-availability.service';
import {
  BulkDeleteRoomUnitDto,
  BulkUpdateRoomUnitDto,
  CreateRoomUnitDto,
  DeleteMaintenancesDto,
  GetPmsRoomUnitsMaintenanceDto,
  GetRoomUnitAvailabilityDto,
  GetRoomUnitDto,
  IRoomUnitMaintenance as IMaintenanceRoomUnit,
  RefreshRoomStatus,
  RoomUnitMaintenanceDto,
  SetRoomFeaturesDto
} from './room-unit.dto';
import { RoomUnitUtil } from './room-unit.util';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { Maintenance } from '@src/core/entities/availability-entities/maintenance.entity';
import { v4 as uuidv4 } from 'uuid';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';

@Injectable()
export class RoomUnitService {
  logger = new Logger(RoomUnitService.name);
  constructor(
    @InjectRepository(RoomUnit, DbName.Postgres)
    private readonly roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(RoomUnitAvailability, DbName.Postgres)
    private readonly roomUnitAvailabilityRepository: Repository<RoomUnitAvailability>,

    @InjectRepository(RoomUnitRetailFeature, DbName.Postgres)
    private readonly roomUnitRetailFeatureRepository: Repository<RoomUnitRetailFeature>,

    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(HotelRetailFeature, DbName.Postgres)
    private readonly retailFeatureRepository: Repository<HotelRetailFeature>,

    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,

    @InjectRepository(Maintenance, DbName.Postgres)
    private readonly maintenanceRepository: Repository<Maintenance>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly pmsService: PmsService,
    private readonly roomProductAvailabilityService: RoomProductAvailabilityService,
    private readonly configService: ConfigService
  ) {}

  // onModuleInit() {
  //   this.pullMaintenancePms();
  // }

  async migrateFeatureString() {
    try {
      const hotelRetailFeatures = await this.retailFeatureRepository
        .createQueryBuilder('hrf')
        .select([
          'hrf.id',
          'hrf.hotelId',
          'hrf.code',
          'hrf.createdAt',
          'roomUnitRetailFeatures.quantity',
          'roomUnitRetailFeatures.roomUnitId',
          'roomUnitRetailFeatures.retailFeatureId'
        ])
        .leftJoinAndSelect('hrf.roomUnitRetailFeatures', 'roomUnitRetailFeatures')
        .where('hrf.status = :status', { status: HotelRetailFeatureStatusEnum.ACTIVE })
        .groupBy('hrf.hotelId')
        .addGroupBy('hrf.createdAt')
        .addGroupBy('hrf.code')
        .addGroupBy('hrf.id')
        .addGroupBy('roomUnitRetailFeatures.id')
        .addGroupBy('roomUnitRetailFeatures.quantity')
        .addGroupBy('roomUnitRetailFeatures.roomUnitId')
        .addGroupBy('roomUnitRetailFeatures.retailFeatureId')
        .orderBy('hrf.createdAt', 'ASC')
        .addOrderBy('hrf.code', 'ASC')
        .getMany();

      const roomUnits = await this.roomUnitRepository.find({
        select: {
          id: true,
          featureString: true,
          hotelId: true
        }
      });

      const roomProducts = await this.roomProductRepository.find({
        select: {
          id: true,
          featureString: true,
          hotelId: true
        }
      });

      // Create ordered list of hotel features for position mapping
      const orderedFeatures = hotelRetailFeatures.map((feature) => ({
        id: feature.id,
        code: feature.code,
        hotelId: feature.hotelId
      }));

      // Helper function to process entities with same logic
      const processEntity = (entity: { id: string; featureString: string; hotelId: string }) => {
        if (!entity.featureString) return null;

        // Parse old format: comma-separated quantities
        const quantities = entity.featureString.split(',').map((q) => parseInt(q.trim()) || 0);

        // Filter features for this hotel
        const hotelFeatures = orderedFeatures.filter((f) => f.hotelId === entity.hotelId);

        // Build new format: code;quantity pairs for non-zero quantities
        const newFeatureStringParts: string[] = [];

        for (let i = 0; i < Math.min(quantities.length, hotelFeatures.length); i++) {
          const quantity = quantities[i];
          if (quantity > 0) {
            const feature = hotelFeatures[i];
            newFeatureStringParts.push(`${feature.code};${quantity}`);
          }
        }

        const newFeatureString = newFeatureStringParts.join(',');
        return {
          id: entity.id,
          oldFeatureString: entity.featureString,
          newFeatureString
        };
      };

      // Prepare batch updates to avoid N+1 queries
      const roomUnitBatchUpdates = roomUnits
        .map(processEntity)
        .filter(
          (update): update is { id: string; oldFeatureString: string; newFeatureString: string } =>
            update !== null
        );
      const roomProductBatchUpdates = roomProducts
        .map(processEntity)
        .filter(
          (update): update is { id: string; oldFeatureString: string; newFeatureString: string } =>
            update !== null
        );

      // Helper function to process batch updates for a table
      const processBatchUpdates = async (
        updates: Array<{ id: string; oldFeatureString: string; newFeatureString: string }>,
        tableName: string,
        logPrefix: string
      ) => {
        if (updates.length === 0) return;

        const BATCH_SIZE = 500;
        const batches: Array<
          Array<{ id: string; oldFeatureString: string; newFeatureString: string }>
        > = [];

        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
          batches.push(updates.slice(i, i + BATCH_SIZE));
        }

        await this.roomUnitRepository.manager.transaction(async (transactionalEntityManager) => {
          for (const batch of batches) {
            const updateCases = batch
              .map(
                (update) =>
                  `WHEN '${update.id}' THEN '${update.newFeatureString.replace(/'/g, "''")}'`
              )
              .join(' ');

            const entityIds = batch.map((update) => `'${update.id}'`).join(',');

            await transactionalEntityManager
              .createQueryBuilder()
              .update(tableName)
              .set({
                featureString: () => `CASE id ${updateCases} END`
              })
              .where(`id IN (${entityIds})`)
              .execute();
          }
        });

        // Log migration results
        updates.forEach((update) => {
          this.logger.log(
            `Migrated ${logPrefix} ${update.id}: "${update.oldFeatureString}" -> "${update.newFeatureString}"`
          );
        });
      };

      // Process both room units and room products
      await processBatchUpdates(roomUnitBatchUpdates, 'room_unit', 'room unit');
      await processBatchUpdates(roomProductBatchUpdates, 'room_product', 'room product');

      const totalProcessed = roomUnits.length + roomProducts.length;
      const totalUpdated = roomUnitBatchUpdates.length + roomProductBatchUpdates.length;

      this.logger.log(
        `Migration completed: ${totalUpdated}/${totalProcessed} records updated (${roomUnitBatchUpdates.length} room units, ${roomProductBatchUpdates.length} room products)`
      );
      return {
        success: true,
        message: `Migration completed: ${totalUpdated}/${totalProcessed} records updated`,
        totalProcessed,
        totalUpdated,
        roomUnits: {
          total: roomUnits.length,
          updated: roomUnitBatchUpdates.length
        },
        roomProducts: {
          total: roomProducts.length,
          updated: roomProductBatchUpdates.length
        }
      };
    } catch (error) {
      this.logger.error('Error migrating feature string:', JSON.stringify(error));
      throw new BadRequestException(error.message);
    }
  }

  async getRoomUnits(query: GetRoomUnitDto) {
    const { hotelId } = query;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    const roomUnits = await this.roomUnitRepository.find({
      where: {
        hotelId,
        deletedAt: IsNull(),
        ...(query.ids && { id: In(query.ids) }),
        ...(query.mappingPmsCodes && { mappingPmsCode: In(query.mappingPmsCodes) })
      },
      select: {
        id: true,
        roomNumber: true,
        roomFloor: true,
        space: true,
        building: true,
        connectingRoomId: true,
        mappingPmsCode: true,
        roomUnitRetailFeatures: {
          retailFeatureId: true,
          quantity: true,
          retailFeature: {
            id: true,
            name: true,
            code: true,
            description: true,
            displaySequence: true,
            hotelRetailCategoryId: true,
            hotelRetailCategory: {
              name: true,
              code: true,
              displaySequence: true
            }
          }
        },
        roomProductAssignedUnits: {
          roomProductId: true,
          roomProduct: {
            name: true,
            code: true
          }
        }
      },
      order: {
        roomNumber: 'ASC'
      },
      relations: query.relations || []
    });

    return roomUnits;
  }

  async getRoomUnitsV2(query: GetRoomUnitDto) {
    const {
      hotelId,
      spaceTypeIds,
      relations,
      featureIds,
      space,
      building,
      floor,
      ids,
      mappingPmsCodes,
      roomProductId,
      hasCheckQuantity = false
    } = query;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    let roomUnits = await this.roomUnitRepository.find({
      where: {
        hotelId,
        deletedAt: IsNull(),
        ...(ids && { id: In(ids) }),
        ...(mappingPmsCodes && { mappingPmsCode: In(mappingPmsCodes) }),
        ...((featureIds?.length || spaceTypeIds?.length) && {
          roomUnitRetailFeatures: {
            retailFeatureId: In([...(featureIds || []), ...(spaceTypeIds || [])])
          }
        }),
        ...(space && { space: Equal(space) }),
        ...(building && { building: Like(building) }),
        ...(floor && { roomFloor: Like(floor) })
      },
      order: {
        roomNumber: 'ASC'
      }
    });

    roomUnits = await this.getAvailableRoomUnits(hotelId, roomUnits, roomProductId);

    // Early return if no relations needed or no room units found
    if (!relations || !relations.length || !roomUnits.length) {
      return roomUnits;
    }

    // Extract room unit IDs once to avoid multiple map operations
    const roomUnitIds = roomUnits.map((roomUnit) => roomUnit.id);

    const [hotelRetailFeatures, roomUnitRetailFeatures, roomProductAssignedUnits, roomProducts] =
      await Promise.all([
        this.retailFeatureRepository.find({
          where: { hotelId, status: HotelRetailFeatureStatusEnum.ACTIVE },
          relations: ['hotelRetailCategory'],
          select: [
            'id',
            'name',
            'code',
            'description',
            'displaySequence',
            'hotelRetailCategoryId',
            'hotelRetailCategory',
            'imageUrl'
          ]
        }),
        this.roomUnitRetailFeatureRepository.find({
          where: {
            roomUnitId: In(roomUnitIds)
          }
        }),
        this.roomProductAssignedUnitRepository.find({
          where: { roomUnitId: In(roomUnitIds) }
        }),
        this.roomProductRepository.find({
          where: { hotelId },
          select: ['id', 'name', 'code']
        })
      ]);

    // Create Maps for O(1) lookups instead of O(n) find operations
    const retailFeaturesMap = new Map(hotelRetailFeatures.map((feature) => [feature.id, feature]));
    const roomProductsMap = new Map(roomProducts.map((product) => [product.id, product]));

    // Group related data by roomUnitId for efficient access using reduce
    const roomUnitRetailFeaturesMap = roomUnitRetailFeatures.reduce((map, feature) => {
      const roomUnitId = feature.roomUnitId;
      if (!map.has(roomUnitId)) {
        map.set(roomUnitId, []);
      }
      map.get(roomUnitId)!.push(feature);
      return map;
    }, new Map<string | number, any[]>());

    const roomProductAssignedUnitsMap = roomProductAssignedUnits.reduce((map, assignedUnit) => {
      const roomUnitId = assignedUnit.roomUnitId;
      if (!map.has(roomUnitId)) {
        map.set(roomUnitId, []);
      }
      map.get(roomUnitId)!.push(assignedUnit);
      return map;
    }, new Map<string | number, any[]>());

    // Map room units with their relations
    return roomUnits.map((roomUnit) => {
      const unitRetailFeatures = roomUnitRetailFeaturesMap.get(roomUnit.id);
      const unitProductAssignments = roomProductAssignedUnitsMap.get(roomUnit.id);

      return {
        ...roomUnit,
        roomUnitRetailFeatures:
          unitRetailFeatures
            ?.map((roomUnitRetailFeature) => ({
              ...roomUnitRetailFeature,
              retailFeature: retailFeaturesMap.get(roomUnitRetailFeature.retailFeatureId)
            }))
            .filter((x) => (hasCheckQuantity ? !!x.quantity : true)) ?? [],
        roomProductAssignedUnits:
          unitProductAssignments?.map((roomProductAssignedUnit) => ({
            ...roomProductAssignedUnit,
            roomProduct: roomProductsMap.get(roomProductAssignedUnit.roomProductId)
          })) ?? []
      };
    });
  }

  private async getAvailableRoomUnits(
    hotelId: string,
    roomUnits: RoomUnit[],
    roomProductId?: string
  ) {
    if (!roomProductId) {
      return roomUnits;
    }
    const roomProduct = await this.roomProductRepository.findOne({
      where: {
        hotelId: hotelId,
        id: roomProductId
      }
    });
    if (roomProduct?.type !== RoomProductType.MRFC) {
      return roomUnits;
    }
    const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository.find({
      where: {
        roomProductId: Not(roomProductId),
        roomProduct: {
          hotelId: hotelId,
          type: RoomProductType.MRFC
        }
      },
      select: {
        roomUnitId: true
      }
    });
    const newRoomUnits = roomUnits.filter(
      (x) => !roomProductAssignedUnits?.some((y) => y.roomUnitId === x.id)
    );
    return newRoomUnits;
  }

  async createRoomUnit(body: CreateRoomUnitDto) {
    const { hotelId, roomNumber, roomFloor, space, building, connectingRoomId, retailFeatures } =
      body;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!roomNumber) {
      throw new BadRequestException('Room number is required');
    }

    // find duplicate room number
    const existingRoomUnit = await this.roomUnitRepository.findOne({
      where: { hotelId, roomNumber, deletedAt: IsNull() }
    });
    if (existingRoomUnit) {
      throw new BadRequestException('Room number already exists');
    }

    try {
      const roomUnit = this.roomUnitRepository.create({
        hotelId,
        roomNumber,
        roomFloor,
        space,
        building,
        connectingRoomId
      });

      await this.roomUnitRepository.save(roomUnit);

      if (retailFeatures && retailFeatures.length > 0) {
        const retailFeatureEntities: Partial<RoomUnitRetailFeature>[] = retailFeatures.map(
          (feature) => ({
            hotelId,
            roomUnitId: roomUnit.id,
            retailFeatureId: feature.retailFeatureId,
            quantity: feature.quantity || 1
          })
        );

        await this.roomUnitRetailFeatureRepository.save(retailFeatureEntities);
      }

      // generate room unit availability
      await this.generateRoomUnitAvailabilityWithOneRoomUnit(hotelId, roomUnit.id);

      return roomUnit;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async bulkUpdateRoomUnit(body: BulkUpdateRoomUnitDto) {
    const { hotelId, roomUnitIds } = body;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!roomUnitIds || roomUnitIds.length === 0) {
      throw new BadRequestException('Room unit IDs are required');
    }

    // Find existing room units
    const roomUnits = await this.roomUnitRepository.find({
      where: {
        hotelId,
        id: In(roomUnitIds),
        deletedAt: IsNull()
      }
    });

    if (roomUnits.length === 0) {
      throw new BadRequestException('No room units found');
    }

    const {
      roomFloor,
      space,
      retailFeatures,
      standardFeatureIds,
      keepOldRetailFeatures,
      roomNumber,
      building,
      connectingRoomId,
      pmsMappingCode
    } = body;

    try {
      // Update room unit basic properties
      const updatedRoomUnits = roomUnits.map((roomUnit) => {
        if (roomFloor !== undefined) {
          roomUnit.roomFloor = roomFloor;
        }
        if (space !== undefined) {
          roomUnit.space = space;
        }

        if (roomNumber !== undefined) {
          roomUnit.roomNumber = roomNumber;
        }

        if (building !== undefined) {
          roomUnit.building = building;
        }

        if (connectingRoomId !== undefined) {
          roomUnit.connectingRoomId = connectingRoomId;
        }

        roomUnit.mappingPmsCode = pmsMappingCode as any;

        return roomUnit;
      });

      // Save updated room units
      await this.roomUnitRepository.save(updatedRoomUnits);

      // Handle retail features if provided
      if (retailFeatures?.length) {
        if (keepOldRetailFeatures) {
          // Keep existing retail features, only add new ones (avoid duplicates)
          for (const roomUnitId of roomUnitIds) {
            const existingRetailFeatures = await this.roomUnitRetailFeatureRepository.find({
              where: {
                hotelId,
                roomUnitId,
                quantity: MoreThanOrEqual(1)
              },
              select: ['retailFeatureId']
            });

            const existingFeatureIds = existingRetailFeatures.map((f) => f.retailFeatureId);

            // Filter out features that already exist
            const newFeatures = retailFeatures.filter(
              (feature) => !existingFeatureIds.includes(feature.retailFeatureId)
            );

            if (newFeatures.length > 0) {
              const entities = newFeatures.map((feature) => ({
                hotelId,
                roomUnitId,
                retailFeatureId: feature.retailFeatureId,
                quantity: feature.quantity || 1
              }));

              await this.roomUnitRetailFeatureRepository.save(entities);
            }
          }
        } else {
          // Delete all existing retail features and add new ones
          await this.roomUnitRetailFeatureRepository.delete({
            hotelId,
            roomUnitId: In(roomUnitIds)
          });

          // Create new retail feature associations
          const retailFeatureEntities: Partial<RoomUnitRetailFeature>[] = [];

          for (const roomUnitId of roomUnitIds) {
            for (const retailFeature of retailFeatures) {
              retailFeatureEntities.push({
                hotelId,
                roomUnitId,
                retailFeatureId: retailFeature.retailFeatureId,
                quantity: retailFeature.quantity || 1 // Use provided quantity or default to 1
              });
            }
          }

          if (retailFeatureEntities.length > 0) {
            await this.roomUnitRetailFeatureRepository.save(retailFeatureEntities);
          }
        }

        // Re-generate feature string for room units using new V2 format
        const hotelRetailFeatures = await this.retailFeatureRepository.find({
          select: {
            id: true,
            code: true,
            roomUnitRetailFeatures: {
              quantity: true,
              roomUnitId: true,
              retailFeatureId: true
            },
            status: true
          },
          where: {
            hotelId,
            id: In(retailFeatures.map((feature) => feature.retailFeatureId))
          },
          order: {
            createdAt: 'ASC',
            code: 'ASC'
          },
          relations: {
            roomUnitRetailFeatures: true
          }
        });

        // Update status of retail features to active if not already active
        const updateRetailFeatures = hotelRetailFeatures.filter(
          (feature) => feature.status !== HotelRetailFeatureStatusEnum.ACTIVE
        );
        if (updateRetailFeatures.length) {
          await this.retailFeatureRepository.update(
            updateRetailFeatures.map((feature) => feature.id),
            {
              status: HotelRetailFeatureStatusEnum.ACTIVE
            }
          );
        }

        // Extract sorted hotel features for feature string generation
        const sortedHotelFeatures = hotelRetailFeatures.map((feature) => ({
          id: feature.id,
          code: feature.code
        }));

        const roomUnitRetailFeatures = hotelRetailFeatures
          .filter((feature) =>
            feature.roomUnitRetailFeatures.some((roomUnitRetailFeature) =>
              roomUnitIds.some((roomUnitId) => roomUnitId === roomUnitRetailFeature.roomUnitId)
            )
          )
          .flatMap((feature) => feature.roomUnitRetailFeatures);

        const roomUnitUpdates = new Map<string, string>();

        for (const roomUnitId of roomUnitIds) {
          const roomUnitRetailFeaturesByRoomUnit = roomUnitRetailFeatures.filter(
            (feature) => feature.roomUnitId === roomUnitId
          );
          const featureString = RoomUnitUtil.generateFeatureStringV2(
            roomUnitRetailFeaturesByRoomUnit,
            sortedHotelFeatures
          );
          roomUnitUpdates.set(roomUnitId, featureString);
        }

        // Batch update using QueryBuilder with CASE statement
        if (roomUnitUpdates.size > 0) {
          const roomUnitIds = Array.from(roomUnitUpdates.keys());

          let caseStatement = 'CASE id ';
          const parameters: any = {};

          roomUnitIds.forEach((roomUnitId, index) => {
            const paramKey = `roomUnitId_${index}`;
            const featureStringKey = `featureString_${index}`;
            caseStatement += `WHEN :${paramKey} THEN :${featureStringKey} `;
            parameters[paramKey] = roomUnitId;
            parameters[featureStringKey] = roomUnitUpdates.get(roomUnitId);
          });

          caseStatement += 'ELSE feature_string END';

          await this.roomUnitRepository
            .createQueryBuilder()
            .update()
            .set({
              featureString: () => caseStatement,
              isChanged: true
            })
            .where('id IN (:...roomUnitIds)', { roomUnitIds })
            .setParameters(parameters)
            .execute();

          this.logger.log(
            `Updated ${roomUnitUpdates.size} room units with feature strings in batch`
          );
        }
      } else {
        // delete all retail features for room units
        if (!keepOldRetailFeatures) {
          await this.roomUnitRetailFeatureRepository.delete({
            hotelId,
            roomUnitId: In(roomUnitIds)
          });
          const roomUnitUpdates: Partial<RoomUnit>[] = roomUnits.map((roomUnit) => ({
            id: roomUnit.id,
            featureString: null as any,
            isChanged: true
          }));
          if (roomUnitUpdates.length) {
            await this.roomUnitRepository.upsert(roomUnitUpdates, {
              conflictPaths: ['id'],
              skipUpdateIfNoValuesChanged: true
            });
          }
        }
      }

      // Handle standard features if provided
      // if (standardFeatureIds && standardFeatureIds.length > 0) {
      //   // Remove existing standard features for these room units
      //   await this.roomUnitStandardFeatureRepository.delete({
      //     hotelId,
      //     roomUnitId: In(roomUnitIds),
      //   });

      //   // Create new standard feature associations
      //   const standardFeatureEntities: Partial<RoomUnitStandardFeature>[] = [];

      //   for (const roomUnitId of roomUnitIds) {
      //     for (const standardFeatureId of standardFeatureIds) {
      //       standardFeatureEntities.push({
      //         hotelId,
      //         roomUnitId,
      //         standardFeatureId,
      //       });
      //     }
      //   }

      //   if (standardFeatureEntities.length > 0) {
      //     await this.roomUnitStandardFeatureRepository.save(standardFeatureEntities);
      //   }
      // }

      // Return updated room units with relations
      return body;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async bulkDeleteRoomUnit(body: BulkDeleteRoomUnitDto) {
    try {
      const { hotelId, idList } = body;
      if (!hotelId) {
        throw new BadRequestException('Hotel ID is required');
      }
      if (!idList || idList.length === 0) {
        throw new BadRequestException('ID list is required');
      }

      // Execute all operations in a transaction for atomicity
      await this.roomUnitRepository.manager.transaction(async (transactionalEntityManager) => {
        // soft delete room units
        await transactionalEntityManager.update(RoomUnit, idList, { deletedAt: new Date() });

        // delete mapping room units - room product
        await transactionalEntityManager.delete(RoomProductAssignedUnit, {
          roomUnitId: In(idList)
        });
      });

      return true;
    } catch (error) {
      this.logger.error('Error deleting room units:', JSON.stringify(error));
      if (!(error instanceof BadRequestException)) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Update retail features for a specific room unit
   */
  async updateRoomUnitRetailFeatures(
    hotelId: string,
    roomUnitId: string,
    retailFeatures: { retailFeatureId: string; quantity?: number }[],
    keepOldRetailFeatures: boolean = false
  ) {
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!roomUnitId) {
      throw new BadRequestException('Room unit ID is required');
    }

    if (!retailFeatures || retailFeatures.length === 0) {
      throw new BadRequestException('Retail features are required');
    }

    try {
      if (keepOldRetailFeatures) {
        // Keep existing retail features, only add new ones (avoid duplicates)
        const existingRetailFeatures = await this.roomUnitRetailFeatureRepository.find({
          where: { hotelId, roomUnitId },
          select: ['retailFeatureId']
        });

        const existingFeatureIds = existingRetailFeatures.map((f) => f.retailFeatureId);

        // Filter out features that already exist
        const newFeatures = retailFeatures.filter(
          (feature) => !existingFeatureIds.includes(feature.retailFeatureId)
        );

        if (newFeatures.length > 0) {
          const entities = newFeatures.map((feature) => ({
            hotelId,
            roomUnitId,
            retailFeatureId: feature.retailFeatureId,
            quantity: feature.quantity !== undefined ? feature.quantity : 1
          }));

          await this.roomUnitRetailFeatureRepository.save(entities);
        }
      } else {
        // Delete all existing retail features and add new ones
        await this.roomUnitRetailFeatureRepository.delete({
          hotelId,
          roomUnitId
        });

        // Add new retail features from body
        if (retailFeatures && retailFeatures.length > 0) {
          const entities = retailFeatures.map((feature) => ({
            hotelId,
            roomUnitId,
            retailFeatureId: feature.retailFeatureId,
            quantity: feature.quantity !== undefined ? feature.quantity : 1
          }));

          await this.roomUnitRetailFeatureRepository.save(entities);
        }
      }

      return retailFeatures;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // /**
  //  * Update standard features for a specific room unit
  //  */
  // async updateRoomUnitStandardFeatures(hotelId: string, roomUnitId: string, standardFeatureIds: string[]) {
  //   // Remove existing standard features
  //   await this.roomUnitStandardFeatureRepository.delete({
  //     hotelId,
  //     roomUnitId,
  //   });

  //   // Add new standard features
  //   if (standardFeatureIds && standardFeatureIds.length > 0) {
  //     const entities = standardFeatureIds.map((standardFeatureId) => ({
  //       hotelId,
  //       roomUnitId,
  //       standardFeatureId,
  //     }));

  //     await this.roomUnitStandardFeatureRepository.save(entities);
  //   }

  //   return this.getRoomUnitWithFeatures(roomUnitId);
  // }

  async regenerateFeatureString(input: {
    hotelId: string;
    isGenerateRoomUnit: boolean;
    isGenerateRoomProductRFC: boolean;
    isGenerateRoomProductMRFC: boolean;
  }) {
    try {
      const { hotelId, isGenerateRoomUnit, isGenerateRoomProductRFC, isGenerateRoomProductMRFC } =
        input;
      const hotelRetailFeatures = await this.retailFeatureRepository.find({
        select: {
          id: true,
          code: true,
          roomUnitRetailFeatures: {
            quantity: true,
            roomUnitId: true,
            retailFeatureId: true
          }
        },
        where: {
          hotelId
        },
        order: {
          createdAt: 'ASC',
          code: 'ASC'
        }
      });

      if (isGenerateRoomUnit) {
        const roomUnits = await this.roomUnitRepository.find({
          where: {
            hotelId: hotelId,
            deletedAt: IsNull()
          },
          relations: {
            roomUnitRetailFeatures: true
          }
        });

        for (const roomUnit of roomUnits) {
          const featureString = RoomUnitUtil.generateFeatureStringV2(
            roomUnit.roomUnitRetailFeatures,
            hotelRetailFeatures
          );
          await this.roomUnitRepository.update(roomUnit.id, { featureString });
        }
      }

      if (isGenerateRoomProductRFC) {
        const [roomProductRFCs, roomProductAssignedUnit, roomUnits] = await Promise.all([
          this.roomProductRepository.find({
            where: {
              hotelId,
              type: RoomProductType.RFC,
              deletedAt: IsNull()
            },
            relations: {
              roomProductRetailFeatures: true
            }
          }),
          this.roomProductAssignedUnitRepository.find({
            where: {
              roomProduct: {
                hotelId,
                type: RoomProductType.RFC,

                deletedAt: IsNull()
              }
            }
          }),
          this.roomUnitRepository.find({
            where: {
              hotelId: hotelId,
              deletedAt: IsNull(),
              featureString: Raw(
                (alias) => `
              ${alias} IS NOT NULL
              AND TRIM(${alias}) <> ''
            `
              ),
              roomUnitRetailFeatures: {
                quantity: MoreThan(0)
              }
            },
            relations: {
              roomUnitRetailFeatures: true
            }
          })
        ]);

        const roomProductAssignedUnitMap = new Map<string, RoomUnit>();
        for (const assignedUnit of roomProductAssignedUnit) {
          const roomUnit = roomUnits.find((roomUnit) => roomUnit.id === assignedUnit.roomUnitId);
          if (!roomUnit) {
            continue;
          }

          roomProductAssignedUnitMap.set(assignedUnit.roomProductId, roomUnit);
        }

        for (const roomProductRFC of roomProductRFCs) {
          const roomUnit = roomProductAssignedUnitMap.get(roomProductRFC.id);

          if (roomUnit) {
            const newRoomProductRetailFeatures: RoomProductRetailFeature[] = [];
            for (const roomProductRetailFeature of roomProductRFC.roomProductRetailFeatures) {
              const hotelRetailFeature = roomUnit.roomUnitRetailFeatures.find(
                (roomUnitRetailFeature) =>
                  roomUnitRetailFeature.retailFeatureId === roomProductRetailFeature.retailFeatureId
              );
              if (!hotelRetailFeature) {
                continue;
              }

              roomProductRetailFeature.quantity = hotelRetailFeature.quantity;
              newRoomProductRetailFeatures.push(roomProductRetailFeature);
            }

            await this.roomProductRetailFeatureRepository.save(newRoomProductRetailFeatures);

            const featureString = RoomUnitUtil.generateFeatureStringV2(
              newRoomProductRetailFeatures,
              hotelRetailFeatures
            );
            await this.roomProductRepository.update(roomProductRFC.id, { featureString });
          }
        }
      }

      if (isGenerateRoomProductMRFC) {
        const roomProductMRFCs = await this.roomProductRepository.find({
          where: {
            hotelId,
            type: In([RoomProductType.MRFC, RoomProductType.ERFC]),
            deletedAt: IsNull()
          },
          relations: {
            roomProductRetailFeatures: true
          }
        });

        for (const roomProductMRFC of roomProductMRFCs) {
          const featureString = RoomUnitUtil.generateFeatureStringV2(
            roomProductMRFC.roomProductRetailFeatures,
            hotelRetailFeatures
          );
          await this.roomProductRepository.update(roomProductMRFC.id, { featureString });
        }
      }

      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  /**
   * Set room features for multiple rooms
   * - If quantity is 0, remove the feature
   * - If quantity > 0, update or add the feature
   */
  async setRoomFeatures(body: SetRoomFeaturesDto) {
    const { hotelId, roomFeatureList } = body;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!roomFeatureList || roomFeatureList.length === 0) {
      throw new BadRequestException('Room feature list is required');
    }

    try {
      // Group features by roomId for efficient processing
      const featuresByRoom = new Map<string, typeof roomFeatureList>();

      for (const feature of roomFeatureList) {
        const roomId = feature.roomId;
        if (!featuresByRoom.has(roomId)) {
          featuresByRoom.set(roomId, []);
        }
        featuresByRoom.get(roomId)!.push(feature);
      }

      // Get all unique room IDs
      const roomIds = Array.from(featuresByRoom.keys());

      // Validate that all rooms exist and belong to the property
      const existingRooms = await this.roomUnitRepository.find({
        where: {
          id: In(roomIds),
          hotelId,
          deletedAt: IsNull()
        }
      });

      if (existingRooms.length !== roomIds.length) {
        const foundRoomIds = existingRooms.map((room) => room.id);
        const missingRoomIds = roomIds.filter((id) => !foundRoomIds.includes(id));
        throw new BadRequestException(`Room units not found: ${missingRoomIds.join(', ')}`);
      }

      const results: Array<{
        roomId: string;
        removed: number;
        updated: number;
      }> = [];

      // Collect all delete and save operations
      const allDeleteConditions: Map<
        string,
        {
          hotelId: string;
          roomUnitId: string;
          retailFeatureId: any;
        }
      > = new Map();
      const allFeatureEntities: Array<{
        hotelId: string;
        roomUnitId: string;
        retailFeatureId: string;
        quantity: number;
      }> = [];

      // Process each room's features (collect operations without executing them)
      for (const [roomId, features] of featuresByRoom) {
        const featuresToRemove = features.filter((f) => f.quantity === 0);
        const featuresToUpdate = features.filter((f) => f.quantity > 0);

        // Collect delete operations for features with quantity 0
        if (featuresToRemove.length > 0) {
          const featureIdsToRemove = featuresToRemove.map((f) => f.retailFeatureId);

          allDeleteConditions.set(`${hotelId}_${roomId}_${featureIdsToRemove}`, {
            hotelId,
            roomUnitId: roomId,
            retailFeatureId: In(featureIdsToRemove)
          });
        }

        // Collect delete operations for features that will be updated (remove existing)
        if (featuresToUpdate.length > 0) {
          const featureIdsToUpdate = featuresToUpdate.map((f) => f.retailFeatureId);
          allDeleteConditions.set(`${hotelId}_${roomId}_${featureIdsToUpdate}`, {
            hotelId,
            roomUnitId: roomId,
            retailFeatureId: In(featureIdsToUpdate)
          });

          // Collect save operations for updated features
          const featureEntities = featuresToUpdate.map((feature) => ({
            hotelId,
            roomUnitId: roomId,
            retailFeatureId: feature.retailFeatureId,
            quantity: feature.quantity
          }));

          allFeatureEntities.push(...featureEntities);
        }

        results.push({
          roomId,
          removed: featuresToRemove.length,
          updated: featuresToUpdate.length
        });
      }

      // Execute all operations in a transaction for atomicity and better performance
      await this.roomUnitRetailFeatureRepository.manager.transaction(
        async (transactionalEntityManager) => {
          // Execute batch delete operation using query builder for optimal performance
          if (allDeleteConditions.size > 0) {
            const queryBuilder = transactionalEntityManager
              .createQueryBuilder()
              .delete()
              .from(RoomUnitRetailFeature);

            let whereCondition = '';
            const parameters: any = {};
            let conditionIndex = 0;

            // Build OR conditions for each delete criteria
            for (const deleteCondition of allDeleteConditions.values()) {
              if (conditionIndex > 0) {
                whereCondition += ' OR ';
              }

              const featureIds = deleteCondition.retailFeatureId.value;
              const hotelParam = `hotelId${conditionIndex}`;
              const roomParam = `roomUnitId${conditionIndex}`;
              const featureParam = `featureIds${conditionIndex}`;

              whereCondition += `(hotel_id = :${hotelParam} AND room_unit_id = :${roomParam} AND retail_feature_id IN (:...${featureParam}))`;

              parameters[hotelParam] = deleteCondition.hotelId;
              parameters[roomParam] = deleteCondition.roomUnitId;
              parameters[featureParam] = featureIds;

              conditionIndex++;
            }

            await queryBuilder.where(whereCondition, parameters).execute();
            this.logger.log(
              `Executed single batch delete operation for ${allDeleteConditions.size} conditions`
            );
          }

          // Execute all save operations
          if (allFeatureEntities.length > 0) {
            await transactionalEntityManager.save(RoomUnitRetailFeature, allFeatureEntities);
            this.logger.log(`Saved ${allFeatureEntities.length} feature entities in batch`);

            // Re-assign feature string for room unit using new V2 format
            const hotelRetailFeatures = await transactionalEntityManager.find(HotelRetailFeature, {
              select: {
                id: true,
                code: true,
                roomUnitRetailFeatures: {
                  quantity: true,
                  roomUnitId: true,
                  retailFeatureId: true
                }
              },
              where: {
                hotelId,
                roomUnitRetailFeatures: {
                  roomUnitId: In(allFeatureEntities.map((feature) => feature.roomUnitId))
                }
              },
              order: {
                createdAt: 'ASC',
                code: 'ASC'
              },
              relations: {
                roomUnitRetailFeatures: true
              }
            });

            // Extract sorted hotel features for feature string generation
            const sortedHotelFeatures = hotelRetailFeatures.map((feature) => ({
              id: feature.id,
              code: feature.code
            }));

            // Group by roomUnitId to avoid duplicate updates and prepare batch update
            const roomUnitUpdates = new Map<string, string>();
            const allFeatureByRoomUnitId = groupBy(allFeatureEntities, 'roomUnitId');

            for (const roomUnitId in allFeatureByRoomUnitId) {
              const roomUnitRetailFeatures = hotelRetailFeatures
                .filter((feature) =>
                  feature.roomUnitRetailFeatures.some(
                    (roomUnitRetailFeature) => roomUnitRetailFeature.roomUnitId === roomUnitId
                  )
                )
                .flatMap((feature) => feature.roomUnitRetailFeatures)
                .filter((feature) => feature.roomUnitId === roomUnitId);

              const featureString = RoomUnitUtil.generateFeatureStringV2(
                roomUnitRetailFeatures,
                sortedHotelFeatures
              );
              roomUnitUpdates.set(roomUnitId, featureString);
            }

            // Batch update using QueryBuilder with CASE statement
            if (roomUnitUpdates.size > 0) {
              const roomUnitIds = Array.from(roomUnitUpdates.keys());

              let caseStatement = 'CASE id ';
              const parameters: any = {};

              roomUnitIds.forEach((roomUnitId, index) => {
                const paramKey = `roomUnitId_${index}`;
                const featureStringKey = `featureString_${index}`;
                caseStatement += `WHEN :${paramKey} THEN :${featureStringKey} `;
                parameters[paramKey] = roomUnitId;
                parameters[featureStringKey] = roomUnitUpdates.get(roomUnitId);
              });

              console.log(`parameters`, JSON.stringify(parameters));
              caseStatement += 'ELSE feature_string END';

              await transactionalEntityManager
                .createQueryBuilder()
                .update(RoomUnit)
                .set({
                  featureString: () => caseStatement,
                  isChanged: true
                })
                .where('id IN (:...roomUnitIds)', { roomUnitIds })
                .setParameters(parameters)
                .execute();

              this.logger.log(
                `Updated ${roomUnitUpdates.size} room units with feature strings in batch`
              );
            }
          }
        }
      );

      return {
        hotelId,
        processedRooms: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error setting room features for hotel ${hotelId}:`, error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get room unit with all features
   */
  async getRoomUnitWithFeatures(roomUnitId: string) {
    return await this.roomUnitRepository.findOne({
      where: { id: roomUnitId, deletedAt: IsNull() },
      relations: [
        'roomUnitRetailFeatures',
        'roomUnitRetailFeatures.retailFeature',
        'roomUnitStandardFeatures',
        'roomUnitStandardFeatures.standardFeature'
      ]
    });
  }

  async getRoomUnit(id: string) {
    if (!id) {
      throw new BadRequestException('Room unit ID is required');
    }

    try {
      const roomUnit = await this.roomUnitRepository.findOne({
        where: { id, deletedAt: IsNull() },
        relations: [
          'roomUnitRetailFeatures',
          'roomUnitRetailFeatures.retailFeature',
          'roomUnitRetailFeatures.retailFeature.hotelRetailCategory',
          'roomProductAssignedUnits.roomProduct',
          'roomProductAssignedUnits'
        ]
      });
      return roomUnit;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getRoomUnitAvailability(query: GetRoomUnitAvailabilityDto) {
    const { hotelId, roomProductIds, startDate, endDate, searchTerm, hotelRetailFeatureIds } =
      query;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    try {
      // Generate standardized date range
      const dates = Helper.generateDateRange(startDate, endDate);

      const whereBuilder: FindOptionsWhere<RoomUnit> = {
        hotelId,
        deletedAt: IsNull()
      };

      if (searchTerm && searchTerm?.trim()) {
        whereBuilder.roomNumber = ILike(`%${searchTerm?.trim()?.toLowerCase()}%`);
      }

      if (hotelRetailFeatureIds && hotelRetailFeatureIds?.length > 0) {
        whereBuilder.roomUnitRetailFeatures = {
          retailFeatureId: In(hotelRetailFeatureIds)
        };
      }

      // get first room units
      const roomUnits = await this.roomUnitRepository.find({
        where: whereBuilder,
        order: {
          roomNumber: 'ASC'
        },
        select: {
          id: true,
          roomNumber: true,
          roomFloor: true,
          featureString: true,
          status: true,
          mappingPmsCode: true,
          capacityDefault: true,
          maximumAdult: true,
          maximumKid: true,
          capacityExtra: true,
          extraBedAdult: true,
          extraBedKid: true,
          space: true,
          numberOfBedRooms: true,
          building: true,
          hotelId: true
        }
      });

      if (roomUnits.length === 0) {
        this.logger.warn(`No room units found for hotel ${hotelId}`);
        return [];
      }

      const roomUnitIds = roomUnits.map((unit) => unit.id);

      // Prepare concurrent operations for all related data
      const concurrentOperations: Array<{
        type: string;
        promise: Promise<any>;
      }> = [
        // Room Unit Availabilities
        {
          type: 'roomUnitAvailabilities',
          promise: this.roomUnitAvailabilityRepository
            .createQueryBuilder('rua')
            .andWhere('rua.date >= :startDate', { startDate })
            .andWhere('rua.date <= :endDate', { endDate })
            .andWhere('rua.roomUnitId IN (:...roomUnitIds)', { roomUnitIds })
            .orderBy('rua.date', 'ASC')
            .select([
              'rua.roomUnitId',
              'rua.date',
              'rua.status',
              'rua.createdAt',
              'rua.updatedAt',
              'rua.maintenanceId'
            ])
            .getMany()
        },
        // Room Product Assigned Units
        {
          type: 'roomProductAssignedUnits',
          promise:
            roomProductIds && roomProductIds.length > 0
              ? this.roomProductAssignedUnitRepository
                  .createQueryBuilder('rpau')
                  .where('rpau.roomProductId IN (:...roomProductIds)', { roomProductIds })
                  .andWhere('rpau.roomUnitId IN (:...roomUnitIds)', { roomUnitIds })
                  .select(['rpau.id', 'rpau.roomProductId', 'rpau.roomUnitId'])
                  .getMany()
              : this.roomProductAssignedUnitRepository
                  .createQueryBuilder('rpau')
                  .andWhere('rpau.roomUnitId IN (:...roomUnitIds)', { roomUnitIds })
                  .select(['rpau.id', 'rpau.roomProductId', 'rpau.roomUnitId'])
                  .getMany()
        },
        // Room Unit Retail Features
        {
          type: 'roomUnitRetailFeatures',
          promise: this.roomUnitRetailFeatureRepository
            .createQueryBuilder('rurf')
            .leftJoin('rurf.retailFeature', 'retailFeature')
            .andWhere('rurf.roomUnitId IN (:...roomUnitIds)', { roomUnitIds })
            .andWhere('rurf.quantity >= 1')
            .andWhere('rurf.quantity IS NOT NULL')
            .select([
              'rurf.id',
              'rurf.roomUnitId',
              'rurf.retailFeatureId',
              'retailFeature.id',
              'retailFeature.name',
              'retailFeature.description',
              'retailFeature.status'
            ])
            .getMany()
        },
        // Room Products (for assigned units)
        {
          type: 'roomProducts',
          promise:
            roomProductIds && roomProductIds.length > 0
              ? this.roomProductRepository
                  .createQueryBuilder('rp')
                  .where('rp.id IN (:...roomProductIds)', { roomProductIds })
                  .select([
                    'rp.id',
                    'rp.name',
                    'rp.code',
                    'rp.status',
                    'rp.space',
                    'rp.numberOfBedrooms',
                    'rp.capacityExtra',
                    'rp.capacityDefault',
                    'rp.type',
                    'rp.rfcAllocationSetting',
                    'rp.distributionChannel',
                    'rp.hotelId'
                  ])
                  .getMany()
              : this.roomProductRepository
                  .createQueryBuilder('rp')
                  .andWhere('rp.hotelId = :hotelId', { hotelId })
                  .select([
                    'rp.id',
                    'rp.name',
                    'rp.code',
                    'rp.status',
                    'rp.space',
                    'rp.numberOfBedrooms',
                    'rp.capacityExtra',
                    'rp.capacityDefault',
                    'rp.type',
                    'rp.rfcAllocationSetting',
                    'rp.distributionChannel',
                    'rp.hotelId'
                  ])
                  .getMany()
        }
      ];

      // Execute all operations concurrently
      const results = await Promise.all(concurrentOperations.map((op) => op.promise));

      // Extract results by type
      const roomUnitAvailabilities = results[0];
      const roomProductAssignedUnits = results[1];
      const roomUnitRetailFeatures = results[2];
      const roomProducts = results[3];

      if (roomUnits.length === 0) {
        this.logger.warn(`No room units found for hotel ${hotelId} with given criteria`);
        return [];
      }

      // Create lookup maps for efficient data association
      const availabilityMap = new Map();
      roomUnitAvailabilities.forEach((availability: RoomUnitAvailability) => {
        if (!availabilityMap.has(availability.roomUnitId)) {
          availabilityMap.set(availability.roomUnitId, []);
        }
        availabilityMap.get(availability.roomUnitId).push(availability);
      });

      const roomProductsMap = new Map();
      roomProducts.forEach((product: RoomProduct) => {
        roomProductsMap.set(product.id, product);
      });

      const assignedUnitsMap = new Map();
      roomProductAssignedUnits.forEach((unit: RoomProductAssignedUnit) => {
        if (!assignedUnitsMap.has(unit.roomUnitId)) {
          assignedUnitsMap.set(unit.roomUnitId, []);
        }
        assignedUnitsMap.get(unit.roomUnitId).push({
          ...unit,
          roomProduct: roomProductsMap.get(unit.roomProductId) || null
        });
      });

      const retailFeaturesMap = new Map();
      roomUnitRetailFeatures.forEach((feature: RoomUnitRetailFeature) => {
        if (!retailFeaturesMap.has(feature.roomUnitId)) {
          retailFeaturesMap.set(feature.roomUnitId, []);
        }
        retailFeaturesMap.get(feature.roomUnitId).push({
          retailFeatureId: feature.retailFeatureId,
          retailFeature: {
            id: feature.retailFeature?.id,
            name: feature.retailFeature?.name,
            description: feature.retailFeature?.description,
            status: feature.retailFeature?.status
          }
        });
      });

      // Assign related data to room units
      roomUnits.forEach((roomUnit: RoomUnit) => {
        // Assign availabilities for each date in range
        roomUnit.roomUnitAvailabilities = dates.map(
          (date) =>
            availabilityMap
              .get(roomUnit.id)
              ?.find((availability: RoomUnitAvailability) => availability.date === date) || null
        );

        // Assign room product assignments
        roomUnit.roomProductAssignedUnits = assignedUnitsMap.get(roomUnit.id) || [];

        // Assign retail features
        roomUnit.roomUnitRetailFeatures = retailFeaturesMap.get(roomUnit.id) || [];
      });

      return roomUnits;
    } catch (error) {
      this.logger.error(`Error fetching room unit availability: ${error.message}`, {
        hotelId,
        roomProductIds,
        startDate,
        endDate,
        stack: error.stack
      });
      throw new BadRequestException(`Failed to fetch room unit availability: ${error.message}`);
    }
  }

  async getPmsRoomUnits(hotelId: string) {
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    try {
      const pmsRoomUnits: RoomUnitMappingDto[] = await this.pmsService.getPmsRoomUnits(hotelId);
      if (pmsRoomUnits.length === 0) {
        this.logger.warn(`No room units found for hotel ${hotelId}`);
        return [];
      }
      return pmsRoomUnits;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async syncPmsRoomUnitsMaintenance(body: GetPmsRoomUnitsMaintenanceDto) {
    const { hotelId, startDate, endDate } = body;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    try {
      const pmsRoomUnitMaintenance: RoomUnitMaintenanceMappingDto[] =
        await this.pmsService.getPmsRoomUnitsMaintenance(hotelId, startDate, endDate);
      if (pmsRoomUnitMaintenance.length === 0) {
        this.logger.warn(`No room units maintenance found for hotel ${hotelId}`);
        return [];
      }

      const normalizedPmsRoomUnitMaintenance =
        this.normalizeRoomUnitMaintenance(pmsRoomUnitMaintenance);

      await this.processUpdateRoomUnitAvailability(hotelId, normalizedPmsRoomUnitMaintenance);

      // Collect only the actual dates that were updated, not the entire range
      // This prevents processing 365 days when only specific dates were updated
      const actualUpdatedDates = [...new Set(pmsRoomUnitMaintenance.flatMap((item) => item.dates))];
      if (actualUpdatedDates.length > 0) {
        await this.processUpdateRoomProductAvailability(hotelId, actualUpdatedDates, []);
      }

      return pmsRoomUnitMaintenance;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteRoomUnitsMaintenance(hotelId: string, maintenancePmsCodes: string[]) {
    const roomUnitAvailabilities = await this.roomUnitAvailabilityRepository.find({
      where: {
        hotelId,
        maintenance: {
          mappingPmsCode: In(maintenancePmsCodes)
        }
      },
      relations: ['roomUnit', 'maintenance'],
      select: {
        id: true,
        roomUnitId: true,
        date: true,
        status: true,
        maintenanceId: true,
        maintenance: {
          id: true,
          mappingPmsCode: true
        },
        roomUnit: {
          mappingPmsCode: true
        }
      }
    });
    if (!roomUnitAvailabilities?.length) {
      this.logger.warn(`No room unit availabilities found for hotel ${hotelId}`);
      return {
        status: ResponseStatusEnum.SUCCESS,
        message: 'No room unit availabilities found for hotel',
        data: true
      };
    }

    const roomUnitAvailabilitiesMap = new Map<string, RoomUnitAvailability[]>();
    for (const availability of roomUnitAvailabilities) {
      const existingAvailability =
        roomUnitAvailabilitiesMap.get(availability.maintenance?.mappingPmsCode || '') || [];
      existingAvailability.push(availability);
      roomUnitAvailabilitiesMap.set(
        availability.maintenance?.mappingPmsCode || '',
        existingAvailability
      );
    }

    const releaseRoomUnits: RoomUnitMaintenanceMappingDto[] = [];
    for (const availabilities of roomUnitAvailabilitiesMap.values()) {
      const newItem: any = {
        roomUnitMappingPmsCode: availabilities[0].roomUnit.mappingPmsCode,
        dates: availabilities.map((item) => item.date),
        type: RoomUnitAvailabilityStatus.AVAILABLE,
        maintenanceId: null,
        roomUnitId: availabilities[0].roomUnitId
      };
      releaseRoomUnits.push(newItem);
    }
    if (releaseRoomUnits.length) {
      await this.processUpdateRoomUnitAvailability(hotelId, releaseRoomUnits);
    }

    // delete maintenances
    let maintenanceIds = roomUnitAvailabilities.map((u) => u.maintenanceId).filter((id) => !!id);
    maintenanceIds = [...new Set(maintenanceIds)];
    if (maintenanceIds.length) {
      await this.maintenanceRepository.delete({
        hotelId,
        id: In(maintenanceIds)
      });
    }

    // Reduced chunk size from 50 to 10 to prevent deadlocks and reduce memory pressure
    const chunkedRoomUnits = chunk(releaseRoomUnits, 10);
    for (const chunk of chunkedRoomUnits) {
      await Promise.all(
        chunk.map(async (item) => {
          await this.processUpdateRoomProductAvailability(
            hotelId,
            item.dates,
            item['roomUnitId'] ? [item['roomUnitId']] : []
          );
        })
      );
    }
    return {
      status: ResponseStatusEnum.SUCCESS,
      message: 'Room units maintenance deleted successfully',
      data: true
    };
  }

  async updateRoomUnitsMaintenance(input: {
    hotelId: string;
    maintenanceRoomUnits: IMaintenanceRoomUnit[];
  }) {
    const { hotelId, maintenanceRoomUnits } = input;
    // get hotel configuration time slice configuration
    const [hotelConfiguration, roomUnits, roomUnitAvailabilities, maintenances] = await Promise.all(
      [
        this.hotelConfigurationRepository.findOne({
          where: { hotelId, configType: HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION },
          select: ['configValue']
        }),
        this.roomUnitRepository.find({
          where: {
            hotelId,
            mappingPmsCode: In(maintenanceRoomUnits.map((u) => u.roomUnitMappingPmsCode))
          },
          select: ['id', 'mappingPmsCode']
        }),
        this.roomUnitAvailabilityRepository.find({
          where: {
            hotelId,
            maintenance: {
              mappingPmsCode: In(maintenanceRoomUnits.map((u) => u.maintenancePmsCode))
            }
          },
          relations: ['roomUnit', 'maintenance'],
          select: {
            id: true,
            roomUnitId: true,
            date: true,
            status: true,
            maintenanceId: true,
            roomUnit: {
              mappingPmsCode: true
            },
            maintenance: {
              mappingPmsCode: true
            }
          }
        }),
        this.maintenanceRepository.find({
          where: {
            hotelId,
            mappingPmsCode: In(maintenanceRoomUnits.map((u) => u.maintenancePmsCode))
          },
          select: ['id', 'mappingPmsCode']
        })
      ]
    );

    // map maintenance pms code to maintenance id
    const maintenancesMap = new Map<string, string>(
      maintenances.map((m) => [m.mappingPmsCode || '', m.id])
    );
    const roomUnitMap = new Map(roomUnits.map((u) => [u.mappingPmsCode, u.id]));
    const roomUnitAvailabilityMap = new Map<string, RoomUnitAvailability[]>();
    roomUnitAvailabilities.forEach((availability: RoomUnitAvailability) => {
      const existingAvailability =
        roomUnitAvailabilityMap.get(availability.maintenance?.mappingPmsCode || '') || [];
      existingAvailability.push(availability);
      roomUnitAvailabilityMap.set(
        availability.maintenance?.mappingPmsCode || '',
        existingAvailability
      );
    });

    // create new maintenances if not found
    const newMaintenances: Partial<Maintenance>[] = [];
    for (const maintenanceRoomUnit of maintenanceRoomUnits) {
      const maintenanceId =
        maintenancesMap.get(maintenanceRoomUnit.maintenancePmsCode || '') || null;
      const roomUnitId = roomUnitMap.get(maintenanceRoomUnit.roomUnitMappingPmsCode || '') || null;
      if (!roomUnitId || maintenanceId) {
        this.logger.warn(
          `Room unit ${maintenanceRoomUnit.roomUnitMappingPmsCode} not found for hotel ${hotelId}`
        );
        continue;
      }
      newMaintenances.push({
        id: uuidv4(),
        hotelId,
        mappingPmsCode: maintenanceRoomUnit.maintenancePmsCode,
        roomUnitId: roomUnitId
      });
    }
    if (newMaintenances.length) {
      await this.maintenanceRepository.save(newMaintenances);
      for (const maintenance of newMaintenances) {
        maintenancesMap.set(maintenance.mappingPmsCode!, maintenance.id!);
      }
    }

    const timeSliceConfiguration = hotelConfiguration?.configValue?.metadata as {
      CI: string;
      CO: string;
    };
    const checkInTime = timeSliceConfiguration?.CI;
    const checkOutTime = timeSliceConfiguration?.CO;
    if (!checkInTime || !checkOutTime) {
      this.logger.warn(`Time slice configuration not found for hotel ${hotelId}`);
      return {
        status: ResponseStatusEnum.ERROR,
        message: 'Time slice configuration not found',
        data: null
      };
    }
    // release room unit availability
    let releaseRoomUnits: RoomUnitMaintenanceMappingDto[] = [];
    let newRoomUnits: RoomUnitMaintenanceMappingDto[] = [];
    for (const unit of maintenanceRoomUnits) {
      const maintenanceId = maintenancesMap.get(unit.maintenancePmsCode || '') || null;
      const newItem = this.generateMaintenanceRoomUnit(
        unit,
        checkOutTime,
        checkInTime,
        maintenanceId
      );
      newRoomUnits.push(newItem);

      // for release room unit, check if the room unit availability is in the roomUnitAvailabilityMap
      const existingAvailability = roomUnitAvailabilityMap.get(unit.maintenancePmsCode) || [];
      if (!existingAvailability.length) {
        continue;
      }
      releaseRoomUnits.push({
        roomUnitMappingPmsCode: existingAvailability[0].roomUnit.mappingPmsCode,
        dates: existingAvailability.map((item) => item.date),
        type: RoomUnitAvailabilityStatus.AVAILABLE,
        maintenanceId: null
      });
    }
    if (releaseRoomUnits.length) {
      // update room unit availability to available
      await this.processUpdateRoomUnitAvailability(hotelId, releaseRoomUnits);
    }

    // update room unit availability to maintenance
    const normalizedNewRoomUnits = this.normalizeRoomUnitMaintenance(newRoomUnits);
    await this.processUpdateRoomUnitAvailability(hotelId, normalizedNewRoomUnits);

    const roomUnitsMap = new Map<string, string[]>();

    for (const item of releaseRoomUnits) {
      const existingDates = roomUnitsMap.get(item.roomUnitMappingPmsCode) || [];
      existingDates.push(...item.dates);
      roomUnitsMap.set(item.roomUnitMappingPmsCode, existingDates);
    }
    for (const item of newRoomUnits) {
      const existingDates = roomUnitsMap.get(item.roomUnitMappingPmsCode) || [];
      if (!existingDates?.length) {
        existingDates.push(...item.dates);
        roomUnitsMap.set(item.roomUnitMappingPmsCode, existingDates);
        continue;
      }
      for (const date of item.dates) {
        if (existingDates.includes(date)) {
          continue;
        }
        existingDates.push(date);
      }
      roomUnitsMap.set(item.roomUnitMappingPmsCode, existingDates);
    }

    // update room product availability
    // Reduced chunk size from 50 to 10 to prevent deadlocks and reduce memory pressure
    const chunkedRoomUnits = chunk(Array.from(roomUnitsMap.entries()), 10);
    for (const chunk of chunkedRoomUnits) {
      await Promise.all(
        chunk.map(async ([roomUnitMappingPmsCode, dates]) => {
          const roomUnitId = roomUnitMap.get(roomUnitMappingPmsCode) || '';
          await this.processUpdateRoomProductAvailability(
            hotelId,
            dates,
            roomUnitId ? [roomUnitId] : []
          );
        })
      );
    }
    return {
      status: ResponseStatusEnum.SUCCESS,
      message: 'Room units maintenance updated successfully',
      data: true
    };
  }

  private generateMaintenanceRoomUnit(
    unit: IMaintenanceRoomUnit,
    checkOutTime: string,
    checkInTime: string,
    maintenanceId: string | null
  ): RoomUnitMaintenanceMappingDto {
    const { from, to } = unit;
    // Extract time (HH:mm) from ISO datetime string
    const extractTime = (isoString: string): string => {
      const match = isoString.match(/T(\d{2}:\d{2})/);
      return match ? match[1] : '00:00';
    };

    // Extract date (yyyy-MM-dd) from ISO datetime string
    const extractDate = (isoString: string): string => {
      return isoString.split('T')[0];
    };

    const timeOfFrom = extractTime(from);
    const timeOfTo = extractTime(to);
    const dateOfFrom = extractDate(from);
    const dateOfTo = extractDate(to);

    // Determine the actual "night date" for from:
    // If time < checkOutTime, it belongs to the previous night
    const startDate =
      timeOfFrom < checkOutTime
        ? format(addDays(parseISO(dateOfFrom), -1), 'yyyy-MM-dd')
        : dateOfFrom;

    // Determine the actual "night date" for to:
    // If time <= checkInTime, it belongs to the previous night
    const endDate =
      timeOfTo <= checkInTime ? format(addDays(parseISO(dateOfTo), -1), 'yyyy-MM-dd') : dateOfTo;

    let dates: string[] = [];
    let status = unit.type;
    // check if start date is after end date, return dates = [startDate, startDate+1day]
    if (parseISO(startDate) > parseISO(endDate)) {
      dates = [startDate, format(addDays(parseISO(startDate), 1), 'yyyy-MM-dd')];
      status = RoomUnitAvailabilityStatus.AVAILABLE;
    } else {
      dates = Helper.generateDateRange(startDate, endDate);
    }
    return {
      roomUnitMappingPmsCode: unit.roomUnitMappingPmsCode,
      dates,
      type: status,
      maintenanceId
    };
  }

  async bulkUpdateRoomUnitMaintenance(body: RoomUnitMaintenanceDto) {
    const { hotelId, roomUnitIds, startDate, endDate, status, daysOfWeek } = body;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    const dates = getAllowedDateByDayOfWeek(startDate, endDate, daysOfWeek);
    if (dates.length === 0) {
      this.logger.warn(`No dates found to update room unit maintenance for hotel ${hotelId}`);
      return true;
    }

    try {
      // verify if the room unit availability is already in the database
      const existingRoomUnitAvailabilities = await this.roomUnitAvailabilityRepository.find({
        where: {
          hotelId,
          roomUnitId: In(roomUnitIds),
          date: In(dates),
          status: In([RoomUnitAvailabilityStatus.ASSIGNED, status])
        }
      });
      if (existingRoomUnitAvailabilities.length) {
        throw new BadRequestException(
          'There are already reservations or maintenances for the specified unit in the specified range.'
        );
      }

      // step 1: update room unit availability
      await this.updateRoomUnitMaintenance(body, true);

      // step 2: update room product availability
      await this.updateRoomProductMaintenance(body);

      return body;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteMaintenances(body: DeleteMaintenancesDto) {
    const { hotelId, maintenanceIds } = body;
    try {
      // get dates from maintenance ids
      const roomUnitAvailabilities = await this.roomUnitAvailabilityRepository.find({
        where: {
          hotelId,
          maintenanceId: In(maintenanceIds)
        },
        relations: ['maintenance']
      });

      // update room unit availability to available
      await this.roomUnitAvailabilityRepository.update(
        {
          hotelId,
          maintenanceId: In(maintenanceIds)
        },
        {
          status: RoomUnitAvailabilityStatus.AVAILABLE,
          maintenanceId: null
        }
      );

      // delete maintenances
      await this.maintenanceRepository.delete({
        hotelId,
        id: In(maintenanceIds)
      });

      // process update room product availability
      const dates: string[] = [];
      const roomUnitIds: string[] = [];
      const maintenanceMappingCodes: string[] = [];

      for (const roomUnitAvailability of roomUnitAvailabilities) {
        if (!dates.includes(roomUnitAvailability.date)) {
          dates.push(roomUnitAvailability.date);
        }
        if (!roomUnitIds.includes(roomUnitAvailability.roomUnitId)) {
          roomUnitIds.push(roomUnitAvailability.roomUnitId);
        }

        const maintenanceMappingCode = roomUnitAvailability.maintenance?.mappingPmsCode;
        if (maintenanceMappingCode && !maintenanceMappingCodes.includes(maintenanceMappingCode)) {
          maintenanceMappingCodes.push(maintenanceMappingCode);
        }
      }
      if (dates.length) {
        await this.processUpdateRoomProductAvailability(hotelId, dates, roomUnitIds);
      }
      // delete maintenance room unit for pms
      if (maintenanceMappingCodes.length) {
        this.pmsService.deleteMaintenanceRoomUnitForPms(hotelId, maintenanceMappingCodes);
      }

      return {
        status: ResponseStatusEnum.SUCCESS,
        message: 'Maintenances deleted successfully',
        data: true
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateRoomUnitMaintenance(body: RoomUnitMaintenanceDto, isCreateMaintenance = false) {
    const { hotelId, roomUnitIds, startDate, endDate, status, daysOfWeek } = body;

    if (!hotelId) {
      this.logger.warn('Hotel ID is required');
      return;
    }

    // step 1: get room units by id
    const existingUnits = await this.roomUnitRepository.find({
      where: {
        hotelId,
        id: In(roomUnitIds),
        deletedAt: IsNull()
      },
      select: ['id', 'mappingPmsCode']
    });

    if (!existingUnits || existingUnits.length === 0) {
      this.logger.warn(`No room units found for hotel ${hotelId}`);
      return;
    }
    // step 2: generate pms room unit maintenance
    let pmsRoomUnitMaintenance: RoomUnitMaintenanceMappingDto[] = existingUnits
      .map((item) => ({
        roomUnitMappingPmsCode: item.mappingPmsCode,
        dates: getAllowedDateByDayOfWeek(startDate, endDate, daysOfWeek),
        type: status
      }))
      .filter((item) => item.roomUnitMappingPmsCode !== '');

    if (pmsRoomUnitMaintenance.length === 0) {
      this.logger.warn(`No room units maintenance found for hotel ${hotelId}`);
      return;
    }

    // step 4: update maintenance room unit for pms
    await this.pmsService.updateMaintenanceRoomUnitForPms(
      hotelId,
      pmsRoomUnitMaintenance,
      existingUnits
    );

    // step 3: update room unit availability
    await this.processUpdateRoomUnitAvailability(
      hotelId,
      pmsRoomUnitMaintenance,
      existingUnits,
      isCreateMaintenance
    );
  }

  async updateRoomProductMaintenance(body: RoomUnitMaintenanceDto) {
    const { hotelId, roomUnitIds, startDate, endDate, status, daysOfWeek } = body;

    if (!hotelId) {
      this.logger.warn('Hotel ID is required');
      return;
    }

    const dates = getAllowedDateByDayOfWeek(startDate, endDate, daysOfWeek);
    await this.processUpdateRoomProductAvailability(hotelId, dates, []);
  }

  async processUpdateRoomProductAvailability(
    hotelId: string,
    dates: string[],
    roomUnitIds: string[] = []
  ) {
    let existingRoomUnitIds = roomUnitIds;
    if (!existingRoomUnitIds || existingRoomUnitIds.length === 0) {
      const existingRoomUnits = await this.roomUnitRepository.find({
        where: {
          hotelId,
          deletedAt: IsNull()
        },
        select: ['id']
      });

      existingRoomUnitIds = existingRoomUnits.map((unit) => unit.id);
    }

    const roomProductAssignments = await this.roomProductAssignedUnitRepository.find({
      where: {
        roomUnitId: In(existingRoomUnitIds)
      },
      select: ['roomProductId']
    });

    const roomProductIds = roomProductAssignments.map((assignment) => assignment.roomProductId);

    await this.roomProductAvailabilityService.processUpdateRoomProductAvailability(
      hotelId,
      roomProductIds,
      dates
    );
  }

  async deleteRoomUnit(id: string) {
    if (!id) {
      throw new BadRequestException('Room unit ID is required');
    }
    try {
      await this.roomUnitRepository.update(id, { deletedAt: new Date() });
      return id;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async generateRoomUnitAvailabilityWithOneRoomUnit(hotelId: string, roomUnitId: string) {
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!roomUnitId) {
      throw new BadRequestException('Room unit ID is required');
    }

    const roomUnit = await this.roomUnitRepository.findOne({
      where: { hotelId, id: roomUnitId, deletedAt: IsNull() }
    });

    if (!roomUnit) {
      throw new BadRequestException('Room unit not found');
    }

    // get dates from today to 365 days from today
    const dates: string[] = [];
    let current = new Date();
    const end = addDays(current, 365);

    while (current <= end) {
      dates.push(format(current, DATE_FORMAT));
      current = addDays(current, 1);
    }

    this.logger.log(
      `Generating room unit availability for room unit ${roomUnit.roomNumber} in hotel ${hotelId} for ${dates.length} days`
    );
    // upsert room unit availability
    const values = dates.map((date) => ({
      roomUnitId,
      date,
      status: RoomUnitAvailabilityStatus.AVAILABLE,
      hotelId
    }));
    const chunkValues = chunk(values, 1000);
    for (const chunk of chunkValues) {
      await this.roomUnitAvailabilityRepository.query(`
          INSERT INTO room_unit_availability (hotel_id, room_unit_id, date, status)
          VALUES ${chunk.map((v) => `('${v.hotelId}', '${v.roomUnitId}', '${v.date}', '${v.status}')`).join(',')}
          ON CONFLICT (hotel_id, room_unit_id, date)
          DO UPDATE SET status = EXCLUDED.status
            WHERE room_unit_availability.status Not In ('ASSIGNED', 'OUT_OF_INVENTORY', 'OUT_OF_ORDER', 'BLOCKED') ;
          `);
    }
    // await this.roomUnitAvailabilityRepository
    //   .createQueryBuilder()
    //   .insert()
    //   .into(RoomUnitAvailability)
    //   .values(
    //     dates.map((date) => ({
    //       roomUnitId,
    //       date,
    //       status: RoomUnitAvailabilityStatus.AVAILABLE,
    //       hotelId
    //     }))
    //   )
    //   .orUpdate(['status'], ['room_unit_id', 'date', 'hotel_id'])
    //   .execute();

    this.logger.log(
      `Room unit availability generated for room unit ${roomUnit.roomNumber} in hotel ${hotelId}`
    );
  }

  async generateRoomUnitAvailability(hotelId: string, fromDate: string, toDate: string) {
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    const roomUnits = await this.roomUnitRepository.find({
      where: { hotelId, deletedAt: IsNull() },
      select: ['id', 'roomNumber']
    });

    // get dates from today to 365 days from today
    const current = fromDate ? new Date(fromDate) : new Date();
    const end = toDate ? new Date(toDate) : addDays(current, 365);
    const dates = Helper.generateDateRange(format(current, DATE_FORMAT), format(end, DATE_FORMAT));

    const data: Partial<RoomUnitAvailability>[] = [];

    roomUnits.forEach((roomUnit) => {
      dates.forEach((date) => {
        data.push({
          roomUnitId: roomUnit.id,
          date,
          status: RoomUnitAvailabilityStatus.AVAILABLE,
          hotelId
        });
      });
    });

    if (data.length === 0) {
      this.logger.warn(`No room unit availability data to generate for hotel ${hotelId}`);
      return;
    }

    const chunkSize = 1000;
    // step 4: update status day by day (skip records with ASSIGNED status)
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.roomUnitAvailabilityRepository.query(`
          INSERT INTO room_unit_availability (hotel_id, room_unit_id, date, status)
          VALUES ${chunk.map((v) => `('${v.hotelId}', '${v.roomUnitId}', '${v.date}', '${v.status}')`).join(',')}
          ON CONFLICT (hotel_id, room_unit_id, date)
          DO UPDATE SET status = EXCLUDED.status
            WHERE room_unit_availability.status = 'AVAILABLE';
          `);
    }

    this.logger.log(`Updated ${data.length} room unit availability for hotel ${hotelId}`);
  }

  async upsertRoomUnit(hotelId: string, pmsRoomUnits: RoomUnitMappingDto[]) {
    const existingUnits = await this.roomUnitRepository.find({
      where: { hotelId, deletedAt: IsNull() }
    });

    // Create a map for quick lookup
    const existingMap = new Map(existingUnits.map((u) => [u.mappingPmsCode, u]));

    const newUnits: Partial<RoomUnit>[] = [];
    const updateUnits: Partial<RoomUnit>[] = [];
    const seenCodes = new Set<string>();

    for (const dto of pmsRoomUnits) {
      seenCodes.add(dto.roomUnitMappingPmsCode);

      const existing = existingMap.get(dto.roomUnitMappingPmsCode);
      if (!existing) {
        // New record
        newUnits.push({
          hotelId,
          mappingPmsCode: dto.roomUnitMappingPmsCode,
          roomNumber: dto.name,
          roomFloor: dto.floor,
          featureString: dto.locationNotes,
          status: dto.status,
          isChanged: true
        });
      } else {
        // Existing -> check if needs update
        if (
          existing.roomNumber !== dto.name ||
          existing.roomFloor !== dto.floor ||
          existing.featureString !== dto.locationNotes
        ) {
          updateUnits.push({
            ...existing,
            roomNumber: dto.name,
            roomFloor: dto.floor,
            featureString: dto.locationNotes,
            isChanged: true
          });
        }
      }
    }

    // Find units to delete  -> hard delete
    const deleteUnits = existingUnits.filter((u) => !seenCodes.has(u.mappingPmsCode));

    // Perform DB actions in a transaction
    await this.roomUnitRepository.manager.transaction(async (trx) => {
      if (newUnits.length) {
        await trx.insert(RoomUnit, newUnits);
      }

      if (updateUnits.length) {
        await trx.save(RoomUnit, updateUnits);
      }

      if (deleteUnits.length) {
        await trx.delete(RoomUnit, { id: In(deleteUnits.map((u) => u.id)) });
      }
    });

    return {
      inserted: newUnits.length,
      updated: updateUnits.length,
      deleted: deleteUnits.length
    };
  }

  async processUpdateRoomUnitAvailability(
    hotelId: string,
    pmsRoomUnitMaintenance: RoomUnitMaintenanceMappingDto[],
    roomUnits?: RoomUnit[], // optional, if not provided, will query room units from database
    isCreateMaintenance: boolean = false
  ) {
    this.logger.log(
      `processUpdateRoomUnitAvailability for hotel ${hotelId} with ${pmsRoomUnitMaintenance.length} items`
    );
    try {
      // step 1: get room unit by mapping pms code
      let existingUnits = roomUnits;

      if (!existingUnits || existingUnits.length === 0) {
        existingUnits = await this.roomUnitRepository.find({
          where: {
            hotelId,
            mappingPmsCode: In(pmsRoomUnitMaintenance.map((u) => u.roomUnitMappingPmsCode)),
            deletedAt: IsNull()
          }
        });
      }

      if (!existingUnits || existingUnits.length === 0) {
        this.logger.warn(`No room units found for hotel ${hotelId}`);
        return;
      }

      const values: any[] = [];
      for (const item of pmsRoomUnitMaintenance) {
        // step 2: get room unit by mapping pms code
        const roomUnit = existingUnits.find(
          (u) => u.mappingPmsCode === item.roomUnitMappingPmsCode
        );

        if (!roomUnit) {
          continue;
        }

        // step 3: generate dates
        const dates: string[] = item.dates;
        const maintenanceId = item.maintenanceId || null;

        dates.forEach((date) => {
          values.push({
            hotelId: hotelId,
            roomUnitId: roomUnit.id,
            date,
            status: item.type,
            maintenanceId
          });
        });
      }

      // step 4: update status day by day (skip records with ASSIGNED status)
      if (values.length > 0) {
        await this.roomUnitAvailabilityRepository.query(`
        INSERT INTO room_unit_availability (hotel_id, room_unit_id, date, status, maintenance_id)
        VALUES ${values.map((v) => `('${v.hotelId}', '${v.roomUnitId}', '${v.date}', '${v.status}', ${v.maintenanceId ? `'${v.maintenanceId}'` : 'NULL'})`).join(',')}
        ON CONFLICT (hotel_id, room_unit_id, date)
        DO UPDATE SET status = EXCLUDED.status, maintenance_id = EXCLUDED.maintenance_id
          WHERE room_unit_availability.status != 'ASSIGNED' ${isCreateMaintenance ? 'AND room_unit_availability.maintenance_id IS NULL' : ''};
        `);
      }

      this.logger.log(`Updated ${values.length} room unit availability for hotel ${hotelId}`);
    } catch (err) {
      this.logger.error(
        `processUpdateRoomUnitAvailability failed for hotel ${hotelId}`,
        err.stack || err
      );
      throw err; // rethrow if you want the caller to handle
    }
  }

  async migrateMaintenances() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const roomUnitAvailabilities = await queryRunner.manager.find(RoomUnitAvailability, {
        where: {
          maintenanceId: IsNull(),
          status: In([
            RoomUnitAvailabilityStatus.OUT_OF_INVENTORY,
            RoomUnitAvailabilityStatus.OUT_OF_ORDER
          ])
        },
        order: {
          hotelId: 'ASC',
          roomUnitId: 'ASC',
          date: 'ASC'
        }
      });

      if (!roomUnitAvailabilities?.length) {
        this.logger.warn('No room unit availabilities found');
        return {
          message: 'No room unit availabilities found',
          data: true
        };
      }
      // merge room unit availabilities to maintenance with conditions: same hotelId, same roomUnitId, same status and date within a range of adjacent days
      // 2. Merge logic
      const blocks: RoomUnitAvailability[][] = [];
      let current: RoomUnitAvailability[] = [];

      for (const item of roomUnitAvailabilities) {
        if (current.length === 0) {
          current.push(item);
          continue;
        }

        const last = current[current.length - 1];
        const isSameHotel = last.hotelId === item.hotelId;
        const isSameRoom = last.roomUnitId === item.roomUnitId;
        const isSameStatus = last.status === item.status;
        const dateDiff = differenceInCalendarDays(new Date(item.date), new Date(last.date));

        const isAdjacent = dateDiff === 1;

        if (isSameHotel && isSameRoom && isSameStatus && isAdjacent) {
          current.push(item);
        } else {
          blocks.push(current);
          current = [item];
        }
      }

      // push last block
      if (current.length) blocks.push(current);

      // 3. Convert block → maintenance entity DTOs
      const maintenancesToInsert: Partial<Maintenance>[] = blocks.map((block) => ({
        id: uuidv4(),
        hotelId: block[0].hotelId,
        roomUnitId: block[0].roomUnitId
      }));

      if (!maintenancesToInsert.length) {
        this.logger.warn('No maintenances to insert');
        return {
          message: 'No maintenances to insert',
          data: true
        };
      }

      await queryRunner.manager.save(Maintenance, maintenancesToInsert, {
        chunk: 1000
      });

      // 5. Update room_unit_availability with maintenanceId
      const updates: Partial<RoomUnitAvailability>[] = [];
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const maintenance = maintenancesToInsert[i];

        for (const rua of block) {
          rua.maintenanceId = maintenance.id || null;
          updates.push(rua);
        }
      }

      await queryRunner.manager.save(RoomUnitAvailability, updates, {
        chunk: 1000
      });

      await queryRunner.commitTransaction();
      return {
        message: 'Maintenances migrated successfully',
        data: true
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async pullMaintenancePms() {
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    try {
      const mappingPmsHotels = await this.dataSource.manager.find(MappingPmsHotel, {
        where: {
          hotelId: Not(IsNull()),
          connectorId: Not(IsNull())
        },
        relations: ['connector'],
        select: {
          id: true,
          mappingHotelCode: true,
          hotelId: true,
          connectorId: true,
          connector: true
        }
      });

      if (!mappingPmsHotels?.length) {
        this.logger.warn('No mapping pms hotels found');
        return {
          message: 'No mapping pms hotels found',
          data: true
        };
      }

      const startDate = format(startOfDay(new Date()), DATE_TIME_ISO8601);
      const endDate = format(addDays(endOfDay(new Date()), 365), DATE_TIME_ISO8601);
      const allowedPms = this.configService.get(ENVIRONMENT.ALLOWED_PMS)?.split(',') || [
        ConnectorTypeEnum.APALEO
      ];
      for (const mappingPmsHotel of mappingPmsHotels) {
        if (!mappingPmsHotel.connector?.refreshToken) {
          this.logger.warn(`No refresh token found for mapping pms hotel ${mappingPmsHotel.id}`);
          continue;
        }
        if (!allowedPms.includes(mappingPmsHotel.connector.connectorType)) {
          this.logger.warn(
            `Connector type ${mappingPmsHotel.connector?.connectorType} is not allowed`
          );
          continue;
        }
        const pmsRoomUnitMaintenances = await this.pmsService.getPmsRoomUnitsMaintenance(
          mappingPmsHotel.hotelId,
          startDate,
          endDate,
          mappingPmsHotel.mappingHotelCode
        );
        if (!pmsRoomUnitMaintenances?.length) {
          this.logger.warn(
            `No room units maintenance found for mapping pms hotel ${mappingPmsHotel.id}`
          );
          continue;
        }

        await this.updateRoomUnitsMaintenance({
          hotelId: mappingPmsHotel.hotelId,
          maintenanceRoomUnits: pmsRoomUnitMaintenances.map((item) => ({
            roomUnitMappingPmsCode: item.roomUnitMappingPmsCode,
            from: item.from,
            to: item.to,
            type: item.type,
            maintenancePmsCode: item.maintenancePmsCode
          }))
        });
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      // await queryRunner.release();
    }
  }

  async refreshRoomUnitAvailabilityStatus(body: RefreshRoomStatus) {
    const { from, to, hotelId } = body;

    if (!hotelId || !from || !to) {
      return null;
    }

    const fromDate = format(new Date(from), DATE_FORMAT);
    // hard code 365 days
    const toDate = format(addDays(new Date(from), 365), DATE_FORMAT);

    let roomProductIds: string[] = [];

    await this.dataSource.transaction(async (manager) => {
      const affectedRoomUnitIds = new Set<string>();

      /**
       * 1️⃣ ASSIGNED → AVAILABLE
       */
      const assignedToAvailableResult = await manager.query(
        `
        UPDATE room_unit_availability rua
        SET status = 'AVAILABLE',
            updated_at = NOW()
        FROM room_unit ru
        WHERE rua.room_unit_id = ru.id
          AND ru.hotel_id = $1::uuid
          AND rua.status = 'ASSIGNED'
          AND rua.date::date >= $2::date
          AND rua.date::date <  $3::date
          AND NOT EXISTS (
            SELECT 1
            FROM reservation_time_slice rts
            JOIN reservation r
              ON r.id = rts.reservation_id
            WHERE rts.room_id = rua.room_unit_id
              AND rua.date::date >= rts.from_time::date
              AND rua.date::date <  rts.to_time::date
              AND r.status NOT IN ('CANCELLED', 'RELEASED', 'PAYMENT_FAILED')
              AND r.deleted_at IS NULL
              AND rts.deleted_at IS NULL
          )
        RETURNING rua.room_unit_id AS room_unit_id
        `,
        [hotelId, fromDate, toDate]
      );

      const [assignedRows] = assignedToAvailableResult as [{ room_unit_id: string }[], number];

      assignedRows.forEach((r) => {
        if (r?.room_unit_id) {
          affectedRoomUnitIds.add(r.room_unit_id);
        }
      });

      /**
       * 2️⃣ AVAILABLE → ASSIGNED
       */
      const availableToAssignedResult = await manager.query(
        `
        UPDATE room_unit_availability rua
        SET status = 'ASSIGNED',
            updated_at = NOW()
        FROM room_unit ru
        WHERE rua.room_unit_id = ru.id
          AND ru.hotel_id = $1::uuid
          AND rua.status = 'AVAILABLE'
          AND rua.date::date >= $2::date
          AND rua.date::date <  $3::date
          AND EXISTS (
            SELECT 1
            FROM reservation_time_slice rts
            JOIN reservation r
              ON r.id = rts.reservation_id
            WHERE rts.room_id = rua.room_unit_id
              AND rua.date::date >= rts.from_time::date
              AND rua.date::date <  rts.to_time::date
              AND r.status NOT IN ('CANCELLED', 'RELEASED', 'PAYMENT_FAILED')
              AND r.deleted_at IS NULL
              AND rts.deleted_at IS NULL
          )
        RETURNING rua.room_unit_id AS room_unit_id
        `,
        [hotelId, fromDate, toDate]
      );

      const [availableRows] = availableToAssignedResult as [{ room_unit_id: string }[], number];

      availableRows.forEach((r) => {
        if (r?.room_unit_id) {
          affectedRoomUnitIds.add(r.room_unit_id);
        }
      });

      /**
       * 3️⃣ Map EXACT room_unit_ids → room_product_ids
       */
      if (affectedRoomUnitIds.size > 0) {
        const rows = await manager.query(
          `
          SELECT DISTINCT rpau.room_product_id
          FROM room_product_assigned_unit rpau
          WHERE rpau.room_unit_id = ANY($1::uuid[])
          `,
          [Array.from(affectedRoomUnitIds)]
        );

        roomProductIds = rows.map((r) => r?.room_product_id).filter(Boolean);
      }
    });

    /**
     * 4️⃣ Update room product availability
     */
    if (roomProductIds.length > 0) {
      const dateRanges = Helper.generateDateRange(fromDate, toDate);

      await this.roomProductAvailabilityService.processUpdateRoomProductAvailability(
        hotelId,
        roomProductIds,
        dateRanges
      );
    }

    return {
      success: true,
      from: fromDate,
      to: toDate,
      hotelId,
      affectedRoomProducts: roomProductIds.length
    };
  }

  async jobPullPmsAvailability() {
    const hotels = await this.hotelRepository.find();

    this.logger.log(`Found ${hotels.length} hotels`);

    if (hotels.length === 0) {
      this.logger.warn('No hotels found');
      return;
    }

    const fromDate = format(new Date(), DATE_FORMAT);
    const toDate = format(addDays(new Date(), 365), DATE_FORMAT);

    let processedHotels = 0;
    let failedHotels = 0;

    for (const hotel of hotels) {
      const hotelId = hotel.id;
      try {
        await this.refreshRoomUnitAvailabilityStatus({
          hotelId,
          from: fromDate,
          to: toDate
        });
        processedHotels++;
        this.logger.log(`✅ Synced availability for hotel ${hotelId}`);
      } catch (error) {
        failedHotels++;
        this.logger.error(`❌ Failed syncing hotel ${hotelId}`, error);
      }
    }

    this.logger.log(
      `🏁 Job completed. Processed: ${processedHotels} hotels, Failed: ${failedHotels} hotels`
    );

    return true;
  }

  private normalizeRoomUnitMaintenance(
    items: RoomUnitMaintenanceMappingDto[]
  ): RoomUnitMaintenanceMappingDto[] {
    // Reverse the list so we process from latest to earliest (Last Write Wins)
    const reversedItems = [...items].reverse();
    const seenDates = new Set<string>();
    const result: RoomUnitMaintenanceMappingDto[] = [];

    for (const item of reversedItems) {
      if (!item.dates || item.dates.length === 0) {
        continue;
      }

      const uniqueDates: string[] = [];
      for (const date of item.dates) {
        const key = `${item.roomUnitMappingPmsCode}_${date}`;
        if (!seenDates.has(key)) {
          seenDates.add(key);
          uniqueDates.push(date);
        }
      }

      if (uniqueDates.length > 0) {
        // Keep the item but with only unique dates
        result.push({
          ...item,
          dates: uniqueDates
        });
      }
    }

    // Reverse back to original order
    return result.reverse();
  }
}
