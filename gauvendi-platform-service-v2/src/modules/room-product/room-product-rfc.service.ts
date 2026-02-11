import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { HotelStandardFeature } from '@src/core/entities/hotel-standard-feature.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductBasePriceSetting } from '@src/core/entities/room-product-base-price-setting.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductFeatureRateAdjustment } from '@src/core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnitRetailFeature } from '@src/core/entities/room-unit-retail-feature.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import {
  BasePriceMode,
  DistributionChannel,
  RfcAllocationSetting,
  RoomProductBasePriceSettingModeEnum,
  RoomProductStatus,
  RoomProductType
} from '@src/core/enums/common';
import { BusinessLogicException, DatabaseException } from '@src/core/exceptions';
import { groupBy } from 'lodash';
import {
  And,
  DataSource,
  EntityManager,
  Equal,
  In,
  IsNull,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Raw,
  Repository
} from 'typeorm';
import { RoomProductAvailabilityService } from '../room-product-availability/room-product-availability.service';

/** This Service's business logic focus on Room Product type is RFC */
@Injectable()
export class RoomProductRfcService {
  private readonly logger = new Logger(RoomProductRfcService.name);

  constructor(
    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,

    @InjectRepository(RoomUnit, DbName.Postgres)
    private readonly roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(RoomProductStandardFeature, DbName.Postgres)
    private readonly roomProductStandardFeatureRepository: Repository<RoomProductStandardFeature>,

    @InjectRepository(RoomProductFeatureRateAdjustment, DbName.Postgres)
    private readonly roomProductFeatureRateAdjustmentRepository: Repository<RoomProductFeatureRateAdjustment>,

    @InjectRepository(RoomProductBasePriceSetting, DbName.Postgres)
    private readonly roomProductBasePriceSettingRepository: Repository<RoomProductBasePriceSetting>,

    @InjectRepository(RoomProductMapping, DbName.Postgres)
    private readonly roomProductMappingRepository: Repository<RoomProductMapping>,

    @InjectRepository(RoomUnitRetailFeature, DbName.Postgres)
    private readonly roomUnitRetailFeatureRepository: Repository<RoomUnitRetailFeature>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly roomProductAvailabilityService: RoomProductAvailabilityService
  ) {}

