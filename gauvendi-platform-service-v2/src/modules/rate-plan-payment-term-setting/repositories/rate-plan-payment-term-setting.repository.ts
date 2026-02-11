import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { BadRequestException } from '@src/core/exceptions';
import { DbName } from 'src/core/constants/db-name.constant';
import {
  Filter,
  ResponseContent,
  ResponseContentStatusEnum,
  ValidationMessage
} from 'src/core/dtos/common.dto';
import { RatePlanPaymentTermSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { BaseService } from 'src/core/services/base.service';
import {
  DataSource,
  EntityManager,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Raw,
  Repository
} from 'typeorm';
import {
  RatePlanPaymentTermSettingDeleteDto,
  RatePlanPaymentTermSettingFilterDto,
  RatePlanPaymentTermSettingInputDto
} from '../dtos';
import {
  CreateRatePlanPaymentTermSettingInputDto,
  RatePlanPaymentTermSettingDetailInputDto
} from '../dtos/rate-plan-payment-term-setting-input.dto';
import { RatePlanPaymentTermSettingValidationMessage } from '../enums/rate-plan-payment-term-setting-validation-message.enum';

@Injectable()
export class RatePlanPaymentTermSettingRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanPaymentTermSetting, DbName.Postgres)
    private readonly ratePlanPaymentTermSettingRepository: Repository<RatePlanPaymentTermSetting>,

    @InjectRepository(RatePlanDerivedSetting, DbName.Postgres)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(
    filter: {
      ratePlanIds?: string[];
      hotelId?: string;
      isDefault?: boolean;
      supportedPaymentMethodCodes?: string[];
      isHasSupportedPaymentMethod?: boolean;
      relations?: FindOptionsRelations<RatePlanPaymentTermSetting>;
    },
    select?: FindOptionsSelect<RatePlanPaymentTermSetting>
  ) {
    const { ratePlanIds, hotelId, isDefault, supportedPaymentMethodCodes, isHasSupportedPaymentMethod, relations } = filter;
    const where: FindOptionsWhere<RatePlanPaymentTermSetting> = {};

    if (ratePlanIds?.length) {
      where.ratePlanId = In(ratePlanIds);
    }

    if (hotelId) {
      where.hotelId = hotelId;
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }

    if (isHasSupportedPaymentMethod) {
      where.supportedPaymentMethodCodes = Raw((alias) => `array_length(${alias}, 1) > 0`);
    }
    if (supportedPaymentMethodCodes?.length) {
      where.supportedPaymentMethodCodes = Raw(() => `supported_payment_method_codes && :supportedPaymentMethodCodes`, {
        supportedPaymentMethodCodes: supportedPaymentMethodCodes
      });
    }

    return this.ratePlanPaymentTermSettingRepository.find({
      where,
      relations,
      select
    });
  }

  async ratePlanPaymentTermSettingList(filter: RatePlanPaymentTermSettingFilterDto) {
    try {
      // Set default filter values
      filter = this.setDefaultFilterValues(filter);

      // Build query with filters
      const queryBuilder = this.ratePlanPaymentTermSettingRepository.createQueryBuilder('rptps');
      this.applyFilters(queryBuilder, filter);
      Filter.setQueryBuilderRelations(queryBuilder, 'rptps', filter.relations || []);

      const entityList = await queryBuilder.getMany();

      return entityList;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createRatePlanPaymentTermSetting(input: RatePlanPaymentTermSettingInputDto) {
    // Validate input
    const validationResult = this.validateInput(input, 'CREATE');
    if (!validationResult.success) {
      return new ResponseContent(validationResult, ResponseContentStatusEnum.ERROR);
    }

    // Create entity
    const entity = this.mapInputToEntity(input, input.hotelId, input.ratePlanId);
    if (entity.isDefault === null || entity.isDefault === undefined) {
      entity.isDefault = false;
    }

    const savedEntity = await this.ratePlanPaymentTermSettingRepository.save(entity);

    return new ResponseContent(
      new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.CREATE_SUCCESS),
      ResponseContentStatusEnum.SUCCESS,
      savedEntity
    );
  }

  async createRatePlanPaymentTermSettingList(
    input: CreateRatePlanPaymentTermSettingInputDto,
    transactionalEntityManager?: EntityManager
  ) {
    if (!input || !input.detailsInputList?.length) {
      return new ResponseContent(
        new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.NULL_INPUT, false),
        ResponseContentStatusEnum.ERROR
      );
    }

    // Use transactional manager if provided, otherwise use default repository
    const repo = transactionalEntityManager
      ? transactionalEntityManager.getRepository(RatePlanPaymentTermSetting)
      : this.ratePlanPaymentTermSettingRepository;

    // Check for existing items
    const { hotelId, ratePlanId } = input;
    const hotelPaymentTermIdList = [
      ...new Set(input.detailsInputList.map((input) => input.hotelPaymentTermId))
    ];

    const existingItems = await repo.find({
      where: {
        hotelId: hotelId,
        ratePlanId: ratePlanId,
        hotelPaymentTermId: In(hotelPaymentTermIdList)
      }
    });

    if (existingItems.length) {
      return new ResponseContent(
        new ValidationMessage(
          RatePlanPaymentTermSettingValidationMessage.EXISTED_SALES_PLAN_PAYMENT_TERM_SETTING,
          false
        ),
        ResponseContentStatusEnum.ERROR
      );
    }

    // Create entities
    const createList = input.detailsInputList.map((input) =>
      this.mapInputToEntity(input, hotelId, ratePlanId)
    );
    const savedEntities = await repo.save(createList);

    // Check and set default item if none exists
    const allEntities = await repo.find({
      where: {
        hotelId: hotelId,
        ratePlanId: ratePlanId
      }
    });

    const hasDefault = allEntities.some((entity) => entity.isDefault === true);
    if (!hasDefault && allEntities.length) {
      allEntities[0].isDefault = true;
      await repo.save(allEntities[0]);
    }

    return new ResponseContent(
      new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.CREATE_SUCCESS),
      ResponseContentStatusEnum.SUCCESS,
      savedEntities
    );
  }

  async updateRatePlanPaymentTermSetting(input: RatePlanPaymentTermSettingInputDto) {
    const validationResult = this.validateInput(input, 'UPDATE');
    if (!validationResult.success) {
      return new ResponseContent(validationResult, ResponseContentStatusEnum.ERROR);
    }

    const existedEntity = await this.ratePlanPaymentTermSettingRepository.findOne({
      where: { id: input.id }
    });

    if (!existedEntity) {
      return new ResponseContent(
        new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.NOT_FOUND, false),
        ResponseContentStatusEnum.ERROR
      );
    }

    const derivedSetting = await this.ratePlanDerivedSettingRepository.find({
      where: {
        hotelId: existedEntity.hotelId,
        derivedRatePlanId: existedEntity.ratePlanId,
        followDailyPaymentTerm: true
      },
      select: {
        id: true,
        ratePlanId: true,
        derivedRatePlanId: true,
      }
    });

    
    // Update fields
    existedEntity.supportedPaymentMethodCodes = input.supportedPaymentMethodCodes || [];

    existedEntity.isDefault = input.isDefault || false;


    const followRatePlanIds = derivedSetting.map((setting) => setting.ratePlanId);

    // Handle default logic - only one can be default per rate plan
    if (input.isDefault) {
      const otherDefaultItems = await this.ratePlanPaymentTermSettingRepository.find({
        where: {
          hotelId: existedEntity.hotelId,
          ratePlanId: In([...followRatePlanIds, existedEntity.ratePlanId]),
          isDefault: true
        }
      });

      for (const item of otherDefaultItems) {
        if (item.id !== existedEntity.id) {
          item.isDefault = false;
        }
      }

      await this.ratePlanPaymentTermSettingRepository.save(otherDefaultItems);
    }

    if (followRatePlanIds && followRatePlanIds.length > 0) {
      const followRatePlanPaymentTermSettings = await this.ratePlanPaymentTermSettingRepository.find({
        where: {
          hotelId: existedEntity.hotelId,
          ratePlanId: In(followRatePlanIds),
          hotelPaymentTermId: existedEntity.hotelPaymentTermId,
        },
      });
      
      for (const item of followRatePlanPaymentTermSettings) {
        item.isDefault = true;
      }

      await this.ratePlanPaymentTermSettingRepository.save(followRatePlanPaymentTermSettings);
    }

    const updatedEntity = await this.ratePlanPaymentTermSettingRepository.save(existedEntity);

    return new ResponseContent(
      new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.UPDATE_SUCCESS),
      ResponseContentStatusEnum.SUCCESS,
      updatedEntity
    );
  }

  async deleteRatePlanPaymentTermSetting(
    input: RatePlanPaymentTermSettingDeleteDto
  ): Promise<ResponseContent<null>> {
    if (!input.id) {
      return new ResponseContent(
        new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.REQUIRE_ID, false),
        ResponseContentStatusEnum.ERROR
      );
    }

    const whereCondition: any = {};
    if (input.id) {
      whereCondition.id = input.id;
    }

    const existedEntityList = await this.ratePlanPaymentTermSettingRepository.find({
      where: whereCondition
    });

    if (!existedEntityList || !existedEntityList.length) {
      return new ResponseContent(
        new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.NOT_FOUND, false),
        ResponseContentStatusEnum.ERROR
      );
    }

    await this.ratePlanPaymentTermSettingRepository.remove(existedEntityList);

    return new ResponseContent(
      new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.DELETE_SUCCESS),
      ResponseContentStatusEnum.SUCCESS,
      null
    );
  }

  private setDefaultFilterValues(
    filter: RatePlanPaymentTermSettingFilterDto
  ): RatePlanPaymentTermSettingFilterDto {
    return {
      ...filter
      // Add any default values here
    };
  }

  private applyFilters(queryBuilder: any, filter: RatePlanPaymentTermSettingFilterDto): void {
    if (filter.idList?.length) {
      queryBuilder.andWhere('rptps.id IN (:...idList)', { idList: filter.idList });
    }

    if (filter.ratePlanIdList?.length) {
      queryBuilder.andWhere('rptps.ratePlanId IN (:...ratePlanIdList)', {
        ratePlanIdList: filter.ratePlanIdList
      });
    }

    if (filter.hotelId) {
      queryBuilder.andWhere('rptps.hotelId = :hotelId', { hotelId: filter.hotelId });
    }

    if (filter.hotelIdList?.length) {
      queryBuilder.andWhere('rptps.hotelId IN (:...hotelIdList)', {
        hotelIdList: filter.hotelIdList
      });
    }

    if (filter.hotelPaymentTermIdList?.length) {
      queryBuilder.andWhere('rptps.hotelPaymentTermId IN (:...hotelPaymentTermIdList)', {
        hotelPaymentTermIdList: filter.hotelPaymentTermIdList
      });
    }

    if (filter.supportedPaymentMethodCodes?.length) {
      queryBuilder.andWhere('rptps.supportedPaymentMethodCodes && :supportedPaymentMethodCodes', {
        supportedPaymentMethodCodes: filter.supportedPaymentMethodCodes
      });
    }

    if (filter.isDefault !== undefined && filter.isDefault !== null) {
      queryBuilder.andWhere('rptps.isDefault = :isDefault', { isDefault: filter.isDefault });
    }
  }

  private validateInput(
    input: RatePlanPaymentTermSettingDetailInputDto,
    action: 'CREATE' | 'UPDATE'
  ): ValidationMessage {
    if (!input) {
      return new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.NULL_INPUT, false);
    }

    if (action === 'UPDATE' && !input.hotelPaymentTermId) {
      return new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.NOT_FOUND, false);
    }

    // Add more validation as needed
    return new ValidationMessage(RatePlanPaymentTermSettingValidationMessage.CREATE_SUCCESS, true);
  }

  private mapInputToEntity(
    input: RatePlanPaymentTermSettingDetailInputDto,
    hotelId: string,
    ratePlanId: string
  ): RatePlanPaymentTermSetting {
    const entity = new RatePlanPaymentTermSetting();
    entity.hotelId = hotelId;
    entity.ratePlanId = ratePlanId;
    entity.hotelPaymentTermId = input.hotelPaymentTermId;
    entity.supportedPaymentMethodCodes = input.supportedPaymentMethodCodes || [];
    entity.isDefault = input.isDefault || false;
    return entity;
  }
}
