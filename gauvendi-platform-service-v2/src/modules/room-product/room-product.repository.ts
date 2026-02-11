import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from '@src/core/constants/db.const';
import { Filter } from '@src/core/dtos/common.dto';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductBasePriceSetting } from '@src/core/entities/room-product-base-price-setting.entity';
import { RoomProductExtraOccupancyRate } from '@src/core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProductImage } from '@src/core/entities/room-product-image.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import {
  DistributionChannel,
  HotelRetailFeatureStatusEnum,
  RoomProductStatus,
  RoomProductType
} from '@src/core/enums/common';
import { BadRequestException } from '@src/core/exceptions';
import { QueryBuilderUtils } from '@src/core/utils/query-builder.utils';
import {
  Brackets,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  MoreThanOrEqual,
  Not,
  Repository
} from 'typeorm';
import { HotelRepository } from '../hotel/repositories/hotel.repository';
import { RoomProductFilterDto } from './room-product.dto';

@Injectable()
export class RoomProductRepository {
  constructor(
    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomProductDailyAvailability, DB_NAME.POSTGRES)
    private readonly roomProductDailyAvailabilityRepository: Repository<RoomProductDailyAvailability>,

    @InjectRepository(RoomProductAssignedUnit, DB_NAME.POSTGRES)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,

    @InjectRepository(RoomProductImage, DB_NAME.POSTGRES)
    private readonly roomProductImageRepository: Repository<RoomProductImage>,

    @InjectRepository(RoomProductRetailFeature, DB_NAME.POSTGRES)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(RoomProductStandardFeature, DB_NAME.POSTGRES)
    private readonly roomProductStandardFeatureRepository: Repository<RoomProductStandardFeature>,

    @InjectRepository(RoomProductMappingPms, DB_NAME.POSTGRES)
    private readonly roomProductMappingPmsRepository: Repository<RoomProductMappingPms>,

    @InjectRepository(RoomUnit, DB_NAME.POSTGRES)
    private readonly roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(RoomProductExtraOccupancyRate, DB_NAME.POSTGRES)
    private readonly roomProductExtraOccupancyRateRepository: Repository<RoomProductExtraOccupancyRate>,

    @InjectRepository(RoomProductMapping, DB_NAME.POSTGRES)
    private readonly roomProductMappingRepository: Repository<RoomProductMapping>,

    @InjectRepository(RoomProductBasePriceSetting, DB_NAME.POSTGRES)
    private readonly roomProductBasePriceSettingRepository: Repository<RoomProductBasePriceSetting>,

    @InjectRepository(HotelRetailFeature, DB_NAME.POSTGRES)
    private readonly hotelRetailFeatureRepository: Repository<HotelRetailFeature>,