  public async generateRoomProductRfc(hotelId: string) {
    try {
      this.logger.debug(`generateRoomProductRfc ${hotelId}`);
      return true;

      // #region: step 1: get room units
      let roomUnits = await this.roomUnitRepository.find({
        where: {
          hotelId,
          deletedAt: IsNull(),
          isChanged: true,
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
        select: {}
      });

      let roomUnitIds: string[] = [];

      for (const roomUnit of roomUnits) {
        roomUnitIds.push(roomUnit.id);
      }

      roomUnitIds = [...new Set(roomUnitIds)];

      const [roomUnitRetailFeatures, roomProductAssignedUnits] = await Promise.all([
        this.roomUnitRetailFeatureRepository.find({
          where: {
            hotelId,
            roomUnitId: In(roomUnitIds),
            quantity: MoreThan(0)
          },
          select: {
            id: true,
            quantity: true,
            roomUnitId: true,
            retailFeatureId: true,
            retailFeature: true
          },
          relations: {
            retailFeature: true
          }
        }),
        this.roomProductAssignedUnitRepository.find({
          where: {
            roomUnitId: In(roomUnitIds),
            roomProduct: {
              type: RoomProductType.RFC
            }
          },
          select: {
            roomProduct: {
              roomProductRetailFeatures: {
                id: true,
                retailFeatureId: true,
                quantity: true
              },
              type: true
            },
            roomProductId: true,
            roomUnitId: true,
            roomUnit: true
          },
          relations: {
            roomProduct: {
              roomProductRetailFeatures: {
                retailFeature: true
              }
            },
            roomUnit: true
          }
        })
      ]);

      const roomUnitRetailFeaturesMap: Map<string, RoomUnitRetailFeature[]> = new Map();
      const roomProductAssignedUnitsMap: Map<string, RoomProductAssignedUnit[]> = new Map();
      for (const roomUnitRetailFeature of roomUnitRetailFeatures) {
        const roomUnitId = roomUnitRetailFeature.roomUnitId;
        const roomUnitRetailFeatures = roomUnitRetailFeaturesMap.get(roomUnitId) || [];
        roomUnitRetailFeatures.push(roomUnitRetailFeature);
        roomUnitRetailFeaturesMap.set(roomUnitId, roomUnitRetailFeatures);
      }
      for (const roomProductAssignedUnit of roomProductAssignedUnits) {
        const roomUnitId = roomProductAssignedUnit.roomUnitId;
        const roomProductAssignedUnits = roomProductAssignedUnitsMap.get(roomUnitId) || [];
        roomProductAssignedUnits.push(roomProductAssignedUnit);
        roomProductAssignedUnitsMap.set(roomUnitId, roomProductAssignedUnits);
      }
      roomUnits = roomUnits.map((roomUnit) => {
        const roomUnitRetailFeatures = roomUnitRetailFeaturesMap.get(roomUnit.id) || [];
        const roomProductAssignedUnits = roomProductAssignedUnitsMap.get(roomUnit.id) || [];
        return {
          ...roomUnit,
          roomUnitRetailFeatures,
          roomProductAssignedUnits
        };
      });

      // Validate
      if (roomUnits?.length === 0) {
        // update room product mapping
        await this.updateRoomProductMapping(hotelId);
        throw new BusinessLogicException('No room units were changed found');
      }
      // #endregion

      this.logger.log('room units change: ', roomUnits.map((e) => e.roomNumber).join(' -- '));

      // #region: step 2: group room units by featureString;
      const roomUnitsGroupedByFeatureString: Map<string, RoomUnit[]> = new Map(
        Object.entries(groupBy(roomUnits, 'featureString'))
      );
      // #endregion

      // #region: step 3: get room products type rfc only
      const roomProducts = await this.roomProductRepository.find({
        withDeleted: true,
        where: {
          hotelId,
          type: RoomProductType.RFC,
          featureString: Raw(
            (alias) => `
              ${alias} IS NOT NULL
              AND TRIM(${alias}) <> ''
            `
          )
        },
        select: {
          id: true,
          code: true,
          featureString: true,
          roomProductAssignedUnits: { roomUnitId: true },
          deletedAt: true
        },
        relations: {
          roomProductAssignedUnits: true
        }
      });
      // #endregion

      // #region: step 4: get unique existing room products rfc codes:
      const uniqueExistingRoomProductsRfcCodes = [...new Set(roomProducts.map((rp) => rp.code))];

      // separate logic by uniqueExistingRoomProductsRfcCodes
      if (uniqueExistingRoomProductsRfcCodes?.length > 0) {
        const roomProductRfcPerFeatureString = new Map<string, RoomProduct>(
          roomProducts?.filter((rp) => !rp.deletedAt).map((rp) => [rp.featureString, rp])
        );
        const roomProductIdPerRoomUnitId = new Map<string, string>(
          roomProducts?.flatMap((rp) =>
            rp.roomProductAssignedUnits?.map((rpa) => [rpa.roomUnitId, rp.id])
          )
        );

        await this.reGenerateRfc(
          hotelId,
          roomUnitsGroupedByFeatureString,
          roomProductRfcPerFeatureString,
          roomProductIdPerRoomUnitId,
          uniqueExistingRoomProductsRfcCodes
        );
      } else {
        const createdRoomProducts = await this.generateRfcFirst(
          hotelId,
          roomUnitsGroupedByFeatureString,
          uniqueExistingRoomProductsRfcCodes
        );

        if (createdRoomProducts.length > 0) {
          // generate room product availability
          await this.roomProductAvailabilityService.generateRoomProductAvailability({
            hotelId,
            roomProductIds: createdRoomProducts.map((rp) => rp.id)
          });
        }
      }

      // update room product mapping
      await this.updateRoomProductMapping(hotelId);

      await Promise.all([
        // reset room unit is changed to false
        this.roomUnitRepository.update({ hotelId }, { isChanged: false }),

        // set average space for RFC room products
        await this.setAverageSpace(roomUnits, hotelId)
      ]);

      return true;
      // #endregion
    } catch (error) {
      if (!(error instanceof DatabaseException)) {
        throw error;
      }

      throw new DatabaseException(`Error generating room product RFC: ${error.message}`);
    }
  }

  private async updateRoomProductMapping(hotelId: string) {
    // update room product mapping -> only apply for MRFC and RFC
    // for logic -> get room unit assigned both MRFC and RFC -> if they same room unit -> create mapping
    // check current to delete or create mapping
    // Step 1: Get all MRFC + RFC room products with assigned units
    const roomProductMrfcAndRfc = await this.roomProductRepository.find({
      where: {
        hotelId,
        type: In([RoomProductType.MRFC, RoomProductType.RFC]),
        deletedAt: IsNull()
      },
      select: {
        id: true,
        type: true,
        code: true,
        featureString: true,
        roomProductAssignedUnits: { roomUnitId: true }
      },
      relations: {
        roomProductAssignedUnits: true
      }
    });

    // Step 2: Split into MRFC and RFC
    const roomProductMrfc = roomProductMrfcAndRfc.filter((rp) => rp.type === RoomProductType.MRFC);
    const roomProductRfc = roomProductMrfcAndRfc.filter((rp) => rp.type === RoomProductType.RFC);

    // Step 3: Build sets of assigned room units
    const roomUnitAssignedMrfc = new Set(
      roomProductMrfc.flatMap((rp) => rp.roomProductAssignedUnits.map((rpa) => rpa.roomUnitId))
    );
    const roomUnitAssignedRfc = new Set(
      roomProductRfc.flatMap((rp) => rp.roomProductAssignedUnits.map((rpa) => rpa.roomUnitId))
    );

    // Step 4: Determine the overlap - room units assigned to both MRFC and RFC
    const roomUnitAssignedBoth = [...roomUnitAssignedMrfc].filter((id) =>
      roomUnitAssignedRfc.has(id)
    );

    // Step 5: Create mappings for room units that are assigned to both MRFC and RFC
    const expectedMappingsSet = new Set<string>();

    // For each room unit that's assigned to both MRFC and RFC, create mappings
    for (const roomUnitId of roomUnitAssignedBoth) {
      const mrfcProducts = roomProductMrfc.filter((mrfc) =>
        mrfc.roomProductAssignedUnits.some((unit) => unit.roomUnitId === roomUnitId)
      );
      const rfcProducts = roomProductRfc.filter((rfc) =>
        rfc.roomProductAssignedUnits.some((unit) => unit.roomUnitId === roomUnitId)
      );

      // Create mappings between all MRFC and RFC that share this room unit
      for (const mrfc of mrfcProducts) {
        for (const rfc of rfcProducts) {
          // Use a unique key to prevent duplicates
          const mappingKey = `${mrfc.id}:${rfc.id}`;
          expectedMappingsSet.add(mappingKey);
        }
      }
    }

    // Convert set back to array of objects
    const expectedMappings: Array<{ mrfcId: string; rfcId: string }> = Array.from(
      expectedMappingsSet
    ).map((key) => {
      const [mrfcId, rfcId] = key.split(':');
      return { mrfcId, rfcId };
    });

    // Step 6: Get current mappings from database
    const currentMappings = await this.roomProductMappingRepository.find({
      where: { hotelId },
      select: { id: true, roomProductId: true, relatedRoomProductId: true }
    });

    // Step 7: Synchronize mappings
    await this.dataSource.transaction(async (manager) => {
      // DELETE: Remove mappings that should not exist anymore
      const mappingsToDelete = currentMappings.filter((current) => {
        return !expectedMappings.some(
          (expected) =>
            expected.mrfcId === current.roomProductId &&
            expected.rfcId === current.relatedRoomProductId
        );
      });

      if (mappingsToDelete.length > 0) {
        const idsToDelete = mappingsToDelete.map((mapping) => mapping.id);
        await manager.delete(RoomProductMapping, { id: In(idsToDelete) });
        this.logger.log(
          `Deleted ${mappingsToDelete.length} obsolete room product mappings for hotel ${hotelId}`
        );
      }

      // INSERT: Add new mappings that don't exist in current DB
      const mappingsToInsert = expectedMappings.filter((expected) => {
        return !currentMappings.some(
          (current) =>
            current.roomProductId === expected.mrfcId &&
            current.relatedRoomProductId === expected.rfcId
        );
      });

      if (mappingsToInsert.length > 0) {
        const newMappings = mappingsToInsert.map((mapping) =>
          manager.create(RoomProductMapping, {
            hotelId,
            roomProductId: mapping.mrfcId,
            relatedRoomProductId: mapping.rfcId
          })
        );

        await manager.save(RoomProductMapping, newMappings);
        this.logger.log(
          `Created ${mappingsToInsert.length} new room product mappings for hotel ${hotelId}`
        );
      }

      this.logger.log(
        `Room product mapping synchronization completed for hotel ${hotelId}. Expected: ${expectedMappings.length}, Current: ${currentMappings.length}, Deleted: ${mappingsToDelete.length}, Created: ${mappingsToInsert.length}`
      );
    });
  }

  private async generateRfcFirst(
    hotelId: string,
    roomUnitsGroupedByFeatureString: Map<string, RoomUnit[]>,
    uniqueExistingRoomProductsRfcCodes: string[]
  ) {
    // Optimize: Process all groups in a single transaction to avoid N+1 queries
    return await this.dataSource.transaction(async (manager) => {
      const existingCodesSet = new Set(uniqueExistingRoomProductsRfcCodes);
      const allRoomProductsToCreate: any[] = [];
      const allRetailFeaturesToCreate: any[] = [];
      // const allStandardFeaturesToCreate: any[] = [];
      const allAssignedUnitsToCreate: any[] = [];

      // Prepare all data first
      let lastRFCCode = '';
      for (const changedRooms of roomUnitsGroupedByFeatureString.values()) {
        const sampleRoomUnit = changedRooms[0];

        // Generate unique RFC code
        const code = await this.generateRfcCode(RoomProductType.RFC, hotelId, lastRFCCode);
        lastRFCCode = code;
        uniqueExistingRoomProductsRfcCodes.push(code);

        const roomProductData = {
          hotelId,
          code,
          featureString: sampleRoomUnit?.featureString,
          type: RoomProductType.RFC,
          rfcAllocationSetting: RfcAllocationSetting.DEDUCT,
          status: RoomProductStatus.DRAFT,
          distributionChannel: [
            DistributionChannel.GV_SALES_ENGINE,
            DistributionChannel.GV_VOICE,
            DistributionChannel.SITEMINDER
          ],
          basePriceMode: BasePriceMode.FEATURE_BASED,
          name: code,
          numberOfBedrooms: 1 // default number of bedrooms is 1
        };

        allRoomProductsToCreate.push({ data: roomProductData, changedRooms, sampleRoomUnit });
      }

      // Bulk insert all room products
      const createdRoomProducts: RoomProduct[] = [];
      for (const item of allRoomProductsToCreate) {
        const roomProduct = manager.create(RoomProduct, item.data);
        const saved = await manager.save(RoomProduct, roomProduct);
        createdRoomProducts.push(saved);

        // Collect retail features for this room product
        const roomUnitRetailFeatures = item.sampleRoomUnit.roomUnitRetailFeatures;
        const retailFeatureIds = new Set(
          roomUnitRetailFeatures?.map((rhrf) => rhrf?.retailFeatureId)
        );

        // Add retail features
        retailFeatureIds?.forEach((retailFeatureId) => {
          allRetailFeaturesToCreate.push({
            hotelId: item.sampleRoomUnit?.hotelId,
            roomProductId: saved.id,
            retailFeatureId,
            quantity: item.sampleRoomUnit?.quantity
          });
        });

        // Add assigned units
        item.changedRooms?.forEach((changedRoom: RoomUnit) => {
          allAssignedUnitsToCreate.push({
            roomProductId: saved.id,
            roomUnitId: changedRoom?.id
          });
        });
      }

      // Bulk insert all related entities
      const insertPromises: Promise<any>[] = [];

      if (allRetailFeaturesToCreate.length > 0) {
        insertPromises.push(
          manager
            .createQueryBuilder()
            .insert()
            .into(RoomProductRetailFeature)
            .values(allRetailFeaturesToCreate)
            .execute()
        );
      }

      if (allAssignedUnitsToCreate.length > 0) {
        insertPromises.push(
          manager
            .createQueryBuilder()
            .insert()
            .into(RoomProductAssignedUnit)
            .values(allAssignedUnitsToCreate)
            .orIgnore()
            .execute()
        );
      }

      if (createdRoomProducts.length > 0) {
        insertPromises.push(
          manager
            .createQueryBuilder()
            .insert()
            .into(RoomProductBasePriceSetting)
            .values(
              createdRoomProducts.map((rp) => ({
                hotelId: rp.hotelId,
                roomProductId: rp.id,
                mode: RoomProductBasePriceSettingModeEnum.FEATURE_BASED
              }))
            )
            .execute()
        );
      }

      await Promise.all(insertPromises);

      // Add default hotel standard features to all created room products
      if (createdRoomProducts.length > 0) {
        const hotelStandardFeatures = await manager.getRepository(HotelStandardFeature).find({
          where: { hotelId }
        });

        if (hotelStandardFeatures.length > 0) {
          const allStandardFeaturesToCreate: any[] = [];
          createdRoomProducts.forEach((roomProduct) => {
            hotelStandardFeatures.forEach((feature) => {
              allStandardFeaturesToCreate.push({
                hotelId,
                roomProductId: roomProduct.id,
                standardFeatureId: feature.id
              });
            });
          });

          if (allStandardFeaturesToCreate.length > 0) {
            await manager
              .createQueryBuilder()
              .insert()
              .into(RoomProductStandardFeature)
              .values(allStandardFeaturesToCreate)
              .execute();
          }
        }
      }

      return createdRoomProducts;
    });
  }

  private async generateRfcCode(
    type: RoomProductType,
    hotelId: string,
    lastCode?: string
  ): Promise<string> {
    const formatCode = (num: number) => `${type}${num.toString().padStart(3, '0')}`;

    const getNextNumber = (code?: string) => (code ? parseInt(code.replace(/\D/g, ''), 10) + 1 : 1);

    if (lastCode) {
      return formatCode(getNextNumber(lastCode));
    }

    const result = await this.roomProductRepository
      .createQueryBuilder('rp')
      .withDeleted()
      .select('rp.code', 'code')
      .where('rp.hotel_id = :hotelId', { hotelId })
      .andWhere('rp.type = :type', { type })
      .orderBy("CAST(regexp_replace(rp.code, '\\D', '', 'g') AS INT)", 'DESC')
      .limit(1)
      .getRawOne();
    const newCode = formatCode(getNextNumber(result?.code));
    return newCode;
  }

  private async reGenerateRfc(
    hotelId: string,
    roomUnitsGroupedByFeatureString: Map<string, RoomUnit[]>,
    roomProductRfcPerFeatureString: Map<string, RoomProduct>,
    roomProductIdPerRoomUnitId: Map<string, string>,
    uniqueExistingRoomProductsRfcCodes: string[]
  ) {
    // Optimize: Wrap all operations in a single transaction to ensure atomicity
    let roomProductIdsToGenerateAvailability: string[] = [];
    const result = await this.dataSource.transaction(async (manager) => {
      const allDeletedRoomProductIds = new Set<string>();
      const deleteAssignedProductUnitIds: { roomProductId: string; roomUnitId: string }[] = [];
      const allNewAssignedUnits: any[] = [];

      // Collect all operations from each feature string group
      for (const [featureString, changedRooms] of roomUnitsGroupedByFeatureString.entries()) {
        const matchedFstrRfc = roomProductRfcPerFeatureString.get(featureString);
        const roomProductByChangeRoom = await this.checkRoomProductOnlyHas1Unit(changedRooms);
        // Delete room product if product has 1 assign unit but already assign to other room product
        const roomProductHas1AssignUnit = roomProductByChangeRoom?.filter(
          (e) => e.roomProductAssignedUnits?.length === 1
        );

        // Match case feature string
        // Determine Scenario
        let scenario = 'SPLIT_OR_MERGE';
        let rfcIdsContainChangedRoom: string[] = [];
        let rfcIdContainChangedRoom: string | undefined;

        if (matchedFstrRfc) {
          scenario = 'MATCHED_EXISTING';
        } else {
          rfcIdsContainChangedRoom = Array.from(
            new Set(
              changedRooms.map(
                (changedRoom) => roomProductIdPerRoomUnitId.get(changedRoom?.id) || ''
              )
            )
          ).filter(Boolean);

          if (rfcIdsContainChangedRoom.length === 0) {
            scenario = 'NEW_CLEAN';
          } else if (rfcIdsContainChangedRoom.length === 1) {
            rfcIdContainChangedRoom = rfcIdsContainChangedRoom[0];
            const isFullUpdate = await this.isChangedRoomsContainAllRoomsOfRfc(
              changedRooms,
              rfcIdContainChangedRoom
            );
            if (isFullUpdate) {
              scenario = 'UPDATE_EXISTING';
            }
          }
        }

        // Execute Scenario
        switch (scenario) {
          case 'MATCHED_EXISTING': {
            const operations = this.reMapChangedRoomsToRfc(
              changedRooms,
              matchedFstrRfc!,
              roomProductIdPerRoomUnitId
            );

            // Aggregate all operations
            if (roomProductHas1AssignUnit?.length > 0) {
              Array.from(operations.deletedRoomProductIds)
                .filter((id) => roomProductHas1AssignUnit.some((e) => e.id === id))
                .forEach((id) => allDeletedRoomProductIds.add(id));
            }
            // Un-assign room units from old RFC
            if (operations.deleteAssignedProductUnitIds.length > 0) {
              deleteAssignedProductUnitIds.push(...operations.deleteAssignedProductUnitIds);
            }

            allNewAssignedUnits.push(...operations.newAssignedUnits);

            // Add RFC to availability generation if there are new assignments
            if (operations.newAssignedUnits.length > 0) {
              roomProductIdsToGenerateAvailability.push(matchedFstrRfc!.id);
            }

            // Update room product retail features
            const sampleRoomUnit = changedRooms[0];
            const roomUnitRetailFeaturesMap = new Map<string, RoomUnitRetailFeature>(
              sampleRoomUnit?.roomUnitRetailFeatures?.map((e) => [e.retailFeatureId, e]) || []
            );

            const roomProducts =
              sampleRoomUnit?.roomProductAssignedUnits
                ?.map((e) => e.roomProduct)
                ?.filter((i) => i?.type === RoomProductType.RFC) || [];
            const roomProductRetailFeatures = roomProducts.flatMap(
              (e) => e?.roomProductRetailFeatures?.map((i) => i) || []
            );
            const updateRetailFeatures: RoomProductRetailFeature[] = [];
            for (const roomProductRetailFeature of roomProductRetailFeatures) {
              const roomUnitRetailFeature = roomUnitRetailFeaturesMap.get(
                roomProductRetailFeature.retailFeatureId
              );
              const isSameQuantity =
                (roomProductRetailFeature.quantity || 0) === (roomUnitRetailFeature?.quantity || 0);
              if (isSameQuantity) {
                continue;
              }
              updateRetailFeatures.push({
                ...roomProductRetailFeature,
                quantity: roomUnitRetailFeature?.quantity || 0
              });
            }

            if (updateRetailFeatures?.length) {
              await this.roomProductRetailFeatureRepository.save(updateRetailFeatures);
            }
            break;
          }

          case 'NEW_CLEAN': {
            const newRfc = await this.generateRfcByChangedRooms(
              changedRooms,
              uniqueExistingRoomProductsRfcCodes
            );
            roomProductIdsToGenerateAvailability.push(newRfc.id);
            break;
          }

          case 'UPDATE_EXISTING': {
            if (!rfcIdContainChangedRoom) break; // Should not happen based on logic

            await this.updateRfcContainAllOldChangedRooms(
              hotelId,
              changedRooms,
              rfcIdContainChangedRoom
            );
            await this.mapNewChangedRoomsToRfc(
              hotelId,
              changedRooms,
              rfcIdContainChangedRoom,
              roomProductIdPerRoomUnitId
            );

            // Add RFC to availability generation as it may have new assignments
            roomProductIdsToGenerateAvailability.push(rfcIdContainChangedRoom);
            break;
          }

          case 'SPLIT_OR_MERGE': {
            const newRoomProduct = await this.generateRfcByChangedRooms(
              changedRooms,
              uniqueExistingRoomProductsRfcCodes
            );
            const operations = this.reMapChangedRoomsToRfc(
              changedRooms,
              newRoomProduct,
              roomProductIdPerRoomUnitId
            );

            // Aggregate all operations
            if (roomProductHas1AssignUnit?.length > 0) {
              Array.from(operations.deletedRoomProductIds)
                .filter((id) => roomProductHas1AssignUnit.some((e) => e.id === id))
                .forEach((id) => allDeletedRoomProductIds.add(id));
            }

            if (operations.deleteAssignedProductUnitIds.length > 0) {
              deleteAssignedProductUnitIds.push(...operations.deleteAssignedProductUnitIds);
            }
            allNewAssignedUnits.push(...operations.newAssignedUnits);

            // Add new RFC to availability generation
            roomProductIdsToGenerateAvailability.push(newRoomProduct.id);
            break;
          }
        }
      }

      // Execute all bulk operations within the transaction
      const deletePromises: Promise<any>[] = [];

      if (allDeletedRoomProductIds.size > 0) {
        deletePromises.push(this.deleteRoomProduct(manager, Array.from(allDeletedRoomProductIds)));
      }

      if (deleteAssignedProductUnitIds.length > 0) {
        const pairs = deleteAssignedProductUnitIds
          .map((item) => `('${item.roomProductId}', '${item.roomUnitId}')`)
          .join(', ');

        deletePromises.push(
          manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductAssignedUnit)
            .where(`(room_product_id, room_unit_id) IN (${pairs})`)
            .execute()
        );
      }

      // Execute deletes in parallel
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
      }

      // Bulk insert new assignments
      if (allNewAssignedUnits.length > 0) {
        const newAssigbedRoomProductIds = new Set<string>();
        for (const newAssignedUnit of allNewAssignedUnits) {
          newAssigbedRoomProductIds.add(newAssignedUnit.roomProductId);
        }
        roomProductIdsToGenerateAvailability.push(...Array.from(newAssigbedRoomProductIds));
        await manager
          .createQueryBuilder()
          .insert()
          .into(RoomProductAssignedUnit)
          .values(allNewAssignedUnits)
          .orIgnore()
          .execute();
      }
    });

