import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { RoomUnitRetailFeature } from '@src/core/entities/room-unit-retail-feature.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { Queue } from 'bullmq';
import { AdminResponseDto, MasterTemplateResponse } from 'src/core/admin-service/admin.dto';
import { AdminService } from 'src/core/admin-service/admin.service';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelRetailCategory } from 'src/core/entities/hotel-retail-category.entity';
import { HotelRetailFeatureTranslation } from 'src/core/entities/hotel-retail-feature-translation.entity';
import {
  HotelRetailFeature,
  HotelRetailFeatureStatusEnum
} from 'src/core/entities/hotel-retail-feature.entity';
import { HotelStandardFeatureTranslation } from 'src/core/entities/hotel-standard-feature-translation.entity';
import { HotelStandardFeature } from 'src/core/entities/hotel-standard-feature.entity';
import { RoomProductStandardFeature } from 'src/core/entities/room-product-standard-feature.entity';
import { JOB_NAMES, QUEUE_NAMES } from 'src/core/queue/queue.constant';
import {
  DataSource,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  IsNull,
  MoreThan,
  Repository
} from 'typeorm';
import { ProcessRoomProductPricingDto } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.dto';
import { HotelFeatureFilterDto, HotelRetailFeatureDto } from './dtos/hotel-feature-filter.dto';
import {
  ActionRetailFeatureForEnum,
  BulkCreateRetailFeatureDto,
  BulkCreateStandardFeatureDto,
  BulkUpdateRetailFeaturesDto,
  DeleteRetailFeatureDto,
  GetHotelRetailCategoriesDto,
  GetHotelRetailFeaturesDto,
  GetStandardFeaturesDto,
  PaginatedResponse,
  UpdateCategoryPriceWeightDto,
  UpdateRetailInfoDto,
  UpdateRetailVisibilityDto,
  UpdateStandardInfoDto
} from './feature.dto';
import { HotelRetailCategoryTranslation } from '@src/core/entities/hotel-retail-category-translation.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelConfigurationRepository } from '../hotel-configuration/hotel-configuration.repository';
import {
  HotelConfigurationTypeEnum,
  LanguageCodeEnum,
  RoomProductType
} from '@src/core/enums/common';
import { v4 as uuidv4 } from 'uuid';
import { RoomProductService } from '../room-product/room-product.service';