    private readonly hotelRepository: HotelRepository
  ) {}

  async findAll(filter: RoomProductFilterDto, select?: string[]): Promise<RoomProduct[]> {
    try {
      const { relations, order } = Filter.buildCondition<RoomProduct, RoomProductFilterDto>(filter);

      // Create QueryBuilder
      let queryBuilder = this.roomProductRepository.createQueryBuilder('roomProduct');

      // Add relations
      if (relations) {
        Object.keys(relations).forEach((relation) => {
          queryBuilder = queryBuilder.leftJoinAndSelect(`roomProduct.${relation}`, relation);
        });
      }

      // Hotel condition
      const hotel = await this.hotelRepository.getHotelByIdOrCode(filter.hotelId, filter.hotelCode);
      if (hotel && hotel.id) {
        queryBuilder = queryBuilder.andWhere('roomProduct.hotelId = :hotelId', {
          hotelId: hotel.id
        });
      }

      // ID conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.id',
        filter.idList,
        'idList'
      );
      queryBuilder = QueryBuilderUtils.setNotEqualOrNotInQuery(
        queryBuilder,
        'roomProduct.id',
        filter.excludeIdList,
        'excludeIdList'
      );

      // Code conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.code',
        filter.codeList,
        'codeList'
      );

      // Status conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.status',
        filter.statusList,
        'statusList'
      );

      // RFC Allocation Setting conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.rfcAllocationSetting',
        filter.roomProductAllocationSettingList,
        'allocationSettings'
      );

      // Type conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.type',
        filter.typeList,
        'typeList'
      );

      // Travel Tag LIKE conditions
      if (filter.travelTagList && filter.travelTagList.length > 0) {
        queryBuilder = QueryBuilderUtils.addArrayFieldLikeConditions(
          queryBuilder,
          'roomProduct.travelTag',
          filter.travelTagList,
          'travelTag'
        );
      }

      // Occasion LIKE conditions
      if (filter.occasionList && filter.occasionList.length > 0) {
        queryBuilder = QueryBuilderUtils.addArrayFieldLikeConditions(
          queryBuilder,
          'roomProduct.occasion',
          filter.occasionList,
          'occasion'
        );
      }

      // Distribution Channel LIKE conditions
      // if (filter.distributionChannelList && filter.distributionChannelList.length > 0) {
      //   queryBuilder = QueryBuilderUtils.addArrayFieldLikeConditions(
      //     queryBuilder,
      //     'roomProduct.distributionChannel',
      //     filter.distributionChannelList.map(String), // Convert enum to string
      //     'distributionChannel'
      //   );
      // }

      if (filter.distributionChannelList && filter.distributionChannelList.length > 0) {
        queryBuilder.andWhere('roomProduct.distributionChannel && ARRAY[:...distributionChannel]', {
          distributionChannel: filter.distributionChannelList
        });
      }

      // Apply ordering
      if (order) {
        Object.entries(order).forEach(([field, direction]) => {
          queryBuilder = queryBuilder.addOrderBy(
            `roomProduct.${field}`,
            direction as 'ASC' | 'DESC'
          );
        });
      }

      return queryBuilder.select(select as string[]).getMany();
    } catch (error) {
      console.log('Failed to find room product (roomProductRepository.findAll)', error);
      throw new BadRequestException(
        'Failed to find room product (roomProductRepository.findAll)',
        error.message
      );
    }
  }

  async findImages(
    filter: { roomProductIds?: string[]; hotelId?: string },
    select?: FindOptionsSelect<RoomProductImage>
  ): Promise<RoomProductImage[]> {
    try {
      const { roomProductIds, hotelId } = filter;
      const where: FindOptionsWhere<RoomProductImage> = {};
      if (roomProductIds && roomProductIds.length > 0) {
        where.roomProductId = In(roomProductIds);
      }
      // if (hotelId) {
      //   where.hotelId = hotelId;
      // }
      return this.roomProductImageRepository.find({
        where,
        select
      });
    } catch (error) {
      console.log('Failed to find room product images (roomProductRepository.findImages)', error);
      throw new BadRequestException(
        'Failed to find room product images (roomProductRepository.findImages)',
        error.message
      );
    }
  }

  async findRetailFeatures(
    filter: {
      ids?: string[];
      roomProductIds?: string[];
      retailFeatureIds?: string[];
      hotelId?: string;
      isHasBaseRate?: boolean;
      relations?: FindOptionsRelations<RoomProductRetailFeature>;
    },
    select?: FindOptionsSelect<RoomProductRetailFeature>
  ): Promise<RoomProductRetailFeature[]> {
    try {
      const { roomProductIds, retailFeatureIds, hotelId, isHasBaseRate, ids } = filter;
      const where: FindOptionsWhere<RoomProductRetailFeature> = {
        quantity: MoreThanOrEqual(1),
        retailFeature: {
          status: HotelRetailFeatureStatusEnum.ACTIVE
        }
      };
      let relations: FindOptionsRelations<RoomProductRetailFeature> = {
        ...filter.relations
      };
      if (roomProductIds && roomProductIds.length > 0) {
        where.roomProductId = In(roomProductIds);
      }
      if (retailFeatureIds && retailFeatureIds.length > 0) {
        where.retailFeatureId = In(retailFeatureIds);
      }
      if (hotelId) {
        where.hotelId = hotelId;
      }

      if (ids && ids.length > 0) {
        where.id = In(ids);
      }

      if (isHasBaseRate) {
        relations = {
          ...relations,
          retailFeature: true
        };
        where.retailFeature = {
          status: HotelRetailFeatureStatusEnum.ACTIVE,
          baseRate: Not(IsNull())
        };
      }
      return this.roomProductRetailFeatureRepository.find({
        where,
        select,
        relations
      });
    } catch (error) {
      console.log(
        'Failed to find room product features (roomProductRepository.findRetailFeatures)',
        error
      );
      throw new BadRequestException(
        'Failed to find room product features (roomProductRepository.findRetailFeatures)',
        error.message
      );
    }
  }

  async findStandardFeatures(
    filter: {
      roomProductIds?: string[];
      hotelId?: string;
      relations?: FindOptionsRelations<RoomProductStandardFeature>;
    },
    select?: FindOptionsSelect<RoomProductStandardFeature>
  ): Promise<RoomProductStandardFeature[]> {
    try {
      const { roomProductIds, hotelId, relations } = filter;
      const where: FindOptionsWhere<RoomProductStandardFeature> = {};
      if (roomProductIds && roomProductIds.length > 0) {
        where.roomProductId = In(roomProductIds);
      }
      if (hotelId) {
        where.hotelId = hotelId;
      }
      return this.roomProductStandardFeatureRepository.find({
        where,
        select,
        relations
      });
    } catch (error) {
      console.log(
        'Failed to find room product standard features (roomProductRepository.findStandardFeatures)',
        error
      );
      throw new BadRequestException(
        'Failed to find room product standard features (roomProductRepository.findStandardFeatures)',
        error.message
      );
    }
  }

  async find(
    filter: {
      hotelId?: string;
      roomProductIds?: string[];
      totalAdult?: number;
      totalChildren?: number;
      totalPets?: number;
      name?: string;
      featureCodes?: string[];
      requestedCapacity?: number;
      numberOfBedrooms?: number;
      types?: RoomProductType[];
      status?: RoomProductStatus[];
      isSellable?: boolean;
      distributionChannels?: DistributionChannel[];
      isHasAssignedUnits?: boolean;
      relations?: FindOptionsRelations<RoomProduct>;
    },
    select?: string[]
  ) {
    const keys = Object.keys(filter);
    if (keys.length === 0) {
      throw new BadRequestException('Filter is required');
    }

    const {
      totalAdult,
      totalChildren,
      totalPets,
      requestedCapacity,
      numberOfBedrooms,
      hotelId,
      roomProductIds,
      types,
      name,
      featureCodes,
      isSellable,
      status,
      distributionChannels,
      isHasAssignedUnits,
      relations
    } = filter;

    const queryBuilder = this.roomProductRepository.createQueryBuilder('roomProduct');
    queryBuilder.where('roomProduct.deletedAt IS NULL');
    if (hotelId) {
      queryBuilder.andWhere('roomProduct.hotelId = :hotelId', { hotelId });
    }
    if (roomProductIds && roomProductIds.length > 0) {
      queryBuilder.andWhere('roomProduct.id IN (:...roomProductIds)', {
        roomProductIds
      });
    }
    if (status && status.length > 0) {
      queryBuilder.andWhere('roomProduct.status IN (:...status)', { status });
    }

    if (name) {
      queryBuilder.andWhere('roomProduct.name ILIKE :name', { name: `%${name}%` });
    }
    // if (isSellable) {
    //   queryBuilder.andWhere('roomProduct.isSellable = :isSellable', { isSellable });
    // }
    if (distributionChannels && distributionChannels.length > 0) {
      queryBuilder.andWhere('roomProduct.distributionChannel && ARRAY[:...distributionChannels]', {
        distributionChannels
      });
    }

    if (isHasAssignedUnits !== undefined && isHasAssignedUnits !== null) {
      if (isHasAssignedUnits) {
        queryBuilder.andWhere(
          `EXISTS (
          SELECT 1
          FROM room_product_assigned_unit rpa
          WHERE rpa.room_product_id = "roomProduct"."id"
        )`
        );
      } else {
        queryBuilder.andWhere(
          `NOT EXISTS (
          SELECT 1
          FROM room_product_assigned_unit rpa
          WHERE rpa.room_product_id = "roomProduct"."id"
        )`
        );
      }
    }

    if (featureCodes && featureCodes.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(
            `EXISTS (
              SELECT 1
              FROM room_product_retail_feature rprf
              JOIN hotel_retail_feature rf ON rf.id = rprf.retail_feature_id
              WHERE rprf.room_product_id = "roomProduct"."id"
                AND rf.code IN (:...retailFeatureCodes)
                AND rprf.quantity >= 1
                AND rprf.quantity IS NOT NULL
            )`,
            { retailFeatureCodes: featureCodes }
          ).orWhere(
            `EXISTS (
              SELECT 1
              FROM room_product_standard_feature rpsf
              JOIN hotel_standard_feature sf ON sf.id = rpsf.standard_feature_id
              WHERE rpsf.room_product_id = "roomProduct"."id"
                AND sf.code IN (:...standardFeatureCodes)
            )`,
            { standardFeatureCodes: featureCodes }
          );
        })
      );
    }

    if (types && types.length > 0) {
      queryBuilder.andWhere('roomProduct.type IN (:...types)', { types });
    }

    if (numberOfBedrooms && numberOfBedrooms > 0) {
      if (requestedCapacity) {
        queryBuilder.andWhere(
          '(roomProduct.capacityDefault + roomProduct.capacityExtra) >= :requestedCapacity',
          {
            requestedCapacity
          }
        );
      }

      if (totalAdult) {
        queryBuilder.andWhere(
          '(roomProduct.maximumAdult + roomProduct.extraBedAdult) >= :totalAdult',
          { totalAdult }
        );
      }

      if (totalChildren) {
        queryBuilder.andWhere(
          '(roomProduct.maximumKid + roomProduct.extraBedKid) >= :totalChildren',
          {
            totalChildren
          }
        );
      }

      if (totalPets) {
        queryBuilder.andWhere('roomProduct.maximumPet >= :totalPets', { totalPets });
      }

      queryBuilder.andWhere('roomProduct.numberOfBedrooms >= :numberOfBedrooms', {
        numberOfBedrooms
      });
    }

    if (select) {
      queryBuilder.select(select);
    }

    return queryBuilder.getMany();
  }

  async findOne(
    filter: {
      hotelId?: string;
      roomProductId?: string;
    },
    select?: FindOptionsSelect<RoomProduct>
  ): Promise<RoomProduct | null> {
    const { hotelId, roomProductId } = filter;
    const where: FindOptionsWhere<RoomProduct> = {};
    if (hotelId) {
      where.hotelId = hotelId;
    }
    if (roomProductId) {
      where.id = roomProductId;
    }
    return this.roomProductRepository.findOne({
      where,
      select
    });
  }

  async findMatchingPercentage(filter: {
    roomProductIds?: string[];
    featureCodes?: string[];
    hotelId?: string;
  }): Promise<
    {
      roomProductId: string;
      matchingPercentage: number;
      features: any[];
    }[]
  > {
    const { roomProductIds, featureCodes, hotelId } = filter;

    // Nếu không có featureCodes hoặc featureCodes rỗng, trả về array 0
    if (
      !featureCodes ||
      featureCodes.length === 0 ||
      !roomProductIds ||
      roomProductIds?.length === 0
    ) {
      return [];
    }

    const where: FindOptionsWhere<RoomProduct> = {};
    if (roomProductIds && roomProductIds.length > 0) {
      where.id = In(roomProductIds);
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }

    const hotelRetailFeatures = await this.hotelRetailFeatureRepository.find({
      where: {
        code: In(featureCodes)
      },
      relations: ['hotelRetailCategory'],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        hotelRetailCategory: {
          displaySequence: true
        }
      }
    });
    const hotelRetailFeaturesMap = new Map<string, HotelRetailFeature>(
      hotelRetailFeatures.map((item) => [item.code, item])
    );

    // Query để lấy tất cả feature codes của các room products
    // Lấy retail feature codes
    const retailFeatures = await this.roomProductRetailFeatureRepository.find({
      where: {
        roomProductId: In(roomProductIds),
        quantity: MoreThanOrEqual(1)
      },
      relations: ['retailFeature'],
      select: {
        roomProductId: true,
        retailFeature: {
          code: true
        }
      }
    });

    // // Lấy standard feature codes
    // const standardFeatures = await this.roomProductStandardFeatureRepository.find({
    //   where: {
    //     roomProductId: In(roomProductIds)
    //   },
    //   relations: ['standardFeature'],
    //   select: {
    //     roomProductId: true,
    //     standardFeature: {
    //       code: true
    //     }
    //   }
    // });

    // Nhóm feature codes theo roomProductId
    const featureCodesByRoomProduct = new Map<string, Set<string>>();

    // Xử lý retail features
    retailFeatures.forEach((feature) => {
      const roomProductId = feature.roomProductId;
      const code = feature.retailFeature?.code;
      if (roomProductId && code) {
        if (!featureCodesByRoomProduct.has(roomProductId)) {
          featureCodesByRoomProduct.set(roomProductId, new Set());
        }
        featureCodesByRoomProduct.get(roomProductId)!.add(code);
      }
    });

    // // Xử lý standard features
    // standardFeatures.forEach((feature) => {
    //   const roomProductId = feature.roomProductId;
    //   const code = feature.standardFeature?.code;
    //   if (roomProductId && code) {
    //     if (!featureCodesByRoomProduct.has(roomProductId)) {
    //       featureCodesByRoomProduct.set(roomProductId, new Set());
    //     }
    //     featureCodesByRoomProduct.get(roomProductId)!.add(feature.standardFeature);
    //   }
    // });

    // Tính matching percentage cho mỗi room product
    const matchingPercentages: {
      roomProductId: string;
      matchingPercentage: number;
      features: any[];
    }[] = [];
    const featureCodesSet = new Set(featureCodes);

    roomProductIds.forEach((roomProductId) => {
      const roomProductFeatureCodes =
        featureCodesByRoomProduct.get(roomProductId) || new Set<string>();

      // Đếm số lượng feature codes match
      let matchCount = 0;
      const matchedCodes: string[] = [];
      featureCodesSet.forEach((code) => {
        if (roomProductFeatureCodes.has(code)) {
          matchedCodes.push(code);
          matchCount++;
        }
      });

      // Tính percentage
      const percentage = featureCodes.length > 0 ? matchCount / featureCodes.length : 0;
      matchingPercentages.push({
        roomProductId,
        matchingPercentage: percentage,
        features: featureCodes.map((code: string) => {
          const feature = hotelRetailFeaturesMap.get(code);
          const isMatched = matchedCodes.includes(code);
          return {
            id: feature?.id,
            code: feature?.code,
            name: feature?.name,
            description: feature?.description,
            matched: isMatched,
            hotelRetailCategoryDisplaySequence: feature?.hotelRetailCategory?.displaySequence
          };
        })
      });
    });

    return matchingPercentages;
  }
  async findAvailabilities(filter: {
    hotelId?: string;
    roomProductIds?: string[];
    dates?: string[];
    relations?: FindOptionsRelations<RoomProductDailyAvailability>;
    order?: FindOptionsOrder<RoomProductDailyAvailability>;
  }): Promise<RoomProductDailyAvailability[]> {
    const { hotelId, roomProductIds, dates, relations, order } = filter;
    const where: FindOptionsWhere<RoomProductDailyAvailability> = {
      deletedAt: IsNull()
    };
    if (dates && dates.length > 0) {
      where.date = In(dates);
    }

    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }

    if (hotelId) {
      where.hotelId = hotelId;
    }

    return this.roomProductDailyAvailabilityRepository.find({
      where,
      relations,
      order
    });
  }

  async findAssignedUnits(
    filter: {
      roomUnitIds?: string[];
      roomProductIds?: string[];
      roomNumber?: string;
      roomProductTypes?: RoomProductType[];
      roomProductStatus?: RoomProductStatus[];
      relations?: FindOptionsRelations<RoomProductAssignedUnit>;
      order?: FindOptionsOrder<RoomProductAssignedUnit>;
    },
    select?: FindOptionsSelect<RoomProductAssignedUnit>
  ): Promise<RoomProductAssignedUnit[]> {
    const {
      roomUnitIds,
      roomProductIds,
      roomNumber,
      roomProductTypes,
      roomProductStatus,
      relations,
      order
    } = filter;
    const where: FindOptionsWhere<RoomProductAssignedUnit> = {};
    if (roomUnitIds && roomUnitIds.length > 0) {
      where.roomUnitId = In(roomUnitIds);
    }
    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }
    if (roomNumber) {
      where.roomUnit = {
        roomNumber: ILike(`%${roomNumber}%`)
      };
    }

    const roomProductWhere: FindOptionsWhere<RoomProduct> = {};
    if (roomProductTypes && roomProductTypes.length > 0) {
      roomProductWhere.type = In(roomProductTypes);
    }
    if (roomProductStatus && roomProductStatus.length > 0) {
      roomProductWhere.status = In(roomProductStatus);
    }

    if (Object.keys(roomProductWhere).length > 0) {
      where.roomProduct = roomProductWhere;
    }

    return this.roomProductAssignedUnitRepository.find({
      where,
      relations,
      order,
      select
    });
  }

  async findRoomProductMappings(
    filter: {
      hotelId: string;
      roomProductIds?: string[];
      relatedRoomProductTypes?: RoomProductType[];
    },
    select?: FindOptionsSelect<RoomProductMapping>
  ): Promise<RoomProductMapping[]> {
    const { hotelId, roomProductIds, relatedRoomProductTypes } = filter;
    const where: FindOptionsWhere<RoomProductMapping> = {};
    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }
    if (relatedRoomProductTypes && relatedRoomProductTypes.length > 0) {
      where.relatedRoomProduct = {
        type: In(relatedRoomProductTypes)
      };
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }
    return this.roomProductMappingRepository.find({
      where,
      select
    });
  }

  async findRoomProductBasePriceSetting(
    filter: {
      hotelId?: string;
      roomProductIds?: string[];
    },
    select?: FindOptionsSelect<RoomProductBasePriceSetting>
  ): Promise<RoomProductBasePriceSetting[]> {
    const { hotelId, roomProductIds } = filter;
    const where: FindOptionsWhere<RoomProductBasePriceSetting> = {};
    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }
    return this.roomProductBasePriceSettingRepository.find({
      where,
      select
    });
  }

  async findMappingPms(
    filter: { hotelId: string; roomProductIds: string[] },
    select?: FindOptionsSelect<RoomProductMappingPms>
  ): Promise<RoomProductMappingPms[]> {
    const { hotelId, roomProductIds } = filter;

    return this.roomProductMappingPmsRepository.find({
      where: { hotelId, roomProductId: In(roomProductIds) },
      select
    });
  }

  async findRoomProductAndRoomUnitMappingPms(body: {
    hotelId: string;
    roomProductId: string;
    roomUnitIds: string[];
  }) {
    const { hotelId, roomProductId, roomUnitIds } = body;

    if (!hotelId || !roomProductId || !roomUnitIds) {
      throw new BadRequestException('hotelId, roomProductId and roomUnitId are required');
    }

    // find product type
    const roomProduct = await this.roomProductRepository.findOne({
      where: { hotelId, id: roomProductId },
      select: ['type']
    });

    // if type is MRFC, pms mapping in room product mapping pms
    if (roomProduct?.type === RoomProductType.MRFC) {
      const [roomProductMappingPms, roomUnit] = await Promise.all([
        this.roomProductMappingPmsRepository.findOne({
          where: { hotelId, roomProductId },
          select: ['roomProductMappingPmsCode']
        }),
        this.roomUnitRepository.find({
          where: { hotelId, id: In(roomUnitIds) },
          select: ['mappingPmsCode']
        })
      ]);

      return {
        roomProductMappingPmsCode: roomProductMappingPms?.roomProductMappingPmsCode,
        roomUnitMappingPmsCode: roomUnit.map((x) => x.mappingPmsCode)
      };
    }

    // if type is ERFC, find overlapping MRFC by room unit
    const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository.find({
      where: { roomUnitId: In(roomUnitIds) },
      select: ['roomUnitId']
    });

    const unitIds = roomProductAssignedUnits.map((x) => x.roomUnitId);

    // Find overlapping MRFC(s)
    const overlappingMrfc = await this.roomProductRepository
      .createQueryBuilder('r')
      .leftJoin('r.roomProductAssignedUnits', 'rpu')
      .where('rpu.roomUnitId IN (:...unitIds)', { unitIds })
      .andWhere('r.type = :type', { type: RoomProductType.MRFC })
      .andWhere('r.deletedAt IS NULL AND r.status = :status', { status: RoomProductStatus.ACTIVE })
      .select(['r.id'])
      .getOne();

    if (!overlappingMrfc) {
      throw new BadRequestException('No overlapping MRFC found for the selected product');
    }

    const [roomProductMappingPms, roomUnit] = await Promise.all([
      this.roomProductMappingPmsRepository.findOne({
        where: { hotelId, roomProductId: overlappingMrfc.id },
        select: ['roomProductMappingPmsCode']
      }),
      this.roomUnitRepository.find({
        where: { hotelId, id: In(roomUnitIds) },
        select: ['mappingPmsCode']
      })
    ]);

    return {
      roomProductMappingPmsCode: roomProductMappingPms?.roomProductMappingPmsCode,
      roomUnitMappingPmsCode: roomUnit.map((x) => x.mappingPmsCode)
    };
  }

  async findExtraOccupancyRates(
    filter: {
      roomProductIds?: string[];
      hotelId?: string;
      relations?: FindOptionsRelations<RoomProductExtraOccupancyRate>;
      order?: FindOptionsOrder<RoomProductExtraOccupancyRate>;
    },
    select?: FindOptionsSelect<RoomProductExtraOccupancyRate>
  ): Promise<RoomProductExtraOccupancyRate[]> {
    const { roomProductIds, hotelId, relations, order } = filter;
    const where: FindOptionsWhere<RoomProductExtraOccupancyRate> = {};
    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }
    return this.roomProductExtraOccupancyRateRepository.find({
      where,
      relations,
      order,
      select
    });
  }

  checkGuestCapacity(input: {
    roomProduct: RoomProduct;
    totalAdult?: number;
    totalChildren?: number;
    totalPets?: number;
    requestedCapacity?: number;
    numberOfBedrooms?: number;
  }): boolean {
    const {
      roomProduct,
      totalAdult,
      totalChildren,
      totalPets,
      requestedCapacity,
      numberOfBedrooms
    } = input;

    // Extract room product capacity values with null safety
    const rpCapacityDefault = roomProduct.capacityDefault ?? 0;
    const rpCapacityExtra = roomProduct.capacityExtra ?? 0;
    const rpMaximumAdult = roomProduct.maximumAdult ?? 0;
    const rpExtraBedAdult = roomProduct.extraBedAdult ?? 0;
    const rpMaximumKid = roomProduct.maximumKid ?? 0;
    const rpExtraBedKid = roomProduct.extraBedKid ?? 0;
    const rpMaximumPet = roomProduct.maximumPet ?? 0;
    const rpNumberOfBedrooms = roomProduct.numberOfBedrooms ?? 0;

    // Check total capacity (adults + children)
    if (requestedCapacity !== undefined && requestedCapacity !== null) {
      const totalCapacity = rpCapacityDefault + rpCapacityExtra;
      if (totalCapacity < requestedCapacity) {
        return false;
      }
    }

    // Check adult capacity
    if (totalAdult !== undefined && totalAdult !== null) {
      const totalAdultCapacity = rpMaximumAdult + rpExtraBedAdult;
      if (totalAdultCapacity < totalAdult) {
        return false;
      }
    }

    // Check children capacity
    if (totalChildren !== undefined && totalChildren !== null) {
      const totalChildrenCapacity = rpMaximumKid + rpExtraBedKid;
      if (totalChildrenCapacity < totalChildren) {
        return false;
      }
    }

    // Check pet capacity
    if (totalPets !== undefined && totalPets !== null) {
      if (rpMaximumPet < totalPets) {
        return false;
      }
    }

    // Check number of bedrooms
    if (numberOfBedrooms !== undefined && numberOfBedrooms !== null && numberOfBedrooms > 0) {
      if (rpNumberOfBedrooms < numberOfBedrooms) {
        return false;
      }
    }

    // All checks passed
    return true;
  }

  async getRoomProduct(body: { code: string; hotelId: string }) {
    try {
      const result = await this.roomProductRepository.findOne({
        where: { code: body.code, hotelId: body.hotelId }
      });

      return result;
    } catch (error) {
      throw new BadRequestException('Failed to get room product', error.message);
    }
  }

  async updateRoomProductAssignedUnits(roomProduct: RoomProduct, roomUnitIds: string[]) {
    const roomProductAssignedUnitsCount = roomProduct.roomProductAssignedUnits?.length || 0;
    const changedCount = roomUnitIds?.length;

    await this.roomProductAssignedUnitRepository.delete({ roomProductId: roomProduct.id });
    if (roomUnitIds?.length) {
      const roomProductAssignedUnits = roomUnitIds.map((roomUnitId) =>
        this.roomProductAssignedUnitRepository.create({
          roomProductId: roomProduct.id,
          roomUnitId
        })
      );
      await this.roomProductAssignedUnitRepository.save(roomProductAssignedUnits);
    }

    // handle room product mapping for MRFC/ERFC type
    if (roomProduct.type !== RoomProductType.RFC) {
      // delete room product mapping
      await this.roomProductMappingRepository.delete({ roomProductId: roomProduct.id });
      // find room product assigned units (for RFC type)
      const rfcRoomProductAssignedUnits = await this.roomProductAssignedUnitRepository.find({
        relations: {
          roomProduct: true
        },
        select: {
          roomProductId: true
        },
        where: {
          roomUnitId: In(roomUnitIds),
          roomProduct: {
            type: RoomProductType.RFC
          }
        }
      });

      const input: {
        roomProductId: string;
        relatedRoomProductId: string;
        hotelId: string;
      }[] = [];

      for (const rfcRoomProductAssignedUnit of rfcRoomProductAssignedUnits) {
        if (
          input.some((x) => x.relatedRoomProductId === rfcRoomProductAssignedUnit.roomProductId)
        ) {
          continue;
        }

        input.push({
          roomProductId: roomProduct.id,
          relatedRoomProductId: rfcRoomProductAssignedUnit.roomProductId,
          hotelId: roomProduct.hotelId
        });
      }

      await this.roomProductMappingRepository.save(input);
    }

    // check changed room unit ids
    return changedCount !== roomProductAssignedUnitsCount;
  }
}