    if (roomProductIdsToGenerateAvailability.length > 0) {
      // Remove duplicates before generating availability
      const uniqueRoomProductIds = [...new Set(roomProductIdsToGenerateAvailability)];
      await this.roomProductAvailabilityService.generateRoomProductAvailability({
        hotelId,
        roomProductIds: uniqueRoomProductIds
      });
    }

    return result;
  }

  private async checkRoomProductOnlyHas1Unit(changedRooms: RoomUnit[]) {
    // Check room product only has 1 room unit
    // if room product only has 1 room unit, keep it:
    const sampleRoomUnit = changedRooms[0];
    let checkRoomProduct: RoomProduct[] = [];
    const allProductIds = sampleRoomUnit?.roomProductAssignedUnits?.map(
      (unit) => unit.roomProductId
    );
    if (allProductIds?.length > 0) {
      checkRoomProduct = await this.roomProductRepository.find({
        where: {
          id: In(allProductIds),
          type: RoomProductType.RFC,
          deletedAt: IsNull()
        },
        relations: {
          roomProductAssignedUnits: true
        }
      });
    }

    return checkRoomProduct;
  }

  private async deleteRoomProduct(manager: EntityManager, roomProductIds: string[]) {
    let deletePromises: Promise<any>[] = [];

    // delete feature base price setting
    deletePromises.push(
      manager
        .createQueryBuilder()
        .delete()
        .from(RoomProductBasePriceSetting)
        .where('room_product_id IN (:...ids)', { ids: roomProductIds })
        .execute()
    );

    // delete room product daily availability
    deletePromises.push(
      manager
        .createQueryBuilder()
        .delete()
        .from(RoomProductDailyAvailability)
        .where('room_product_id IN (:...ids)', { ids: roomProductIds })
        .execute()
    );

    // delete room product daily selling price
    deletePromises.push(
      manager
        .createQueryBuilder()
        .delete()
        .from(RoomProductDailySellingPrice)
        .where('room_product_id IN (:...ids)', { ids: roomProductIds })
        .execute()
    );

    // delete room product assigned units
    deletePromises.push(
      manager
        .createQueryBuilder()
        .delete()
        .from(RoomProductAssignedUnit)
        .where('room_product_id IN (:...ids)', { ids: roomProductIds })
        .execute()
    );

    // delete room product retail features
    deletePromises.push(
      manager
        .createQueryBuilder()
        .delete()
        .from(RoomProductRetailFeature)
        .where('room_product_id IN (:...ids)', { ids: roomProductIds })
        .execute()
    );

    // delete room product mapping
    deletePromises.push(
      manager
        .createQueryBuilder()
        .delete()
        .from(RoomProductMapping)
        .where('room_product_id IN (:...ids) OR related_room_product_id IN (:...ids)', {
          ids: roomProductIds
        })
        .execute()
    );

    const roomProductRatePlan = await manager.find(RoomProductRatePlan, {
      where: {
        roomProductId: In(roomProductIds)
      },
      select: {
        id: true
      }
    });

    // delete room product rate plan availability adjustments
    const roomProductRatePlanIds = roomProductRatePlan.map((rprp) => rprp.id);
    if (roomProductRatePlanIds?.length > 0) {
      deletePromises.push(
        manager
          .createQueryBuilder()
          .delete()
          .from(RoomProductRatePlanAvailabilityAdjustment)

          .where('room_product_rate_plan_id IN (:...ids)', {
            ids: roomProductRatePlan.map((rprp) => rprp.id)
          })
          .execute()
      );
    }

    // delete room product rate plan
    deletePromises.push(
      manager
        .createQueryBuilder()
        .delete()
        .from(RoomProductRatePlan)
        .where('room_product_id IN (:...ids)', { ids: roomProductIds })
        .execute()
    );

    // delete room product pricing method detail
    deletePromises.push(
      manager
        .createQueryBuilder()
        .delete()
        .from(RoomProductPricingMethodDetail)
        .where('room_product_id IN (:...ids)', { ids: roomProductIds })
        .execute()
    );

    // delete room product standard features
    deletePromises.push(
      manager
        .createQueryBuilder()
        .delete()
        .from(RoomProductStandardFeature)
        .where('room_product_id IN (:...ids)', { ids: roomProductIds })
        .execute()
    );

    // delete room product
    deletePromises.push(
      manager
        .createQueryBuilder()
        .softDelete()
        .from(RoomProduct)
        .where('id IN (:...ids)', { ids: roomProductIds })
        .execute()
    );
  }

  private async mapNewChangedRoomsToRfc(
    hotelId: string,
    changedRooms: RoomUnit[],
    rfcId: string,
    roomProductIdPerRoomUnitId: Map<string, string>
  ) {
    const newRoomUnitIds = new Set<string>();
    for (const changedRoom of changedRooms) {
      const changedRoomId = changedRoom?.id;
      const oldMappingRfcId = roomProductIdPerRoomUnitId.get(changedRoomId);

      if (!oldMappingRfcId) {
        newRoomUnitIds.add(changedRoomId);
      }
    }

    // create room assign units
    if (newRoomUnitIds.size > 0) {
      const assignedUnitsToCreate = Array.from(newRoomUnitIds).map((newRoomUnitId) => ({
        roomProductId: rfcId,
        roomUnitId: newRoomUnitId
      }));

      await this.roomProductAssignedUnitRepository
        .createQueryBuilder()
        .insert()
        .into(RoomProductAssignedUnit)
        .values(assignedUnitsToCreate)
        .orIgnore()
        .execute();
    }
  }

  private async updateRfcContainAllOldChangedRooms(
    hotelId: string,
    changedRooms: RoomUnit[],
    rfcId: string
  ) {
    const sampleRoomUnit = changedRooms[0];
    const roomHotelRetailFeatureList = sampleRoomUnit.roomUnitRetailFeatures?.map((rhrf) => {
      return {
        ...rhrf?.retailFeature,
        quantity: rhrf?.quantity
      };
    });

    // DON'T RUN CONCURRENTLY THIS BECAUSE LOGIC DEPENDENCY BETWEEN THEM
    await this.deleteOldRateAdjustment(hotelId, roomHotelRetailFeatureList, rfcId);
    await this.deleteRfcRetailFeatures(hotelId, rfcId);
    await this.createRfcRetailFeatures(hotelId, rfcId, roomHotelRetailFeatureList);

    const rfcContainChangedRoom = await this.roomProductRepository.findOne({
      where: {
        id: rfcId,
        type: RoomProductType.RFC,
        deletedAt: IsNull()
      }
    });

    if (rfcContainChangedRoom) {
      await this.roomProductRepository.update(rfcId, {
        featureString: sampleRoomUnit?.featureString
      });
    }
  }

  private async createRfcRetailFeatures(
    hotelId: string,
    rfcId: string,
    roomHotelRetailFeatureList: HotelRetailFeature[]
  ) {
    await this.roomProductRetailFeatureRepository.save(
      roomHotelRetailFeatureList?.map((rhrf) => ({
        hotelId,
        roomProductId: rfcId,
        retailFeatureId: rhrf?.id,
        quantity: rhrf?.['quantity']
      }))
    );
  }

  private async deleteRfcRetailFeatures(hotelId: string, rfcId: string) {
    await this.roomProductRetailFeatureRepository.delete({
      hotelId,
      roomProductId: rfcId
    });
  }

  private async deleteOldRateAdjustment(
    hotelId: string,
    roomHotelRetailFeatureList: HotelRetailFeature[],
    rfcId: string
  ) {
    const oldRetailFeatureList = await this.roomProductRetailFeatureRepository.find({
      where: {
        hotelId,
        roomProductId: rfcId,
        quantity: MoreThanOrEqual(1)
      }
    });

    const toBeAssignedHotelRetailFeatureIdList = roomHotelRetailFeatureList?.filter(
      (rhrf) => !oldRetailFeatureList?.some((rhrf2) => rhrf2?.retailFeatureId === rhrf?.id)
    );

    const featureIdsToDelete = new Set<string>();
    for (const toBeDeleteRfcRateAdjustment of toBeAssignedHotelRetailFeatureIdList || []) {
      featureIdsToDelete.add(toBeDeleteRfcRateAdjustment?.id);
    }

    await this.roomProductFeatureRateAdjustmentRepository.delete({
      hotelId,
      roomProductId: rfcId,
      featureId: In(Array.from(featureIdsToDelete))
    });
  }

  private async isChangedRoomsContainAllRoomsOfRfc(changedRooms: RoomUnit[], rfcId: string) {
    const roomProduct = await this.roomProductRepository.findOne({
      where: {
        id: rfcId,
        type: RoomProductType.RFC,
        deletedAt: IsNull()
      },
      relations: {
        roomProductAssignedUnits: {
          roomUnit: true
        }
      }
    });
    if (roomProduct?.roomProductAssignedUnits?.length !== changedRooms?.length) {
      return false;
    }

    let roomProductIds = changedRooms.flatMap((changedRoom) =>
      changedRoom?.roomProductAssignedUnits
        ?.filter((e) => e?.roomProduct?.type === RoomProductType.RFC)
        ?.map((rpa) => rpa?.roomProductId)
    );
    roomProductIds = Array.from(new Set(roomProductIds));

    if (roomProductIds.length === 1 && roomProductIds[0] === rfcId) {
      return true;
    }

    return false;
  }

  private async generateRfcByChangedRooms(
    changedRooms: RoomUnit[],
    uniqueExistingRoomProductsRfcCodes: string[]
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const sampleRoomUnit = changedRooms[0];
      const code = await this.generateRfcCode(RoomProductType.RFC, sampleRoomUnit?.hotelId);

      const roomProductData = {
        hotelId: sampleRoomUnit?.hotelId,
        code,
        name: code,
        featureString: sampleRoomUnit?.featureString,
        type: RoomProductType.RFC,
        rfcAllocationSetting: RfcAllocationSetting.DEDUCT,
        status: RoomProductStatus.DRAFT,
        distributionChannel: [
          DistributionChannel.GV_SALES_ENGINE,
          DistributionChannel.GV_VOICE
          // DistributionChannel.SITEMINDER
        ],
        basePriceMode: BasePriceMode.FEATURE_BASED,
        numberOfBedrooms: 1 // default number of bedrooms is 1
      };

      const roomProduct = manager.getRepository(RoomProduct).create(roomProductData);
      const saved = await manager.getRepository(RoomProduct).save(roomProduct);
      uniqueExistingRoomProductsRfcCodes.push(code);

      const roomProductBasePriceSetting = manager
        .getRepository(RoomProductBasePriceSetting)
        .create({
          hotelId: sampleRoomUnit?.hotelId,
          roomProductId: saved.id,
          mode: RoomProductBasePriceSettingModeEnum.FEATURE_BASED
        });
      await manager.getRepository(RoomProductBasePriceSetting).save(roomProductBasePriceSetting);

      // create retail features
      const retailFeatureIds = new Set(
        sampleRoomUnit.roomUnitRetailFeatures?.map((rhrf) => rhrf?.retailFeatureId)
      );

      // create assigned units
      const changedRoomsSet = new Set(changedRooms?.map((changedRoom) => changedRoom?.id));
      const assignedUnits = Array.from(changedRoomsSet).map((changedRoomId) => ({
        roomProductId: saved.id,
        roomUnitId: changedRoomId
      }));

      if (retailFeatureIds?.size > 0) {
        // clean up old product features:
        await manager.getRepository(RoomProductRetailFeature).delete({
          roomProductId: saved.id
        });

        // add new product features
        const roomUnitRetailFeatures = sampleRoomUnit.roomUnitRetailFeatures || [];
        const roomUnitRetailFeaturesMap = new Map(
          roomUnitRetailFeatures.map((rhrf) => [rhrf?.retailFeatureId, rhrf])
        );
        await manager.getRepository(RoomProductRetailFeature).save(
          Array.from(retailFeatureIds).map((id) => ({
            hotelId: sampleRoomUnit?.hotelId,
            roomProductId: saved.id,
            retailFeatureId: id,
            quantity: roomUnitRetailFeaturesMap.get(id)?.quantity
          }))
        );
      }

      if (assignedUnits?.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(RoomProductAssignedUnit)
          .values(assignedUnits)
          .orIgnore()
          .execute();
      }

      // Add default hotel standard features
      const hotelStandardFeatures = await manager.getRepository(HotelStandardFeature).find({
        where: { hotelId: sampleRoomUnit?.hotelId }
      });

      if (hotelStandardFeatures.length > 0) {
        const newRoomProductStandardFeatures = hotelStandardFeatures.map((feature) =>
          manager.getRepository(RoomProductStandardFeature).create({
            hotelId: sampleRoomUnit?.hotelId,
            roomProductId: saved.id,
            standardFeatureId: feature.id
          })
        );
        await manager
          .getRepository(RoomProductStandardFeature)
          .save(newRoomProductStandardFeatures);
      }

      return saved;
    });
  }

  /**
   * Sets the average space for RFC room products based on assigned rooms.
   * Equivalent to Java setAverageSpace method.
   */
  private async setAverageSpace(allChangedRooms: RoomUnit[], hotelId: string) {
    // Get changed room IDs
    const changedRoomIdList = allChangedRooms.map((room) => room?.id).filter(Boolean);

    if (changedRoomIdList.length === 0) {
      return;
    }

    // Find RFC rooms that contain the changed room IDs
    const rfcRoomList = await this.roomProductAssignedUnitRepository.find({
      where: {
        roomUnitId: In(changedRoomIdList)
      },
      relations: {
        roomProduct: true
      },
      select: {
        roomUnitId: true,
        roomProductId: true,
        roomProduct: {
          id: true,
          type: true
        }
      }
    });

    // Filter only RFC type room products
    const rfcRoomListFiltered = rfcRoomList.filter(
      (rfcRoom) => rfcRoom.roomProduct?.type === RoomProductType.RFC
    );

    if (rfcRoomListFiltered.length === 0) {
      return;
    }

    // Get unique RFC IDs that need to be updated
    const updatedRfcList = Array.from(
      new Set(rfcRoomListFiltered.map((rfcRoom) => rfcRoom.roomProductId))
    );

    // Get all RFC rooms for the updated RFCs
    const allRfcRooms = await this.roomProductAssignedUnitRepository.find({
      where: {
        roomProductId: In(updatedRfcList)
      },
      relations: {
        roomProduct: true,
        roomUnit: true
      },
      select: {
        roomUnitId: true,
        roomProductId: true,
        roomProduct: {
          id: true,
          type: true
        },
        roomUnit: {
          id: true,
          space: true
        }
      }
    });

    // Get all hotel rooms for space calculation
    const hotelRoomList = await this.roomUnitRepository.find({
      where: {
        hotelId,
        deletedAt: IsNull()
      },
      select: {
        id: true,
        space: true
      }
    });

    // Create a map for quick room space lookup
    const roomSpaceMap = new Map<string, number>();
    hotelRoomList.forEach((room) => {
      if (room?.id && room?.space != null) {
        roomSpaceMap.set(room.id, room.space);
      }
    });

    // Group RFC rooms by RFC ID
    const rfcRoomsByRfcId = new Map<string, typeof allRfcRooms>();
    allRfcRooms.forEach((rfcRoom) => {
      const rfcId = rfcRoom?.roomProductId;
      if (rfcId) {
        if (!rfcRoomsByRfcId.has(rfcId)) {
          rfcRoomsByRfcId.set(rfcId, []);
        }
        rfcRoomsByRfcId.get(rfcId)?.push(rfcRoom);
      }
    });

    // Calculate and update average space for each RFC
    const updatePromises: Promise<any>[] = [];

    rfcRoomsByRfcId.forEach((rfcRooms, rfcId) => {
      if (rfcRooms?.length > 0) {
        // Get assigned room IDs for this RFC
        const assignedRoomIdList = rfcRooms.map((rfcRoom) => rfcRoom?.roomUnitId).filter(Boolean);

        // Get spaces for assigned rooms
        const assignedRoomSpaces = assignedRoomIdList
          .map((roomId) => roomSpaceMap.get(roomId))
          .filter((space): space is number => space != null && space > 0);

        // Calculate average space
        let averageSpace = 0;
        if (assignedRoomSpaces.length > 0) {
          const totalSpace = assignedRoomSpaces.reduce(
            (sum, space) => (sum || 0) + (space || 0),
            0
          );
          averageSpace = Math.round((totalSpace || 0) / assignedRoomSpaces.length);
        }

        // Update RFC with average space
        updatePromises.push(this.roomProductRepository.update(rfcId, { space: averageSpace }));
      }
    });

    // Execute all updates in parallel
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
  }

  /**
   * Determines what operations need to be performed for remapping changed rooms.
   * Returns the operations without executing them (for bulk processing).
   */
  private reMapChangedRoomsToRfc(
    changedRooms: RoomUnit[],
    matchedFstrRfc: RoomProduct,
    roomProductIdPerRoomUnitId: Map<string, string>
  ) {
    const deletedRoomProductIds = new Set<string>();
    const deleteAssignedUnitIds = new Set<string>();
    const deleteAssignedProductUnitIds: { roomProductId: string; roomUnitId: string }[] = [];
    const newAssignedUnits: any[] = [];

    for (const changedRoom of changedRooms) {
      const oldMappingRfcId = roomProductIdPerRoomUnitId.get(changedRoom?.id);

      if (!oldMappingRfcId) {
        // New room unit - needs to be assigned
        newAssignedUnits.push({
          roomProductId: matchedFstrRfc?.id,
          roomUnitId: changedRoom?.id
        });
      } else if (oldMappingRfcId !== matchedFstrRfc?.id) {
        // Room unit needs to be remapped from old RFC to new RFC
        deletedRoomProductIds.add(oldMappingRfcId);
        deleteAssignedUnitIds.add(changedRoom?.id);
        deleteAssignedProductUnitIds.push({
          roomProductId: oldMappingRfcId,
          roomUnitId: changedRoom?.id
        });

        newAssignedUnits.push({
          roomProductId: matchedFstrRfc?.id,
          roomUnitId: changedRoom?.id
        });
      }
      // else: room is already correctly mapped, no action needed
    }

    return {
      deletedRoomProductIds,
      deleteAssignedUnitIds,
      deleteAssignedProductUnitIds,
      newAssignedUnits
    };
  }
}
