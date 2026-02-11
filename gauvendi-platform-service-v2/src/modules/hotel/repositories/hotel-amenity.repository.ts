import { Inject, Injectable, InternalServerErrorException, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FileLibrary } from '@src/core/entities/core-entities/file-library.entity';
import { HotelAgeCategory } from '@src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenityPrice } from '@src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import {
  DistributionChannelEnum,
  HotelAgeCategoryCodeEnum,
  LanguageCodeEnum,
  PricingUnitEnum,
  SellingTypeEnum
} from '@src/core/enums/common';
import { S3Service } from '@src/core/s3/s3.service';
import { DbName } from 'src/core/constants/db-name.constant';
import { Filter } from 'src/core/dtos/common.dto';
import {
  AmenityStatusEnum,
  HotelAmenity
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { BadRequestException, NotFoundException, ValidationException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import {
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Raw,
  Repository
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  GetCppExtrasServiceListQueryDto,
  HotelAmenityFilter,
  HotelAmenityFilterDto,
  HotelAmenityInputDto,
  UploadHotelAmenityImageDto
} from '../dtos/hotel-amenity-filter.dto';
import { HotelAmenityDto } from '../dtos/hotel-amenity.dto';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { PmsService } from '@src/modules/pms/pms.service';
import { Logger } from '@nestjs/common';
@Injectable()
export class HotelAmenityRepository extends BaseService {
  private readonly logger = new Logger(HotelAmenityRepository.name);

  constructor(
    @InjectRepository(HotelAmenity, DbName.Postgres)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>,

    @InjectRepository(HotelAmenityPrice, DbName.Postgres)
    private readonly hotelAmenityPriceRepository: Repository<HotelAmenityPrice>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(FileLibrary, DbName.Postgres)
    private readonly fileLibraryRepository: Repository<FileLibrary>,

    @InjectRepository(HotelAgeCategory, DbName.Postgres)
    private readonly hotelAgeCategoryRepository: Repository<HotelAgeCategory>,

    @InjectRepository(RatePlanDerivedSetting, DbName.Postgres)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,

    private readonly s3Service: S3Service,

    @Inject(forwardRef(() => PmsService))
    private readonly pmsService: PmsService,

    configService: ConfigService
  ) {
    super(configService);
  }

  async getHotelAmenities(body: HotelAmenityDto): Promise<HotelAmenity[]> {
    try {
      const hotelAmenity = await this.hotelAmenityRepository.find({
        where: {
          ...(body.hotelId && { hotelId: body.hotelId }),
          ...(body.ids && { id: In(body.ids) }),
          ...(body.codes && { code: In(body.codes) }),
          ...(body.status && { status: body.status as AmenityStatusEnum })
        },
        relations: body.relations ?? []
      });

      return hotelAmenity;
    } catch (error) {
      throw new BadRequestException('Error getting hotel amenities');
    }
  }

  async getHotelAmenityCppExtrasServiceList(payload: GetCppExtrasServiceListQueryDto) {
    const { hotelId, productList: productListQuery } = payload;
    const salePlanIds = productListQuery.map((item) => item.salesPlanId);
    const roomProductIds = productListQuery.map((item) => item.roomProductId);

    // Hotel Amenity List query builder
    const hotelAmenityBuilder = this.hotelAmenityRepository.createQueryBuilder('qb');
    hotelAmenityBuilder.select([
      'qb.id',
      'qb.name',
      'qb.code',
      'qb.description',
      'qb.status',
      'qb.amenityType',
      'qb.pricingUnit',
      'qb.availability',
      'qb.postNextDay',
      'qb.iconImageUrl',
      'qb.mappingHotelAmenityCode',
      'qb.linkedAmenityCode',
      'qb.sellingType'
    ]);
    hotelAmenityBuilder.where('qb.hotelId = :hotelId', { hotelId: hotelId });
    hotelAmenityBuilder.andWhere('qb.status = :status', { status: AmenityStatusEnum.ACTIVE });
    hotelAmenityBuilder.andWhere('qb.distributionChannel && :distributionChannels', {
      distributionChannels: [DistributionChannelEnum.GV_VOICE]
    });

    hotelAmenityBuilder.leftJoinAndSelect('qb.ratePlanExtraServices', 'rpes');
    hotelAmenityBuilder.leftJoinAndSelect('qb.roomProductExtras', 'rpe');
    hotelAmenityBuilder.leftJoinAndSelect('qb.hotelAmenityPrices', 'hap');
    hotelAmenityBuilder.leftJoinAndSelect('hap.hotelAgeCategory', 'hac');

    const hotelAmenityList = await hotelAmenityBuilder.getMany();
    let ratePlanIds = hotelAmenityList.flatMap((item) =>
      item.ratePlanExtraServices.map((rpes) => rpes.ratePlanId)
    );
    ratePlanIds = [...new Set(ratePlanIds)];
    if (!ratePlanIds.length) {
      return hotelAmenityList;
    }

    const derivedRatePlans = await this.ratePlanDerivedSettingRepository.find({
      where: {
        derivedRatePlanId: In(ratePlanIds),
        followDailyIncludedAmenity: true
      }
    });

    if (!derivedRatePlans.length) {
      return hotelAmenityList;
    }

    const derivedRatePlansIdsMap: Map<string, string[]> = new Map();
    for (const derivedRatePlan of derivedRatePlans) {
      const ratePlanIds = derivedRatePlansIdsMap.get(derivedRatePlan.derivedRatePlanId) || [];
      ratePlanIds.push(derivedRatePlan.ratePlanId);
      derivedRatePlansIdsMap.set(derivedRatePlan.derivedRatePlanId, ratePlanIds);
    }

    const newHotelAmenityList = hotelAmenityList.map((item) => {
      const ratePlanExtraServices: any[] = [];
      for (const ratePlanExtraService of item.ratePlanExtraServices || []) {
        const derivedRatePlanIds = derivedRatePlansIdsMap.get(ratePlanExtraService.ratePlanId);
        if (!derivedRatePlanIds?.length) {
          continue;
        }
        ratePlanExtraServices.push(
          ...derivedRatePlanIds.map((derivedRatePlanId) => {
            const newRatePlanExtraService: Partial<RatePlanExtraService> = {
              ratePlanId: derivedRatePlanId,
              extrasId: ratePlanExtraService.id,
              type: ratePlanExtraService.type
            };
            return newRatePlanExtraService;
          })
        );
      }
      const newItem = { ...item };
      newItem.ratePlanExtraServices = [...item.ratePlanExtraServices, ...ratePlanExtraServices];
      return newItem;
    });
    return newHotelAmenityList;
  }
  async getHotelAmenityList(filter: HotelAmenityFilterDto): Promise<HotelAmenity[]> {
    const {
      ids,
      distributionChannelList,
      statusList,
      hotelId,
      amenityType,
      sellingTypeList,
      codeList
    } = filter;
    try {
      const queryBuilder = this.hotelAmenityRepository.createQueryBuilder('qb');
      if (ids?.length) {
        queryBuilder.andWhere('qb.id IN (:...ids)', { ids: ids });
      }

      if (sellingTypeList?.length) {
        queryBuilder.andWhere('qb.sellingType IN (:...sellingTypeList)', {
          sellingTypeList: sellingTypeList
        });
      }

      if (codeList?.length) {
        queryBuilder.andWhere('qb.code IN (:...codeList)', { codeList: codeList });
      }

      if (amenityType) {
        queryBuilder.andWhere('qb.amenityType = :amenityType', { amenityType: amenityType });
      }

      if (hotelId) {
        queryBuilder.andWhere('qb.hotelId = :hotelId', { hotelId: hotelId });
      }

      if (distributionChannelList && distributionChannelList.length > 0) {
        queryBuilder.andWhere('qb.distributionChannel  @> :distributionChannelList', {
          distributionChannelList
        });
      }

      if (statusList) {
        queryBuilder.andWhere('qb.status IN (:...statusList)', { statusList: statusList });
      }

      if (filter.relations) {
        Filter.setQueryBuilderRelations(queryBuilder, 'qb', filter.relations);
      }

      if (filter.sort) {
        Filter.setQueryBuilderSort(queryBuilder, 'qb', filter.sort);
      }

      // const sql = queryBuilder.getQuery();
      // const parameters = queryBuilder.getParameters();

      return await queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async validateLinkedAmenity(
    linkedAmenityCodeList: string[],
    hotelId: string
  ): Promise<PricingUnitEnum> {
    // check if selling type is combo, we need to check linked amenity code is valid and same pricing unit
    const sellingTypeComboAmenityCodeList = [...new Set(linkedAmenityCodeList)];
    const linkedAmenityList = await this.hotelAmenityRepository.find({
      where: { code: In(sellingTypeComboAmenityCodeList), hotelId: hotelId }
    });
    if (linkedAmenityList.length !== linkedAmenityCodeList.length) {
      throw new ValidationException('Linked amenity code is not valid');
    }
    if (linkedAmenityList.length === 0) {
      throw new ValidationException('Linked amenity code is not valid');
    }
    const basePricingUnit = linkedAmenityList?.[0].pricingUnit;
    for (const amenity of linkedAmenityList) {
      if (amenity.pricingUnit !== basePricingUnit) {
        throw new ValidationException('Linked amenity pricing unit is not the same');
      }
    }

    return basePricingUnit;
  }

  async updateHotelAmenity(filter: HotelAmenityInputDto) {
    try {
      if (!filter.id) {
        throw new BadRequestException('Hotel amenity id is required');
      }

      const { id, ...data } = filter;

      // Get current amenity to access existing distribution channel
      const currentAmenity = await this.hotelAmenityRepository.findOne({
        where: { id }
      });

      if (!currentAmenity) {
        throw new BadRequestException('Hotel amenity not found');
      }

      // Check if attempting to deactivate and if the amenity is used in any COMBO
      const isDeactivating =
        data.status === AmenityStatusEnum.INACTIVE &&
        currentAmenity.status !== AmenityStatusEnum.INACTIVE;

      if (isDeactivating) {
        const comboAmenitiesUsingThis = await this.findComboAmenitiesUsingCode(
          currentAmenity.code,
          currentAmenity.hotelId
        );

        if (comboAmenitiesUsingThis.length > 0) {
          const comboNames = comboAmenitiesUsingThis.map((c) => c.name || c.code).join(', ');
          throw new BadRequestException(
            `Cannot deactivate amenity "${currentAmenity.name || currentAmenity.code}" because it is assigned to the following COMBO service(s): ${comboNames}. Please remove it from the COMBO service(s) before deactivating.`
          );
        }
      }

      // check if selling type is combo, we need to check linked amenity code is valid and same pricing unit
      if (data.sellingType === SellingTypeEnum.COMBO && data.linkedAmenityCode?.length) {
        const basePricingUnit = await this.validateLinkedAmenity(
          data.linkedAmenityCode || [],
          currentAmenity.hotelId
        );
        data.pricingUnit = basePricingUnit;
      }

      // Handle distribution channel based on isSellableOnIbe
      const distributionChannel = currentAmenity.distributionChannel || [];
      let newDistributionChannel: DistributionChannelEnum[] = distributionChannel.filter(
        (channel) => channel !== DistributionChannelEnum.GV_SALES_ENGINE
      );
      newDistributionChannel = data.isSellableOnIbe
        ? [...newDistributionChannel, DistributionChannelEnum.GV_SALES_ENGINE]
        : newDistributionChannel;

      const updateAmenity: Partial<HotelAmenity> = {
        name: data.name,
        description: data.description || '',
        status: data.status || AmenityStatusEnum.ACTIVE,
        isePricingDisplayMode: data.isePricingDisplayMode,
        code: data.code,
        amenityType: data.amenityType,
        pricingUnit: data.pricingUnit,
        mappingHotelAmenityCode: data.mappingHotelAmenityCode,
        distributionChannel: newDistributionChannel,
        translations: (data.translationList || [])?.map((translation) => ({
          languageCode: translation.languageCode as LanguageCodeEnum,
          name: translation.name,
          description: translation.description || ''
        })),
        linkedAmenityCode: [...new Set(data.linkedAmenityCode || [])].join(','),
        sellingType: data.sellingType || SellingTypeEnum.SINGLE
      };

      if (data.availability) {
        updateAmenity.availability = data.availability;

        // sync availability mode with pms:
        if (currentAmenity.mappingHotelAmenityCode) {
          try {
            await this.pmsService.updateRatePlanService(
              currentAmenity.hotelId,
              data.availability,
              currentAmenity.mappingHotelAmenityCode
            );
          } catch (error) {
            // Rollback
            updateAmenity.availability = currentAmenity.availability;
            this.logger.error(
              `Failed to update availability for amenity ${currentAmenity.code} in hotel ${currentAmenity.hotelId}: ${error}`
            );
          }
        }
      }

      const currentHotelAmenityPrices = await this.hotelAmenityPriceRepository.find({
        where: { hotelAmenityId: id }
      });

      const updatedHotelAmenityPrices: Partial<HotelAmenityPrice>[] = [];
      const createdHotelAmenityPrices: Partial<HotelAmenityPrice>[] = [];
      for (const price of data.hotelAmenityPriceList || []) {
        const existingHotelAmenityPrice = currentHotelAmenityPrices.find(
          (p) => p.hotelAgeCategoryId === price.hotelAgeCategoryId && p.hotelAmenityId === id
        );
        if (existingHotelAmenityPrice) {
          existingHotelAmenityPrice.price = price.price || 0;
          updatedHotelAmenityPrices.push(existingHotelAmenityPrice);
        } else {
          createdHotelAmenityPrices.push({
            hotelAmenityId: id,
            hotelAgeCategoryId: price.hotelAgeCategoryId,
            price: price.price || 0
          });
        }
      }

      if (
        (!currentHotelAmenityPrices || currentHotelAmenityPrices.length === 0) &&
        createdHotelAmenityPrices.length > 0
      ) {
        const defaultHotelAmenityPrice = createdHotelAmenityPrices[0];
        const defaultHotelAgeCategory = await this.hotelAgeCategoryRepository.findOne({
          where: { hotelId: currentAmenity.hotelId, code: HotelAgeCategoryCodeEnum.DEFAULT }
        });

        if (defaultHotelAgeCategory) {
          defaultHotelAmenityPrice.hotelAgeCategoryId = defaultHotelAgeCategory.id;
        }
      }

      const hotelAmenityPrices: Partial<HotelAmenityPrice>[] = (data.hotelAmenityPriceList || [])
        ?.filter(
          (price) => price.hotelAgeCategoryId !== null && price.hotelAgeCategoryId !== undefined
        )
        .map((price) => ({
          hotelAmenityId: id,
          hotelAgeCategoryId: price.hotelAgeCategoryId,
          price: price.price
        }));

      const [updatedPrices, createdPrices, updatedAmenity] = await Promise.all([
        this.hotelAmenityPriceRepository.upsert(hotelAmenityPrices, {
          conflictPaths: ['hotelAmenityId', 'hotelAgeCategoryId']
        }),
        this.hotelAmenityPriceRepository.upsert(createdHotelAmenityPrices, {
          conflictPaths: ['hotelAmenityId', 'hotelAgeCategoryId']
        }),
        this.hotelAmenityRepository.update(id, updateAmenity)
      ]);
      return { updatedAmenity, updatedPrices };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async uploadHotelAmenityImage(input: UploadHotelAmenityImageDto) {
    const { hotelCode, file, amenityId } = input;
    const hotelAmenity = await this.hotelAmenityRepository.findOne({
      where: {
        id: amenityId
      }
    });

    if (!hotelAmenity) {
      throw new NotFoundException(`Hotel amenity with id ${amenityId} not found`);
    }
    const originalFileName = file?.originalname?.replace(/\s+/g, '_');
    const key = `hotel-extras/${hotelCode}/${new Date().getTime()}_${originalFileName}`;
    await this.s3Service.uploadFile(file, key);
    const image = await this.fileLibraryRepository.save({
      originalName: originalFileName,
      contentType: file?.mimetype,
      url: key,
      fileSize: file?.size
    });

    hotelAmenity.iconImageUrl = key;
    hotelAmenity.iconImageId = image.id;
    return this.hotelAmenityRepository.save(hotelAmenity);
  }

  async createHotelAmenity(input: HotelAmenityInputDto) {
    try {
      const { ...data } = input;

      // Handle distribution channel based on isSellableOnIbe
      let distributionChannel: DistributionChannelEnum[] = [DistributionChannelEnum.GV_VOICE]; // Default channels
      if (data.isSellableOnIbe !== undefined) {
        if (data.isSellableOnIbe) {
          distributionChannel = [
            DistributionChannelEnum.GV_SALES_ENGINE,
            DistributionChannelEnum.GV_VOICE
          ];
        } else {
          distributionChannel = [DistributionChannelEnum.GV_VOICE];
        }
      }

      // check if selling type is combo, we need to check linked amenity code is valid and same pricing unit
      if (data.sellingType === SellingTypeEnum.COMBO && data.linkedAmenityCode?.length) {
        const basePricingUnit = await this.validateLinkedAmenity(
          data.linkedAmenityCode || [],
          data.hotelId
        );
        data.pricingUnit = basePricingUnit;
      }

      const updateAmenity: Partial<HotelAmenity> = {
        id: uuidv4(),
        name: data.name,
        hotelId: data.hotelId,
        code: data.code,
        amenityType: data.amenityType,
        description: data.description || '',
        status: data.status || AmenityStatusEnum.ACTIVE,
        isePricingDisplayMode: data.isePricingDisplayMode,
        pricingUnit: data.pricingUnit,
        distributionChannel: distributionChannel,
        translations: (data.translationList || [])?.map((translation) => ({
          languageCode: translation.languageCode as LanguageCodeEnum,
          name: translation.name,
          description: translation.description || ''
        })),
        createdBy: this.currentSystem,
        updatedBy: this.currentSystem,
        linkedAmenityCode: [...new Set(data.linkedAmenityCode || [])].join(','),
        sellingType: data.sellingType || SellingTypeEnum.SINGLE
      };

      const newHotelAmenity = await this.hotelAmenityRepository.save(updateAmenity);

      const hotelAmenityPrices: Partial<HotelAmenityPrice>[] = (
        data.hotelAmenityPriceList || []
      )?.map((price) => ({
        hotelAmenityId: newHotelAmenity.id,
        hotelAgeCategoryId: price.hotelAgeCategoryId,
        price: price.price,
        createdBy: this.currentSystem,
        updatedBy: this.currentSystem
      }));

      const newHotelAmenityPrices = await this.hotelAmenityPriceRepository.upsert(
        hotelAmenityPrices,
        {
          conflictPaths: ['hotelAmenityId', 'hotelAgeCategoryId']
        }
      );
      newHotelAmenity.hotelAmenityPrices =
        newHotelAmenityPrices.generatedMaps as HotelAmenityPrice[];

      return newHotelAmenity;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Find all COMBO amenities that reference a specific amenity code in their linkedAmenityCode
   * @param amenityCode - The amenity code to check
   * @param hotelId - The hotel ID to filter by
   * @returns Array of COMBO amenities that reference this code
   */
  private async findComboAmenitiesUsingCode(
    amenityCode: string,
    hotelId: string
  ): Promise<HotelAmenity[]> {
    try {
      // Find all COMBO amenities in the same hotel
      const comboAmenities = await this.hotelAmenityRepository.find({
        where: {
          hotelId,
          sellingType: SellingTypeEnum.COMBO,
          status: AmenityStatusEnum.ACTIVE
        },
        select: ['id', 'code', 'name', 'linkedAmenityCode']
      });

      // Filter to find those that include the amenity code in their linkedAmenityCode
      const matchingCombos = comboAmenities.filter((combo) => {
        if (!combo.linkedAmenityCode) {
          return false;
        }
        const linkedCodes = combo.linkedAmenityCode
          .split(',')
          .map((code) => code.trim())
          .filter((code) => code.length > 0);
        return linkedCodes.includes(amenityCode);
      });

      return matchingCombos;
    } catch (error) {
      throw new BadRequestException(
        `Error checking COMBO amenities for code ${amenityCode}: ${error.message}`
      );
    }
  }

  async deleteHotelAmenity(id: string) {
    try {
      // Get the amenity being deleted to check its code
      const amenityToDelete = await this.hotelAmenityRepository.findOne({
        where: { id },
        select: ['id', 'code', 'name', 'hotelId']
      });

      if (!amenityToDelete) {
        throw new NotFoundException(`Hotel amenity with id ${id} not found`);
      }

      // Check if this amenity is used in any COMBO
      const comboAmenitiesUsingThis = await this.findComboAmenitiesUsingCode(
        amenityToDelete.code,
        amenityToDelete.hotelId
      );

      if (comboAmenitiesUsingThis.length > 0) {
        const comboNames = comboAmenitiesUsingThis.map((c) => c.name || c.code).join(', ');
        throw new BadRequestException(
          `Cannot delete amenity "${amenityToDelete.name || amenityToDelete.code}" because it is assigned to the following COMBO service(s): ${comboNames}. Please remove it from the COMBO service(s) before deleting.`
        );
      }

      await this.hotelAmenityPriceRepository.delete({
        hotelAmenityId: id
      });

      const deletedAmenity = await this.hotelAmenityRepository.delete(id);

      return deletedAmenity;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    filter: HotelAmenityFilter,
    select?: FindOptionsSelect<HotelAmenity>,
    relations?: FindOptionsRelations<HotelAmenity>
  ): Promise<HotelAmenity[]> {
    try {
      const where: FindOptionsWhere<HotelAmenity> = {};

      if (filter.idList && filter.idList.length > 0) {
        where.id = In(filter.idList);
      }
      if (filter.statusList && filter.statusList.length > 0) {
        where.status = In(filter.statusList);
      }

      if (filter.codeList && filter.codeList.length > 0) {
        where.code = In(filter.codeList);
      }

      if (filter.hotelId) {
        where.hotelId = filter.hotelId;
      }
      if (filter.distributionChannelList && filter.distributionChannelList.length > 0) {
        where.distributionChannel = Raw(() => `"distribution_channel" && :distributionChannels`, {
          distributionChannels: filter.distributionChannelList
        });
      }

      const entities = await this.hotelAmenityRepository.find({
        where,
        select,
        relations
      });

      return entities;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get hotel amenities', error.message);
    }
  }
}