@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  constructor(
    @InjectRepository(HotelRetailCategory, DbName.Postgres)
    private readonly hotelRetailCategoryRepository: Repository<HotelRetailCategory>,

    @InjectRepository(HotelRetailFeature, DbName.Postgres)
    private readonly hotelRetailFeatureRepository: Repository<HotelRetailFeature>,

    @InjectRepository(HotelRetailFeatureTranslation, DbName.Postgres)
    private readonly hotelRetailFeatureTranslationRepository: Repository<HotelRetailFeatureTranslation>,

    @InjectRepository(HotelRetailCategoryTranslation, DbName.Postgres)
    private readonly hotelRetailCategoryTranslationRepository: Repository<HotelRetailCategoryTranslation>,

    @InjectRepository(HotelStandardFeature, DbName.Postgres)
    private readonly hotelStandardFeatureRepository: Repository<HotelStandardFeature>,

    @InjectRepository(HotelStandardFeatureTranslation, DbName.Postgres)
    private readonly hotelStandardFeatureTranslationRepository: Repository<HotelStandardFeatureTranslation>,

    @InjectRepository(RoomProductStandardFeature, DbName.Postgres)
    private readonly roomProductStandardFeatureRepository: Repository<RoomProductStandardFeature>,

    @InjectRepository(RoomUnit, DbName.Postgres)
    private readonly roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(RoomUnitRetailFeature, DbName.Postgres)
    private readonly roomUnitRetailFeatureRepository: Repository<RoomUnitRetailFeature>,

    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,

    @InjectQueue(QUEUE_NAMES.ROOM_PRODUCT_PRICING)
    private readonly roomProductPricingQueue: Queue,

    private readonly adminService: AdminService,
    private readonly configService: ConfigService,

    private readonly roomProductService: RoomProductService,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource
  ) {}

  async syncIconImageRetailByCode(hotelId: string, force: boolean = false) {
    this.logger.log(`Starting retail image sync for hotel ${hotelId}, force: ${force}`);
    // force, sync all
    let hotelRetailFeatures: HotelRetailFeature[] = [];
    if (force) {
      hotelRetailFeatures = await this.hotelRetailFeatureRepository.find({
        where: { hotelId },
        select: ['id', 'code']
      });
    } else {
      hotelRetailFeatures = await this.hotelRetailFeatureRepository.find({
        where: { hotelId, imageUrl: IsNull() },
        select: ['id', 'code']
      });
    }

    const res: AdminResponseDto<MasterTemplateResponse> =
      await this.adminService.getTemplateFeature('RETAIL');

    const masterTemplatesMap = new Map(
      res.data.map((t) => {
        // Use the full image URL from master template
        return [t.code, t.imageUrl];
      })
    );

    const idsToUpdate: string[] = [];
    const cases: string[] = [];

    for (const feature of hotelRetailFeatures) {
      const fullImageUrl = masterTemplatesMap.get(feature.code);
      if (fullImageUrl) {
        idsToUpdate.push(`'${feature.id}'`);
        cases.push(`WHEN id = '${feature.id}' THEN '${fullImageUrl}'`);
      }
    }

    if (idsToUpdate.length > 0) {
      // Use the cases directly as they already contain full URLs from master template
      this.logger.log(`Updating ${idsToUpdate.length} retail features with master template images`);

      await this.hotelRetailFeatureRepository.query(`
           UPDATE hotel_retail_feature
           SET image_url = CASE
             ${cases.join('\n')}
           END
           WHERE id IN (${idsToUpdate.join(', ')});
         `);

      this.logger.log(`Successfully updated ${idsToUpdate.length} retail feature images`);
    } else {
      this.logger.log('No retail features found to update');
    }
  }

  async syncIconImageStandardByCode(hotelId: string, force: boolean = false) {
    this.logger.log(`Starting standard image sync for hotel ${hotelId}, force: ${force}`);
    let hotelStandardFeatures: HotelStandardFeature[] = [];
    if (force) {
      hotelStandardFeatures = await this.hotelStandardFeatureRepository.find({
        where: { hotelId },
        select: ['id', 'code']
      });
    } else {
      hotelStandardFeatures = await this.hotelStandardFeatureRepository.find({
        where: { hotelId, imageUrl: IsNull() },
        select: ['id', 'code']
      });
    }

    const res: AdminResponseDto<MasterTemplateResponse> =
      await this.adminService.getTemplateFeature('STANDARD');
    const cdnUrl = this.configService.get<string>('S3_CDN_URL');

    const masterTemplatesMap = new Map(
      res.data.map((t) => {
        // Use the full image URL from master template
        return [t.code, t.imageUrl];
      })
    );

    const idsToUpdate: string[] = [];
    const cases: string[] = [];

    for (const feature of hotelStandardFeatures) {
      const fullImageUrl = masterTemplatesMap.get(feature.code);
      if (fullImageUrl) {
        idsToUpdate.push(`'${feature.id}'`);
        cases.push(`WHEN id = '${feature.id}' THEN '${fullImageUrl}'`);
      }
    }

    if (idsToUpdate.length > 0) {
      // Use the cases directly as they already contain full URLs from master template
      this.logger.log(
        `Updating ${idsToUpdate.length} standard features with master template images`
      );

      await this.hotelStandardFeatureRepository.query(`
           UPDATE hotel_standard_feature
           SET image_url = CASE
             ${cases.join('\n')}
           END
           WHERE id IN (${idsToUpdate.join(', ')});
         `);

      this.logger.log(`Successfully updated ${idsToUpdate.length} standard feature images`);
    } else {
      this.logger.log('No standard features found to update');
    }
  }

  async getHotelRetailCategories(dto: GetHotelRetailCategoriesDto): Promise<HotelRetailCategory[]> {
    try {
      const data = await this.hotelRetailCategoryRepository.find({
        where: { hotelId: dto.hotelId },
        relations: [
          'hotelRetailCategoryTranslations',
          'hotelRetailFeatures',
          'hotelRetailFeatures.hotelRetailCategory'
        ],
        order: { displaySequence: 'ASC', createdAt: 'ASC' }
      });

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelRetailFeatures(
    dto: GetHotelRetailFeaturesDto
  ): Promise<PaginatedResponse<HotelRetailFeature>> {
    try {
      const where: FindOptionsWhere<HotelRetailFeature> = {
        hotelId: dto.hotelId,
        status: HotelRetailFeatureStatusEnum.ACTIVE
      };

      if (dto.categoryIds?.length) {
        where.hotelRetailCategoryId = In(dto.categoryIds);
      }

      if (dto.featureIds?.length) {
        where.id = In(dto.featureIds);
      }

      if (dto.isVisible !== undefined && dto.isVisible !== null) {
        where.isVisible = dto.isVisible;
      }

      if (!dto.isGetAllRoomProductRetailFeatures) {
        where.roomProductRetailFeatures = {
          quantity: MoreThan(0)
        };
      }

      where.status = HotelRetailFeatureStatusEnum.ACTIVE;

      const config = await this.hotelConfigurationRepository.findOne({
        where: {
          hotelId: dto.hotelId,
          configType: HotelConfigurationTypeEnum.ISE_FEATURE_SORTING_DISPLAY
        }
      });
      const isDisplayByPopularity = config?.configValue?.value === 'POPULARITY';

      const order: FindOptionsOrder<HotelRetailFeature> = {
        ...(isDisplayByPopularity ? { baseWeight: 'DESC' } : { displaySequence: 'ASC' }),
        name: 'ASC',
        createdAt: 'ASC'
      };

      let [data, total] = await this.hotelRetailFeatureRepository.findAndCount({
        where,
        take: dto.limit || 1000,
        skip: dto.offset || 0,
        order,
        relations: [
          'hotelRetailCategory',
          'roomProductRetailFeatures',
          'roomProductRetailFeatures.roomProduct'
        ],
        select: {
          id: true,
          code: true,
          name: true,
          baseRate: true,
          baseWeight: true,
          childrenSuitability: true,
          adultsSuitability: true,
          description: true,
          shortDescription: true,
          displaySequence: true,
          createdAt: true, // Add createdAt to select
          mappingFeatureCode: true,
          isVisible: true,
          status: true,
          type: true,
          travelTag: true,
          occasion: true,
          isMultiBedroom: true,
          isSuggestedPrice: true,
          measurementUnit: true,
          imageUrl: true,
          hotelRetailCategoryId: true,
          translations: true,
          hotelRetailCategory: {
            id: true,
            code: true,
            name: true,
            categoryType: true,
            displaySequence: true
          },
          roomProductRetailFeatures: {
            id: true,
            hotelId: true,
            roomProductId: true,
            quantity: true,
            retailFeatureId: true,
            roomProduct: {
              id: true,
              name: true,
              code: true,
              description: true,
              type: true
            }
          }
        }
      });

      // map translations to old DTO:
      data = data.map((item: any) => {
        return {
          ...item,
          translations: undefined, // this field don't need & duplicated with hotelRetailFeatureTranslations
          hotelRetailFeatureTranslations: item.translations
        };
      });

      return {
        data,
        total,
        limit: dto.limit,
        offset: dto.offset
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateCategoryPriceWeight(
    dto: UpdateCategoryPriceWeightDto[]
  ): Promise<HotelRetailCategory[]> {
    try {
      const categories = await this.hotelRetailCategoryRepository.find({
        where: { id: In(dto.map((item) => item.categoryId)) }
      });

      categories.forEach((category) => {
        const item = dto.find((item) => item.categoryId === category.id);
        if (item) {
          category.priceWeight = item.priceWeight;
        }
      });

      const data = await this.hotelRetailCategoryRepository.save(categories);

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async bulkCreateRetailFeature(dto: BulkCreateRetailFeatureDto) {
    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingFeatures = await queryRunner.manager.find(HotelRetailFeature, {
        where: { hotelId: dto.hotelId, code: In(dto.templates.map((template) => template.code)) }
      });

      const dtoToUpdate = dto.templates.map((template) => {
        const existingFeature = existingFeatures.find((feature) => feature.code === template.code);

        return {
          id: existingFeature?.id || uuidv4(),
          hotelId: dto.hotelId,
          code: template.code,
          name: template.name,
          hotelRetailCategoryId: template.hotelRetailCategoryId,
          description: template.description,
          imageUrl: template.iconImageUrl,
          shortDescription: template.description,
          isVisible: false,
          status: HotelRetailFeatureStatusEnum.ACTIVE
        };
      });

      await queryRunner.manager.upsert(HotelRetailFeature, dtoToUpdate, {
        conflictPaths: ['id'],
        skipUpdateIfNoValuesChanged: true
      });

      switch (dto.createFor) {
        case 'ROOM_UNIT': {
          // map retail feature to room unit
          const roomUnits = await queryRunner.manager.find(RoomUnit, {
            where: { hotelId: dto.hotelId },
            select: ['id']
          });

          // bulk create room unit retail feature for n × m relationship (each room unit × each retail feature)
          if (roomUnits.length && dtoToUpdate.length) {
            const existingRoomUnitRetailFeatures = await queryRunner.manager.find(
              RoomUnitRetailFeature,
              {
                where: {
                  hotelId: dto.hotelId,
                  roomUnitId: In(roomUnits.map((roomUnit) => roomUnit.id)),
                  retailFeatureId: In(dtoToUpdate.map((feature) => feature.id))
                },
                select: ['id']
              }
            );
            const roomUnitRetailFeaturesMap = new Map(
              existingRoomUnitRetailFeatures.map((feature) => [
                `${feature.roomUnitId}-${feature.retailFeatureId}`,
                feature.id
              ])
            );
            const roomUnitRetailFeatures: Partial<RoomUnitRetailFeature>[] = [];
            // Create n × m relationships
            for (const roomUnit of roomUnits) {
              for (const feature of dtoToUpdate) {
                const key = `${roomUnit.id}-${feature.id}`;
                const existingFeatureId = roomUnitRetailFeaturesMap.get(key);
                roomUnitRetailFeatures.push({
                  id: existingFeatureId || uuidv4(),
                  hotelId: dto.hotelId,
                  roomUnitId: roomUnit.id,
                  retailFeatureId: feature.id,
                  quantity: 0
                });
              }
            }

            // Use QueryBuilder for optimized bulk insert
            if (roomUnitRetailFeatures.length) {
              await queryRunner.manager.upsert(RoomUnitRetailFeature, roomUnitRetailFeatures, {
                conflictPaths: ['id'],
                skipUpdateIfNoValuesChanged: true
              });
            }
          }
          break;
        }
        case 'ROOM_PRODUCT': {
          // map retail feature to room product
          const roomProducts = await queryRunner.manager.find(RoomProduct, {
            where: { hotelId: dto.hotelId },
            select: ['id']
          });

          // bulk create room product retail feature for n × m relationship (each room product × each retail feature)
          if (roomProducts.length && dtoToUpdate.length) {
            const existingRoomProductRetailFeatures = await queryRunner.manager.find(
              RoomProductRetailFeature,
              {
                where: {
                  hotelId: dto.hotelId,
                  roomProductId: In(roomProducts.map((roomProduct) => roomProduct.id)),
                  retailFeatureId: In(dtoToUpdate.map((feature) => feature.id))
                },
                select: ['id', 'roomProductId', 'retailFeatureId']
              }
            );
            const roomProductRetailFeaturesMap = new Map(
              existingRoomProductRetailFeatures.map((feature) => [
                `${feature.roomProductId}-${feature.retailFeatureId}`,
                feature.id
              ])
            );
            const roomProductRetailFeatures: Partial<RoomProductRetailFeature>[] = [];
            // Create n × m relationships
            for (const roomProduct of roomProducts) {
              for (const feature of dtoToUpdate) {
                const key = `${roomProduct.id}-${feature.id}`;
                const existingFeatureId = roomProductRetailFeaturesMap.get(key);
                roomProductRetailFeatures.push({
                  id: existingFeatureId || uuidv4(),
                  hotelId: dto.hotelId,
                  roomProductId: roomProduct.id,
                  retailFeatureId: feature.id,
                  quantity: 0
                });
              }
            }

            // Use QueryBuilder for optimized bulk insert
            if (roomProductRetailFeatures.length) {
              await queryRunner.manager.upsert(
                RoomProductRetailFeature,
                roomProductRetailFeatures,
                {
                  conflictPaths: ['id'],
                  skipUpdateIfNoValuesChanged: true
                }
              );
            }
          }
          break;
        }

        default:
          break;
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      return dtoToUpdate;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async bulkUpdateRetailFeatures(dto: BulkUpdateRetailFeaturesDto) {
    try {
      this.logger.log(`Bulk updating for ${dto.features.length} features`);

      const currentFeatures = await this.hotelRetailFeatureRepository.find({
        where: { id: In(dto.features.map((feature) => feature.id)) },
        select: ['id', 'baseRate', 'hotelId', 'displaySequence']
      });

      const data = await this.hotelRetailFeatureRepository.save(dto.features);

      // trigger room product feature based pricing if base rate is changed
      const currentFeatureBaseRateMap = new Map(
        currentFeatures.map((feature) => [feature.id, feature.baseRate])
      );
      const newFeatureBaseRateMap = new Map(
        dto.features.map((feature) => [feature.id, feature.baseRate])
      );
      const featureIdsToUpdate = dto.features.filter(
        (feature) =>
          currentFeatureBaseRateMap.get(feature.id) !== newFeatureBaseRateMap.get(feature.id)
      );

      if (featureIdsToUpdate.length > 0) {
        await this.processRoomProductFeatureBasedPricing({
          hotelId: currentFeatures[0]?.hotelId,
          roomProductId: undefined,
          featureIds: featureIdsToUpdate.map((feature) => feature.id)
        });
      }

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateRetailVisibility(dto: UpdateRetailVisibilityDto): Promise<HotelRetailFeature> {
    try {
      const feature = await this.hotelRetailFeatureRepository.findOne({
        where: { id: dto.featureId }
      });

      if (!feature) {
        throw new NotFoundException(`Retail feature with ID ${dto.featureId} not found`);
      }

      feature.isVisible = dto.isVisible;
      const data = await this.hotelRetailFeatureRepository.save(feature);

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateRetailInfo(dto: UpdateRetailInfoDto): Promise<HotelRetailFeature> {
    const { id, translations, ...restOfRetailFeature } = dto;
    try {
      const feature = await this.hotelRetailFeatureRepository.findOne({
        where: { id }
        // relations: ['hotelRetailFeatureTranslations']
      });

      if (!feature) {
        throw new NotFoundException(`Retail feature with ID ${dto.id} not found`);
      }

      const savedFeature = await this.hotelRetailFeatureRepository.save({
        id,
        ...restOfRetailFeature,
        translations: dto.translations?.map((item) => ({
          languageCode: item.languageCode as any,
          name: item.name,
          description: item.description,
          ...(item.measurementUnit ? { measurementUnit: item.measurementUnit } : {})
        }))
      });

      // trigger room product feature based pricing if base rate is changed
      if (restOfRetailFeature.baseRate && restOfRetailFeature.baseRate !== feature.baseRate) {
        await this.processRoomProductFeatureBasedPricing({
          hotelId: feature.hotelId,
          roomProductId: undefined,
          featureIds: [feature.id]
        });
      }

      return savedFeature;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async processRoomProductFeatureBasedPricing(dto: ProcessRoomProductPricingDto) {
    await this.roomProductPricingQueue.add(
      JOB_NAMES.ROOM_PRODUCT_PRICING.PROCESS_ROOM_PRODUCT_FEATURE_BASED_PRICING,
      dto
    );
  }

  async updateStandardInfo(dto: UpdateStandardInfoDto): Promise<HotelStandardFeature> {
    const { id, translations, ...restOfStandardFeature } = dto;
    try {
      const feature = await this.hotelStandardFeatureRepository.findOne({ where: { id } });

      if (!feature) {
        throw new NotFoundException(`Standard feature with ID ${dto.id} not found`);
      }
      const savedFeature = await this.hotelStandardFeatureRepository.save({
        id,
        ...restOfStandardFeature,
        translations: dto.translations?.map((item) => ({
          languageCode: item.languageCode as any,
          name: item.name,
          description: item.description
        }))
      });

      return savedFeature;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async bulkCreateStandardFeature(dto: BulkCreateStandardFeatureDto) {
    try {
      const existingFeatures = await this.hotelStandardFeatureRepository.find({
        where: { hotelId: dto.hotelId, code: In(dto.templates.map((template) => template.code)) }
      });

      if (existingFeatures.length > 0) {
        throw new BadRequestException(
          `Standard feature with code '${existingFeatures.map((f) => f.code).join(', ')}' already exists for hotel ${dto.hotelId}`
        );
      }

      const newFeatures = await this.hotelStandardFeatureRepository.save(
        dto.templates.map((template) => ({
          hotelId: dto.hotelId,
          code: template.code,
          name: template.name,
          description: template.description,
          imageUrl: template.iconImageUrl,
          shortDescription: template.description
        }))
      );

      return newFeatures;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteStandardFeature(id: string): Promise<string> {
    try {
      const feature = await this.hotelStandardFeatureRepository.findOne({
        where: { id }
      });

      if (!feature) {
        throw new NotFoundException(`Standard feature with ID ${id} not found`);
      }

      const roomProductStandardFeatures = await this.roomProductStandardFeatureRepository.find({
        where: { standardFeatureId: id }
      });
      if (roomProductStandardFeatures.length > 0) {
        await this.roomProductStandardFeatureRepository.delete(
          roomProductStandardFeatures.map((item) => item.id)
        );
      }

      await this.hotelStandardFeatureRepository.delete(id);

      return id;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getStandardFeatures(
    dto: GetStandardFeaturesDto
  ): Promise<PaginatedResponse<HotelStandardFeature>> {
    try {
      const where: FindOptionsWhere<HotelStandardFeature> = { hotelId: dto.hotelId };

      if (dto.ids?.length) {
        where.id = In(dto.ids);
      }

      const order: FindOptionsOrder<HotelStandardFeature> = { displaySequence: 'ASC', name: 'ASC' };

      let [data, total] = await this.hotelStandardFeatureRepository.findAndCount({
        where,
        take: dto.limit || 1000,
        skip: dto.offset || 0,
        order,
        relations: ['hotelStandardFeatureTranslations']
      });

      data = data.map((item: any) => {
        return {
          ...item,
          translations: undefined, // this field don't need & duplicated with hotelStandardFeatureTranslations
          hotelStandardFeatureTranslations: item.translations
        };
      });

      return {
        data,
        total
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteRetailFeature(dto: DeleteRetailFeatureDto): Promise<string> {
    const { id, actionFor } = dto;
    try {
      const feature = await this.hotelRetailFeatureRepository.findOne({
        where: { id }
      });

      if (!feature) {
        throw new NotFoundException(`Retail feature with ID ${id} not found`);
      }

      let removeRetailFeature = false;

      switch (actionFor) {
        case ActionRetailFeatureForEnum.ROOM_UNIT:
          const roomUnitRetailFeatures = await this.roomUnitRetailFeatureRepository.find({
            where: { retailFeatureId: id }
          });
          if (roomUnitRetailFeatures.length) {
            await this.roomUnitRetailFeatureRepository.delete(
              roomUnitRetailFeatures.map((item) => item.id)
            );
          }
          const roomProductRetailFeatures = await this.roomProductRetailFeatureRepository.find({
            where: {
              retailFeatureId: id
            },
            relations: ['roomProduct'],
            select: {
              id: true,
              roomProduct: {
                id: true,
                type: true
              }
            }
          });
          let rfcRoomProductRetailFeature: RoomProductRetailFeature[] = [];
          let remainingRoomProductRetailFeature: RoomProductRetailFeature[] = [];
          for (const item of roomProductRetailFeatures || []) {
            if (item.roomProduct.type === RoomProductType.RFC) {
              rfcRoomProductRetailFeature.push(item);
            } else {
              remainingRoomProductRetailFeature.push(item);
            }
          }
          if (!remainingRoomProductRetailFeature.length) {
            removeRetailFeature = true;
          }
          if (rfcRoomProductRetailFeature.length) {
            await this.roomProductRetailFeatureRepository.delete(
              rfcRoomProductRetailFeature.map((item) => item.id)
            );
          }
          try {
            await this.roomProductService.syncFeatureStringByProductIds(feature.hotelId);
          } catch (error) {
            throw new Error('Failed to update feature string for products of hotel.');
          }
          break;
        case ActionRetailFeatureForEnum.ROOM_PRODUCT:
          {
            const roomProductRetailFeatures = await this.roomProductRetailFeatureRepository.find({
              where: {
                retailFeatureId: id,
                roomProduct: {
                  type: In([RoomProductType.ERFC, RoomProductType.MRFC])
                }
              }
            });
            let roomProductIds = roomProductRetailFeatures.map((item) => item.roomProductId);
            roomProductIds = [...new Set(roomProductIds)];
            if (roomProductRetailFeatures.length) {
              await this.roomProductRetailFeatureRepository.delete(
                roomProductRetailFeatures.map((item) => item.id)
              );
            }

            const roomUnitRetailFeatures = await this.roomUnitRetailFeatureRepository.find({
              where: {
                retailFeatureId: id
              }
            });
            if (!roomUnitRetailFeatures.length) {
              removeRetailFeature = true;
            }

            try {
              await this.roomProductService.syncFeatureStringByProductIds(
                feature.hotelId,
                roomProductIds
              );
            } catch (error) {
              throw new Error('Failed to update feature string for products of hotel.');
            }
          }

          break;
        default:
          break;
      }

      if (!removeRetailFeature) {
        this.logger.debug(`Retail feature is not removed only for ${actionFor}`);
        return id;
      }

      await this.hotelRetailFeatureRepository.update(id, {
        status: HotelRetailFeatureStatusEnum.INACTIVE
      });

      return id;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async migrateHotelStandardFeatureTranslation() {
    try {
      const allTranslations = await this.hotelStandardFeatureTranslationRepository.find();

      // group by hotelStandardFeatureId:
      const translationsByHotelStandardFeatureId = allTranslations.reduce((acc, translation) => {
        acc[translation.hotelStandardFeatureId] = acc[translation.hotelStandardFeatureId] || [];
        acc[translation.hotelStandardFeatureId].push(translation);
        return acc;
      }, {});

      // bulk update hotelStandardFeature:
      const updatePromises: Promise<any>[] = [];
      let migratedCount = 0;

      for (const [hotelStandardFeatureId, translations] of Object.entries(
        translationsByHotelStandardFeatureId
      )) {
        // Transform HotelStandardFeatureTranslation entities to Translation interface format
        const translationsArray = (translations as HotelStandardFeatureTranslation[])
          .map((translation) => ({
            languageCode: translation.languageCode as any,
            name: translation.name,
            description: translation.description
          }))
          .filter(
            (translation) =>
              // Only include translations that have actual content
              translation.name || translation.description
          );

        if (translationsArray.length > 0) {
          const updatePromise = this.hotelStandardFeatureRepository
            .createQueryBuilder()
            .update(HotelStandardFeature)
            .set({ translations: translationsArray as any })
            .where('id = :id', { id: hotelStandardFeatureId })
            .execute();

          updatePromises.push(updatePromise);
          migratedCount++;
        }
      }

      // Execute all updates in parallel
      await Promise.all(updatePromises);

      this.logger.log(
        `Successfully migrated translations for ${migratedCount} hotel standard features`
      );

      return {
        message: 'Hotel standard feature translations migrated successfully',
        migratedCount: migratedCount,
        totalTranslationRecords: allTranslations.length
      };
    } catch (error) {
      this.logger.error('migrateHotelStandardFeatureTranslation: ', JSON.stringify(error));
      throw new BadRequestException(error.message);
    }
  }

  async migrateHotelRetailCategoryTranslation() {
    try {
      const allTranslations = await this.hotelRetailCategoryTranslationRepository.find();

      // group by hotelRetailCategoryId:
      const translationsByHotelRetailCategoryId = allTranslations.reduce((acc, translation) => {
        acc[translation.hotelRetailCategoryId] = acc[translation.hotelRetailCategoryId] || [];
        acc[translation.hotelRetailCategoryId].push(translation);
        return acc;
      }, {});

      // bulk update hotelRetailCategory:
      const updatePromises: Promise<any>[] = [];
      let migratedCount = 0;

      for (const [hotelRetailCategoryId, translations] of Object.entries(
        translationsByHotelRetailCategoryId
      )) {
        // Transform HotelRetailCategoryTranslation entities to Translation interface format
        const translationsArray = (translations as HotelRetailCategoryTranslation[])
          .map((translation) => ({
            languageCode: translation.languageCode as any,
            name: translation.name
          }))
          .filter(
            (translation) =>
              // Only include translations that have actual content
              translation.name
          );

        if (translationsArray.length > 0) {
          const updatePromise = this.hotelRetailCategoryRepository
            .createQueryBuilder()
            .update(HotelRetailCategory)
            .set({ translations: translationsArray as any })
            .where('id = :id', { id: hotelRetailCategoryId })
            .execute();

          updatePromises.push(updatePromise);
          migratedCount++;
        }
      }

      // Execute all updates in parallel
      await Promise.all(updatePromises);

      this.logger.log(
        `Successfully migrated translations for ${migratedCount} hotel retail categories`
      );

      return {
        message: 'Hotel retail category translations migrated successfully',
        migratedCount: migratedCount,
        totalTranslationRecords: allTranslations.length
      };
    } catch (error) {
      this.logger.error('migrateHotelRetailCategoryTranslation: ', JSON.stringify(error));
      throw new BadRequestException(error.message);
    }
  }

  async getMasterTemplate(type: 'STANDARD' | 'RETAIL') {
    const features = await this.adminService.getTemplateFeature(type);
    return features;
  }

  async getHotelFeatures(filter: HotelFeatureFilterDto): Promise<HotelRetailFeatureDto[]> {
    if (filter.featureType === 'STANDARD') {
      const where: FindOptionsWhere<HotelStandardFeature> = { hotelId: filter.hotelId };
      const relations: FindOptionsRelations<HotelStandardFeature> = {};

      if (filter.idList?.length) {
        where.id = In(filter.idList);
      }

      if (filter.translateTo) {
        relations.hotelStandardFeatureTranslations = true;
      }

      const data = await this.hotelStandardFeatureRepository.find({
        where,
        relations
      });

      return data.map((item) => {
        const translation = filter.translateTo
          ? item.hotelStandardFeatureTranslations.find(
              (translation) => translation.languageCode === filter.translateTo
            )
          : undefined;

        return {
          id: item.id,
          code: item.code,
          name: translation?.name || item.name,
          baseRate: undefined,
          description: translation?.description || item.description,
          type: undefined,
          hotelRetailCategory: {
            id: undefined,
            code: 'ST',
            name: 'Standard Feature',
            displaySequence: 9
          },
          iconImageUrl: item.imageUrl
        } as unknown as HotelRetailFeatureDto;
      });
    } else {
      const where: FindOptionsWhere<HotelRetailFeature> = { hotelId: filter.hotelId };

      if (filter.idList?.length) {
        where.id = In(filter.idList);
      }

      if (filter.typeList?.length) {
        where.type = In(filter.typeList);
      }

      const relations: FindOptionsRelations<HotelRetailFeature> = {};

      // if (filter.translateTo) {
      //   relations.hotelRetailFeatureTranslations = true;
      // }

      const data = await this.hotelRetailFeatureRepository.find({
        where,
        relations
      });

      return data.map((item) => {
        const translation = filter.translateTo
          ? item.translations?.find(
              (translation) => translation.languageCode === filter.translateTo
            )
          : undefined;

        return {
          id: item.id,
          code: item.code,
          name: translation?.name || item.name,
          baseRate: item.baseRate,
          baseWeight: item.baseWeight,
          type: item.type,
          description: translation?.description || item.description,
          shortDescription: item.shortDescription,

          hotelRetailCategoryId: item.hotelRetailCategoryId,
          displaySequence: item.displaySequence,
          hotelRetailCategory: item.hotelRetailCategory,

          isVisible: item.isVisible,

          status: item.status,

          travelTag: item.travelTag,
          occasion: item.occasion,
          isMultiBedroom: item.isMultiBedroom
        } as unknown as HotelRetailFeatureDto;
      });
    }
  }

  async syncFeature(filter: HotelFeatureFilterDto) {
    const [
      standardFeatures,
      retailFeatures,
      categories,
      hotelStandardFeatures,
      hotelRetailFeatures,
      hotelRetailCategories
    ] = await Promise.all([
      this.adminService.getTemplateFeature('STANDARD'),
      this.adminService.getTemplateFeature('RETAIL'),
      this.adminService.getTemplateCategory(),
      this.hotelStandardFeatureRepository.find({
        where: { hotelId: filter.hotelId }
      }),
      this.hotelRetailFeatureRepository.find({
        where: { hotelId: filter.hotelId }
      }),
      this.hotelRetailCategoryRepository.find({
        where: { hotelId: filter.hotelId }
      })
    ]);

    const mapStandardFeatures: Map<string, HotelStandardFeature> = new Map(
      standardFeatures.map((feature) => [feature.code, feature])
    );
    const mapRetailFeatures: Map<string, HotelRetailFeature> = new Map(
      retailFeatures.map((feature) => [feature.code, feature])
    );
    const mapCategories: Map<string, HotelRetailCategory> = new Map(
      categories.map((category) => [category.code, category])
    );

    const mapNewArr = (arr: any[], arrMap: Map<string, any>) => {
      const newArr: any[] = [];
      for (const item of arr) {
        if (!item?.code || !arrMap.has(item.code)) continue;

        const existingItem = arrMap.get(item.code);
        if (!existingItem) continue;

        const translationMap = new Map(
          item.translations?.map((translation) => [translation.languageCode, translation])
        );
        const existingTranslationMap = new Map(
          existingItem.translationList?.map((translation) => [
            translation.languageCode,
            translation
          ])
        );

        const isSpaceType = item.code?.startsWith('SPT_');
        const newValues = {
          imageUrl: existingItem.imageUrl
          // name: existingItem.name,
          // description: existingItem.description,
          // measurementUnit: isSpaceType ? existingItem.measurementUnit : null,
          // translations: [
          //   LanguageCodeEnum.FR,
          //   LanguageCodeEnum.DE,
          //   LanguageCodeEnum.IT,
          //   LanguageCodeEnum.ES,
          //   LanguageCodeEnum.NL,
          //   LanguageCodeEnum.AR
          // ].map((languageCode) => {
          //   // const translation: any = translationMap.get(languageCode);
          //   const existingTranslation: any = existingTranslationMap.get(languageCode);
          //   const newTranslation = {
          //     languageCode: languageCode,
          //     name: existingTranslation?.name,
          //     description: existingTranslation?.description,
          //     measurementUnit: isSpaceType ? existingTranslation?.measurementUnit : null
          //   };
          //   return newTranslation;
          // })
        };
        const newItem = { ...item, ...newValues };
        for (const field of filter.updateFields || []) {
          if (!newItem[field]) {
            continue;
          }

          if (field === 'measurementUnit' && isSpaceType) {
            newItem[field] = newValues[field];
            continue;
          }

          newItem[field] = newValues[field];
        }

        newArr.push(newItem);
      }
      return newArr;
    };

    const newStandardFeatures: (Partial<HotelStandardFeature> & {
      id: string;
      code: string;
      hotelId: string;
    })[] = mapNewArr(hotelStandardFeatures, mapStandardFeatures);
    const newRetailFeatures: Partial<HotelRetailFeature>[] = mapNewArr(
      hotelRetailFeatures,
      mapRetailFeatures
    );
    const newCategories: Partial<HotelRetailCategory>[] = mapNewArr(
      hotelRetailCategories,
      mapCategories
    );

    await Promise.all([
      this.hotelStandardFeatureRepository.upsert(newStandardFeatures, {
        conflictPaths: ['id']
      }),
      this.hotelRetailFeatureRepository.upsert(newRetailFeatures, {
        conflictPaths: ['id']
      }),
      this.hotelRetailCategoryRepository.upsert(newCategories, {
        conflictPaths: ['id']
      })
    ]);

    return {
      message: 'Successfully synced feature images',
      status: 'SUCCESS',
      data: true
    };
  }
}
