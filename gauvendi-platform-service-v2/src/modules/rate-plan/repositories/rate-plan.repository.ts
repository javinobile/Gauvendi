import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { ConfigService } from '@nestjs/config';
import { Filter } from '@src/core/dtos/common.dto';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from '@src/core/entities/hotel-entities/hotel-tax.entity';
import { RatePlanDailyAdjustment } from '@src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanSellability } from '@src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomProductPricingMethodDetailService } from '@src/modules/room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.service';
import { DbName } from 'src/core/constants/db-name.constant';
import {
  RatePlanDerivedSettingFilter,
  RatePlanDerivedSettingInput
} from 'src/core/dtos/rate-plan-derived-setting.dto';
import { RatePlanTranslation } from 'src/core/entities/pricing-entities/rate-plan-translation.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import {
  CancellationFeeUnitEnum,
  CancellationPolicyDisplayUnitEnum,
  LanguageCodeEnum,
  RatePlanAdjustmentType,
  RatePlanPricingMethodologyEnum,
  RatePlanStatusEnum,
  RatePlanTypeEnum,
  RoundingModeEnum,
  SellingStrategyTypeEnum,
  ServiceTypeEnum
} from 'src/core/enums/common';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import {
  DataSource,
  EntityManager,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  IsNull,
  Like,
  Not,
  Raw,
  Repository
} from 'typeorm';
import { RatePlanPaymentTermSettingFilterDto } from '../../rate-plan-payment-term-setting/dtos/rate-plan-payment-term-setting-filter.dto';
import {
  CreateRatePlanPaymentTermSettingInputDto,
  RatePlanPaymentTermSettingDetailInputDto
} from '../../rate-plan-payment-term-setting/dtos/rate-plan-payment-term-setting-input.dto';
import { RatePlanPaymentTermSettingRepository } from '../../rate-plan-payment-term-setting/repositories/rate-plan-payment-term-setting.repository';
import { RestrictionService } from '../../restriction/restriction.service';
import {
  CloneRatePlanDto,
  CreateRatePlanDto,
  DeleteRatePlanPayloadDto,
  RatePlanFilterDto,
  SmartFindingPromoCodeDto,
  SmartFindingPromoCodeFilterDto,
  UpdateRatePlanDto,
  UpsertSalesPlanSellAbilityDto
} from '../dto';
import {
  RatePlanRfcAssignmentShowModeEnum,
  RoomProductAssignToRatePlanDto,
  RoomProductAssignToRatePlanFilterDto
} from '../dto/room-product-assign-to-rate-plan';
import { DistributionChannel } from '../enums';
import {
  RatePlanValidationMessage,
  RatePlanValidationMessages
} from '../validators/rate-plan-validation-message.enum';
import { RatePlanDerivedSettingRepository } from './rate-plan-derived-setting.repository';
import { GOOGLE_INTERFACE_SERVICE } from '@src/core/client/google-interface-client.module';
import { ClientProxy } from '@nestjs/microservices';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';

@Injectable()
export class RatePlanRepository extends BaseService {
  private readonly logger = new Logger(RatePlanRepository.name);

  constructor(
    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,
    @InjectRepository(RoomProductRatePlan, DbName.Postgres)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,
    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,
    @InjectRepository(RatePlanSellability, DbName.Postgres)
    private readonly ratePlanSellabilityRepository: Repository<RatePlanSellability>,

    @InjectRepository(RatePlanDailyAdjustment, DbName.Postgres)
    private readonly ratePlanDailyAdjustmentRepository: Repository<RatePlanDailyAdjustment>,

    @InjectRepository(Reservation, DbName.Postgres)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly ratePlanDerivedSettingRepository: RatePlanDerivedSettingRepository,
    private readonly ratePlanPaymentTermSettingRepositoryService: RatePlanPaymentTermSettingRepository,
    configService: ConfigService,
    private readonly restrictionService: RestrictionService,
    private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService,

    @Inject(GOOGLE_INTERFACE_SERVICE) private readonly googleService: ClientProxy
  ) {
    super(configService);
  }

  async getRatePlan(body: {
    id?: string;
    hotelId?: string;
    code?: string;
  }): Promise<RatePlan | null> {
    try {
      const result = await this.ratePlanRepository.findOne({
        where: {
          ...(body.id && { id: body.id }),
          ...(body.hotelId && { hotelId: body.hotelId }),
          ...(body.code && { code: body.code })
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting rate plan', error);
      throw new BadRequestException('Error getting rate plan');
    }
  }

  async getRatePlanListBySalesPlanIds(salesPlanIds: string[]): Promise<RatePlan[]> {
    try {
      const result = await this.ratePlanRepository.find({
        where: {
          id: In(salesPlanIds)
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting rate plan list by sales plan ids', error);
      throw new BadRequestException('Error getting rate plan list by sales plan ids');
    }
  }

  async create(input: CreateRatePlanDto): Promise<RatePlan> {
    try {
      const savedRatePlan = await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          // Check if rate plan with same code already exists
          const existingRatePlan = await transactionalEntityManager.findOne(RatePlan, {
            where: { hotelId: input.hotelId, code: input.code }
          });

          if (existingRatePlan) {
            throw new BadRequestException('Rate plan with this code already exists');
          }

          // Handle derived pricing setup before saving entity
          let followSalesPlanPaymentTermList: any[] = [];
          if (input.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING) {
            if (input.ratePlanDerivedSetting) {
              const setting = input.ratePlanDerivedSetting;
              const parentRatePlanId = setting.ratePlanId;

              // Find parent rate plan
              const parentRatePlan = await transactionalEntityManager.findOne(RatePlan, {
                where: { id: parentRatePlanId, hotelId: input.hotelId }
              });

              if (parentRatePlan) {
                // Copy cancellation policy if followDailyCxlPolicy is true
                if (setting.followDailyCxlPolicy) {
                  input.hotelCxlPolicyCode = parentRatePlan.hotelCxlPolicyCode;
                }

                // Fetch parent payment term settings if followDailyPaymentTerm is true
                if (setting.followDailyPaymentTerm) {
                  const paymentTermFilter: RatePlanPaymentTermSettingFilterDto = {
                    hotelIdList: [input.hotelId],
                    ratePlanIdList: [parentRatePlanId]
                  };

                  followSalesPlanPaymentTermList =
                    await this.ratePlanPaymentTermSettingRepositoryService.ratePlanPaymentTermSettingList(
                      paymentTermFilter
                    );
                }
              }
            }
          }

          const entity = this.inputToEntity(input, 'create');
          const hotelTaxes = await transactionalEntityManager.find(HotelTax, {
            where: {
              hotelId: input.hotelId,
              isDefault: true
            }
          });

          const hotelTaxSettings: HotelTaxSetting[] = [];
          if (hotelTaxes && hotelTaxes.length > 0) {
            for (const hotelTax of hotelTaxes) {
              hotelTaxSettings.push(
                await transactionalEntityManager.create(HotelTaxSetting, {
                  hotelId: input.hotelId,
                  serviceCode: entity.code,
                  serviceType: ServiceTypeEnum.ACCOMMODATION,
                  taxCode: hotelTax.code,
                  description: hotelTax.description
                })
              );
            }

            await transactionalEntityManager.save(hotelTaxSettings);
          }

          // Save entity
          const savedEntity = await transactionalEntityManager.save(RatePlan, entity);

          // map rate plan id to translations
          const newTranslations = input.translationList?.map((translation) => ({
            ...translation,
            ratePlanId: savedEntity.id,
            hotelId: input.hotelId
          }));

          if (newTranslations?.length && newTranslations.length > 0) {
            await transactionalEntityManager.upsert(RatePlanTranslation, newTranslations, {
              conflictPaths: ['hotelId', 'ratePlanId', 'languageCode']
            });
          }

          // Handle primary flag
          if (input.isPrimary) {
            await this.updateOtherRatePlansAsPrimary(
              savedEntity.id,
              input.hotelId,
              false,
              transactionalEntityManager
            );
          }

          // Handle derived settings for derived pricing
          if (input.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING) {
            if (input.ratePlanDerivedSetting) {
              const parentRatePlanId = input.ratePlanDerivedSetting.ratePlanId;

              // Check if derived setting already exists
              const ratePlanDerivedSettingFilter: RatePlanDerivedSettingFilter = {
                hotelIdList: [input.hotelId],
                ratePlanIdList: [savedEntity.id],
                derivedRatePlanIdList: [parentRatePlanId]
              };

              const ratePlanDerivedSettings = await this.ratePlanDerivedSettingRepository.findAll(
                ratePlanDerivedSettingFilter
              );

              if (ratePlanDerivedSettings.length === 0) {
                // Create new derived setting
                const derivedInput: RatePlanDerivedSettingInput = {
                  hotelId: input.hotelId,
                  ratePlanId: savedEntity.id,
                  derivedRatePlanId: parentRatePlanId,
                  followDailyCxlPolicy: input.ratePlanDerivedSetting.followDailyCxlPolicy,
                  followDailyPaymentTerm: input.ratePlanDerivedSetting.followDailyPaymentTerm,
                  followDailyIncludedAmenity:
                    input.ratePlanDerivedSetting.followDailyIncludedAmenity,
                  followDailyRoomProductAvailability:
                    input.ratePlanDerivedSetting.followDailyRoomProductAvailability,
                  followDailyRestriction: input.ratePlanDerivedSetting.followDailyRestriction,
                  inheritedRestrictionFields:
                    input.ratePlanDerivedSetting.inheritedRestrictionFields
                };

                await this.ratePlanDerivedSettingRepository.createOrUpdate(
                  derivedInput,
                  transactionalEntityManager
                );

                // Create payment term settings if follow master sales plan
                if (followSalesPlanPaymentTermList.length > 0) {
                  const paymentTermSettingDetails: RatePlanPaymentTermSettingDetailInputDto[] =
                    followSalesPlanPaymentTermList.map((paymentTermSetting) => ({
                      hotelPaymentTermId: paymentTermSetting.hotelPaymentTermId,
                      supportedPaymentMethodCodes:
                        paymentTermSetting.supportedPaymentMethodCodes || [],
                      isDefault: paymentTermSetting.isDefault || false
                    }));

                  const createPaymentTermSettingInput: CreateRatePlanPaymentTermSettingInputDto = {
                    hotelId: input.hotelId,
                    ratePlanId: savedEntity.id,
                    detailsInputList: paymentTermSettingDetails
                  };

                  await this.ratePlanPaymentTermSettingRepositoryService.createRatePlanPaymentTermSettingList(
                    createPaymentTermSettingInput,
                    transactionalEntityManager
                  );
                }
              } else {
                // Master sales plan is already used
                throw new BadRequestException(
                  RatePlanValidationMessages[
                    RatePlanValidationMessage.MASTER_SALES_PLAN_UNAVAILABLE
                  ]
                );
              }
            } else {
              throw new BadRequestException(
                RatePlanValidationMessages[RatePlanValidationMessage.SETUP_DERIVED_SETTINGS_FAILED]
              );
            }
          }

          // Return saved entity (transaction will auto-commit if no errors)
          return savedEntity;
        }
      );

      // trigger copy of restriction if followDailyRestriction is true
      if (input.ratePlanDerivedSetting?.followDailyRestriction) {
        await this.restrictionService.copyRestriction(
          savedRatePlan.hotelId,
          input.ratePlanDerivedSetting.ratePlanId
        );
      }

      return savedRatePlan;
    } catch (error) {
      this.logger.error('Failed to create rate plan', JSON.stringify(error));

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to create rate plan', error.message);
    }
  }

  async upsertSalesPlanSellAbility(payload: UpsertSalesPlanSellAbilityDto) {
    try {
      const { salePlanId, hotelId, sellabilityList } = payload;

      const ratePlan = await this.ratePlanRepository.findOne({
        where: { id: salePlanId, hotelId }
      });

      if (!ratePlan) {
        throw new BadRequestException(
          RatePlanValidationMessages[RatePlanValidationMessage.NOT_FOUND]
        );
      }

      const ratePlanSellability = await this.ratePlanSellabilityRepository.upsert(
        {
          hotelId,
          ratePlanId: salePlanId,
          distributionChannel: sellabilityList
            .filter((sellability) => sellability.isSellable)
            .map((sellability) => sellability.distributionChannel)
        },
        {
          conflictPaths: ['hotelId', 'ratePlanId']
        }
      );

      return ratePlanSellability;
    } catch (error) {
      throw new BadRequestException('Failed to upsert sales plan sell ability', error.message);
    }
  }

  async update(id: string, data: UpdateRatePlanDto): Promise<RatePlan> {
    try {
      // Find existing entity
      const existingEntity = await this.ratePlanRepository.findOne({
        where: { id }
      });

      if (!existingEntity) {
        throw new BadRequestException(
          RatePlanValidationMessages[RatePlanValidationMessage.NOT_FOUND]
        );
      }

      // Update entity
      data.id = id;
      const updatedEntity = this.updateInputToEntity(data);

      if (existingEntity.status === RatePlanStatusEnum.ARCHIVE) {
        const ratePlanSellability = await this.ratePlanSellabilityRepository.findOne({
          where: { hotelId: data.hotelId, ratePlanId: id }
        });

        if (ratePlanSellability) {
          ratePlanSellability.distributionChannel = [];
          await this.ratePlanSellabilityRepository.save(ratePlanSellability);
        }
      }

      // Remove translations from updatedEntity to avoid conflicts during save
      const { ratePlanTranslations, ...entityWithoutTranslations } = updatedEntity;

      // Save the main entity first
      const savedEntity = await this.ratePlanRepository.save({
        ...existingEntity,
        ...entityWithoutTranslations,
        translations:
          data.translationList?.map((translation) => ({
            languageCode: translation.languageCode as LanguageCodeEnum,
            name: translation.name,
            description: translation.description
          })) || []
      });

      // Handle primary flag
      if (data.isPrimary) {
        await this.updateOtherRatePlansAsPrimary(savedEntity.id, data.hotelId, false);
      }

      // sync price
      // if ajustment change, need to sync price
      // if rounding mode change, need to sync price
      if (
        data.adjustmentValue !== existingEntity.adjustmentValue ||
        data.adjustmentUnit !== existingEntity.adjustmentUnit ||
        data.roundingMode !== existingEntity.roundingMode
      ) {
        await this.roomProductPricingMethodDetailService.triggerAllRoomProductPricingMethodDetail({
          hotelId: data.hotelId,
          ratePlanIds: [savedEntity.id]
        });
      }

      if (
        data.rfcAttributeMode !== existingEntity.rfcAttributeMode ||
        data.mrfcPositioningMode !== existingEntity.mrfcPositioningMode
      ) {
        await this.roomProductPricingMethodDetailService.triggerAllPricing({
          hotelId: data.hotelId,
          ratePlanIds: [savedEntity.id],
          isPushToPms: true
        });
      }

      //
      if (existingEntity.status === RatePlanStatusEnum.ACTIVE) {
        this.triggerUpdateWhipRatePlan(existingEntity.hotelId, [existingEntity.id]);
      }

      // Map to DTO and return
      return savedEntity;
    } catch (error) {
      console.log('error', error);
      throw new BadRequestException('Failed to update rate plan', error.message);
    }
  }

  async delete(input: DeleteRatePlanPayloadDto): Promise<RatePlan> {
    try {
      if (!input.id || !input.hotelId) {
        throw new BadRequestException('Id and hotelId are required');
      }

      // Find entity
      const entity = await this.ratePlanRepository.findOne({
        where: { id: input.id }
      });

      if (!entity) {
        throw new BadRequestException(
          RatePlanValidationMessages[RatePlanValidationMessage.NOT_FOUND]
        );
      }

      const ratePlanArchivedIds: string[] = [input.id];

      // Check for derived rate plans that depend on this one
      const derivedSettings = await this.ratePlanDerivedSettingRepository.findByDerivedRatePlanId(
        input.hotelId,
        input.id
      );

      if (derivedSettings.length > 0) {
        // Check if derived rate plans still exist
        const derivedRatePlanIds = derivedSettings.map((ds) => ds.ratePlanId);
        const existingDerivedRatePlans = await this.ratePlanRepository.find({
          where: {
            hotelId: input.hotelId,
            id: In(derivedRatePlanIds)
          }
        });

        if (existingDerivedRatePlans?.length && existingDerivedRatePlans.length > 0) {
          ratePlanArchivedIds.push(...existingDerivedRatePlans.map((rp) => rp.id));
        }

        // if (existingDerivedRatePlans.length > 0) {
        //   throw new BadRequestException(
        //     RatePlanValidationMessages[RatePlanValidationMessage.SALES_PLAN_HAS_DERIVED_SALES_PLANS]
        //   );
        // }
      }

      const reservationCount = await this.reservationRepository.count({
        where: {
          ratePlanId: In(ratePlanArchivedIds),
          hotelId: entity.hotelId,
          deletedAt: IsNull()
        }
      });

      const roomProductRatePlanCount = await this.roomProductRatePlanRepository.count({
        where: {
          ratePlanId: In(ratePlanArchivedIds),
          hotelId: entity.hotelId
        }
      });

      if (reservationCount > 0 || roomProductRatePlanCount > 0) {
        await this.ratePlanRepository.update(
          {
            hotelId: input.hotelId,
            id: In(ratePlanArchivedIds)
          },
          { status: RatePlanStatusEnum.ARCHIVE }
        );
      } else {
        await this.ratePlanRepository.softDelete(ratePlanArchivedIds);
      }

      // await this.ratePlanDerivedSettingRepository.deleteByRatePlanId(input.hotelId, input.id);

      // Execute delete
      // await this.ratePlanRepository.remove(entity);

      // Clean up derived settings for this rate plan

      // Old logic: RatePlanServiceImpl.java line 828

      // New logic: Set status of all rate plan is ARCHIVE

      return entity;
    } catch (error) {
      console.log('error', error);
      throw new BadRequestException('Failed to delete rate plan', error.message);
    }
  }

  async clone(input: CloneRatePlanDto): Promise<RatePlan> {
    try {
      // Note: In the Java implementation, this uses a stored procedure
      // For now, we'll implement a basic clone functionality
      // In production, you might want to implement the stored procedure call

      const sourceEntity = await this.ratePlanRepository.findOne({
        where: { id: input.ratePlanId, hotelId: input.hotelId }
      });

      if (!sourceEntity) {
        throw new BadRequestException(
          RatePlanValidationMessages[RatePlanValidationMessage.NOT_FOUND]
        );
      }

      // Create a copy of the entity (without ID)
      const { id, createdAt, updatedAt, ...clonedEntity } = sourceEntity;

      // Modify the code to make it unique
      clonedEntity.code = `${sourceEntity.code}_COPY_${Date.now()}`;
      clonedEntity.name = `${sourceEntity.name} (Copy)`;
      clonedEntity.isPrimary = false; // Cloned rate plan should not be primary

      const savedEntity = await this.ratePlanRepository.save(clonedEntity);

      return savedEntity;
    } catch (error) {
      throw new BadRequestException(
        RatePlanValidationMessages[RatePlanValidationMessage.CLONE_RATE_PLAN_FAILED],
        error.message
      );
    }
  }

  async smartFindingPromoCode(
    filter: SmartFindingPromoCodeFilterDto
  ): Promise<SmartFindingPromoCodeDto[]> {
    // This would typically use a raw SQL query as in the Java implementation
    // For now, implementing a basic version using TypeORM

    const queryBuilder = this.ratePlanRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.ratePlanTranslations', 'rpt')
      .where('rp.hotelId = :hotelId', { hotelId: filter.propertyId })
      .andWhere('rp.status = :status', { status: 'ACTIVE' })
      .andWhere(
        '(rp.name LIKE :query OR rpt.name LIKE :query OR rp.promoCodes::text LIKE :query)',
        { query: `%${filter.query}%` }
      );

    const ratePlans = await queryBuilder.getMany();

    const searchResult: SmartFindingPromoCodeDto[] = [];

    for (const ratePlan of ratePlans) {
      if (ratePlan.promoCodes && ratePlan.promoCodes.length > 0) {
        for (const promoCode of ratePlan.promoCodes) {
          if (promoCode.toLowerCase().includes(filter.query.toLowerCase())) {
            searchResult.push({
              code: promoCode,
              salesPlanId: ratePlan.id,
              salesPlanCode: ratePlan.code,
              salesPlanName: ratePlan.name,
              type: ratePlan.type
            });
          }
        }
      }
    }

    return searchResult;
  }

  private inputToEntity(input: CreateRatePlanDto, mode: 'create'): RatePlan;
  private inputToEntity(input: UpdateRatePlanDto, mode: 'update'): RatePlan;
  private inputToEntity(
    input: UpdateRatePlanDto | CreateRatePlanDto,
    mode: 'create' | 'update'
  ): RatePlan {
    const entity = {} as RatePlan;

    // Required fields
    entity.hotelId = input.hotelId;

    if (input.id) {
      entity.id = input.id;
    }

    if (input.code) {
      entity.code = input.code.toUpperCase();
    }

    if (input.name) {
      entity.name = input.name;
    }

    entity.hotelCxlPolicyCode = input.hotelCxlPolicyCode || 'FLEXIBLE';

    // Optional fields with defaults
    entity.sellingStrategyType = input.sellingStrategyType || SellingStrategyTypeEnum.DEFAULT;
    entity.status = input.status || RatePlanStatusEnum.ACTIVE;
    entity.type = input.type || RatePlanTypeEnum.PUBLIC;
    entity.roundingMode = input.roundingMode || RoundingModeEnum.NO_ROUNDING;

    entity.paymentTermCode = input.paymentTermCode || undefined;
    entity.payAtHotel = input.payAtHotel || 0;
    entity.payOnConfirmation = input.payOnConfirmation || 0;
    entity.hourPrior = input.hourPrior || 0;
    entity.displayUnit = input.displayUnit || CancellationPolicyDisplayUnitEnum.DAY || undefined;
    entity.cancellationFeeValue = input.cancellationFeeValue || 0;
    entity.cancellationFeeUnit = input.cancellationFeeUnit || CancellationFeeUnitEnum.PERCENTAGE;
    entity.description = input.description || '';
    entity.adjustmentValue = input.adjustmentValue || 0;
    entity.adjustmentUnit = input.adjustmentUnit || RatePlanAdjustmentType.FIXED;
    entity.isPrimary = input.isPrimary || false;
    entity.mrfcPositioningMode = input.mrfcPositioningMode || false;
    entity.rfcAttributeMode = input.rfcAttributeMode || false;

    if (mode === 'create') {
      entity.pricingMethodology =
        input['pricingMethodology'] || RatePlanPricingMethodologyEnum.FEATURE_BASED_PRICING;
    }

    entity.marketSegmentId = input.marketSegmentId || '';
    entity.pmsMappingRatePlanCode = input.mappingRatePlanCode || '';
    entity.promoCodes = input.promoCodeList || [];

    if (entity.status === RatePlanStatusEnum.ARCHIVE) {
      entity.distributionChannel = [];
    } else {
      entity.distributionChannel = input.distributionChannelList || [
        DistributionChannel.GV_SALES_ENGINE,
        DistributionChannel.GV_VOICE
      ];
    }

    entity.hotelExtrasCodeList = input.hotelExtrasCodeList?.join(',') || '';

    // Set default selling strategy type if not provided
    if (!entity.sellingStrategyType) {
      entity.sellingStrategyType = SellingStrategyTypeEnum.DEFAULT;
    }

    if (input.translationList && input.translationList.length > 0 && entity.id) {
      entity.ratePlanTranslations =
        input.translationList?.map((t) => {
          const translation = new RatePlanTranslation();
          translation.hotelId = input.hotelId;
          translation.ratePlanId = entity.id;
          translation.languageCode = t.languageCode;
          translation.name = t.name;
          translation.description = t.description;

          if (!this.isProd) {
            translation.createdBy = this.currentSystem;
            translation.updatedBy = this.currentSystem;
          }

          return translation;
        }) || [];
    }

    if (!this.isProd) {
      entity.createdBy = this.currentSystem;
      entity.updatedBy = this.currentSystem;
    }

    return entity;
  }

  private updateInputToEntity(input: UpdateRatePlanDto): RatePlan {
    const entity = {} as RatePlan;

    // Required fields
    entity.id = input.id || '';
    entity.hotelId = input.hotelId;
    entity.name = input.name || '';
    // Optional fields with defaults
    entity.sellingStrategyType = input.sellingStrategyType || SellingStrategyTypeEnum.DEFAULT;
    entity.status = input.status || RatePlanStatusEnum.ACTIVE;
    entity.type = input.type || RatePlanTypeEnum.PUBLIC;
    entity.roundingMode = input.roundingMode || RoundingModeEnum.NO_ROUNDING;
    entity.description = input.description || '';
    entity.adjustmentValue = input.adjustmentValue || 0;
    entity.adjustmentUnit = input.adjustmentUnit || RatePlanAdjustmentType.FIXED;
    entity.isPrimary = input.isPrimary || false;
    entity.mrfcPositioningMode = input.mrfcPositioningMode || false;
    entity.rfcAttributeMode = input.rfcAttributeMode || false;
    entity.marketSegmentId = input.marketSegmentId || '';
    entity.pmsMappingRatePlanCode = input.mappingRatePlanCode || '';
    entity.promoCodes = input.promoCodeList || [];
    if (entity.status === RatePlanStatusEnum.ARCHIVE) {
      entity.distributionChannel = [];
    } else {
      entity.distributionChannel = input.distributionChannelList || [
        DistributionChannel.GV_SALES_ENGINE,
        DistributionChannel.GV_VOICE
      ];
    }
    entity.hotelExtrasCodeList = input.hotelExtrasCodeList?.join(',') || '';
    // Set default selling strategy type if not provided
    entity.sellingStrategyType = SellingStrategyTypeEnum.DEFAULT;
    if (input.translationList && input.translationList.length > 0 && entity.id) {
      entity.ratePlanTranslations =
        input.translationList?.map((t) => {
          const translation = new RatePlanTranslation();
          translation.hotelId = input.hotelId;
          translation.ratePlanId = entity.id;
          translation.languageCode = t.languageCode;
          translation.name = t.name;
          translation.description = t.description;

          if (!this.isProd) {
            translation.createdBy = this.currentSystem;
            translation.updatedBy = this.currentSystem;
          }

          return translation;
        }) || [];
    }
    entity.updatedBy = this.currentSystem;
    return entity;
  }

  private async updateOtherRatePlansAsPrimary(
    excludeId: string,
    hotelId: string,
    isPrimary: boolean,
    transactionalEntityManager?: EntityManager
  ): Promise<void> {
    const repo = transactionalEntityManager
      ? transactionalEntityManager.getRepository(RatePlan)
      : this.ratePlanRepository;

    await repo.update(
      {
        hotelId,
        id: Not(excludeId)
      },
      { isPrimary }
    );
  }

  async getList(filterDto: RatePlanFilterDto): Promise<RatePlan[]> {
    const {
      hotelId,
      idList,
      id,
      hotelIdList,
      code,
      codeList,
      name,
      statusList,
      roundingMode,
      typeList,
      isPrimary,
      promoCodeList,
      distributionChannelList
    } = filterDto;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    const where: any = {
      hotelId
    };

    if (idList && idList.length > 0) {
      where.id = In(idList);
    }

    if (id) {
      where.id = id;
    }

    if (hotelIdList && hotelIdList.length > 0) {
      where.hotelId = In(hotelIdList);
    }

    if (code) {
      where.code = code;
    }

    if (codeList && codeList.length > 0) {
      where.code = In(codeList);
    }

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (statusList && statusList.length > 0) {
      where.status = In(statusList);
    }

    if (roundingMode) {
      where.roundingMode = roundingMode;
    }

    if (typeList && typeList.length > 0) {
      where.type = In(typeList);
    }

    if (isPrimary !== undefined) {
      where.isPrimary = isPrimary;
    }

    if (promoCodeList && promoCodeList.length > 0) {
      where.promoCodes = Raw(() => `promo_codes && :promoCodes`, { promoCodes: promoCodeList });
    }

    if (distributionChannelList && distributionChannelList.length > 0) {
      where.distributionChannel = Raw(() => `distribution_channel && :distributionChannel`, {
        distributionChannel: distributionChannelList
      });
    }

    // Fetch all rate plans with derived settings
    const ratePlans = await this.ratePlanRepository.find({
      where,
      order: {
        isPrimary: 'DESC',
        name: 'ASC'
      },
      select: {
        id: true,
        name: true,
        code: true,
        isPrimary: true,
        roundingMode: true,
        status: true,
        description: true,
        pricingMethodology: true,
        promoCodes: true,
        distributionChannel: true,
        rfcAttributeMode: true,
        mrfcPositioningMode: true,
        hotelExtrasCodeList: true,
        adjustmentValue: true,
        adjustmentUnit: true,
        hotelCxlPolicyCode: true,
        paymentTermCode: true,

        baseSetting: {
          ratePlanId: true,
          derivedRatePlanId: true,
          followDailyPaymentTerm: true,
          followDailyCxlPolicy: true,
          followDailyIncludedAmenity: true,
          followDailyRoomProductAvailability: true,
          followDailyRestriction: true
        }
      },
      relations: ['baseSetting']
    });

    return ratePlans;
  }

  async findRoomProductAssignToRatePlan(
    filter: RoomProductAssignToRatePlanFilterDto
  ): Promise<RoomProductAssignToRatePlanDto[]> {
    try {
      const { hotelId, codeList, type, statusList, ratePlanIdList, showMode } = filter;

      const roomProductRatePlans = await this.roomProductRatePlanRepository.find({
        where: {
          hotelId,
          ratePlanId: In(ratePlanIdList || [])
        },
        select: {
          id: true,
          roomProductId: true
        }
      });

      const roomProductInputIds = roomProductRatePlans.map(
        (roomProductRatePlan) => roomProductRatePlan.roomProductId
      );

      if (roomProductInputIds.length === 0) {
        return [];
      }

      const roomProductWhere: FindOptionsWhere<RoomProduct> = {
        hotelId,
        deletedAt: IsNull()
      };

      if (codeList?.length) {
        roomProductWhere.code = In(codeList);
      }

      if (type) {
        roomProductWhere.type = type;
      }

      if (statusList?.length) {
        roomProductWhere.status = In(statusList);
      }

      switch (showMode) {
        case RatePlanRfcAssignmentShowModeEnum.ASSIGNED:
          roomProductWhere.id = In(roomProductInputIds);
          break;
        case RatePlanRfcAssignmentShowModeEnum.UNASSIGNED:
          roomProductWhere.id = Not(In(roomProductInputIds));
          break;
      }

      let order: FindOptionsOrder<RoomProduct> = {};

      order = Filter.setOptionSort(order, filter.sort || []);

      const roomProducts = await this.roomProductRepository.find({
        where: roomProductWhere,
        order
      });

      for (const roomProduct of roomProducts) {
        roomProduct.roomProductRatePlans = roomProductRatePlans.filter(
          (roomProductRatePlan) => roomProductRatePlan.roomProductId === roomProduct.id
        );
      }

      return roomProducts;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get room product assignment to rate plan',
        error.message
      );
    }
  }

  async findAllNoRelations(
    filterDto: RatePlanFilterDto,
    select?: FindOptionsSelect<RatePlan>
  ): Promise<RatePlan[]> {
    const {
      hotelId,
      idList,
      id,
      hotelIdList,
      code,
      codeList,
      name,
      statusList,
      roundingMode,
      typeList,
      isPrimary,
      promoCodeList,
      distributionChannelList,
      languageCodeList
    } = filterDto;

    const where: FindOptionsWhere<RatePlan> = {};

    if (hotelIdList && hotelIdList.length > 0) {
      where.hotelId = In(hotelIdList);
    } else if (hotelId) {
      where.hotelId = hotelId;
    }

    if (idList && idList.length > 0) {
      where.id = In(idList);
    }

    if (code) {
      where.code = code;
    }

    if (codeList && codeList.length > 0) {
      where.code = In(codeList);
    }

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (statusList && statusList.length > 0) {
      where.status = In(statusList);
    }

    if (roundingMode) {
      where.roundingMode = roundingMode;
    }

    if (typeList && typeList.length > 0) {
      where.type = In(typeList);
    }

    if (isPrimary !== undefined) {
      where.isPrimary = isPrimary;
    }

    if (promoCodeList && promoCodeList.length > 0) {
      where.promoCodes = Raw((alias) => `"${alias}"."promo_codes" && :promoCodes`, {
        promoCodes: promoCodeList
      });
    }

    if (distributionChannelList && distributionChannelList.length > 0) {
      // where.distributionChannel = Raw(
      //   (alias) => `"${alias}"."distribution_channel" && :distributionChannel`,
      //   {
      //     distributionChannel: distributionChannelList
      //   }
      // );

      where.distributionChannel = Raw(
        (alias) => distributionChannelList.map((r) => `'${r}'`).join(' = ANY(') + ` = ANY(${alias})`
      );
    }

    if (languageCodeList && languageCodeList.length > 0) {
      if (!filterDto.relations) {
        filterDto.relations = [];
      }
      filterDto.relations.push('ratePlanTranslations');
    }

    // Get additional rate plan IDs if searching by name includes derived plans
    let additionalRatePlanIds: string[] = [];
    if (name && hotelId) {
      // Find derived plans that match the search name
      const matchingDerivedPlans = await this.ratePlanRepository.find({
        where: {
          hotelId,
          name: Like(`%${name.trim()}%`)
        },
        select: ['id']
      });

      if (matchingDerivedPlans.length > 0) {
        const matchingDerivedPlanIds = matchingDerivedPlans.map((p) => p.id);

        // Find parent plans for these derived plans
        const derivedSettingsForMatching =
          await this.ratePlanDerivedSettingRepository.findForMatching(
            hotelId,
            matchingDerivedPlanIds
          );

        additionalRatePlanIds = derivedSettingsForMatching
          .map((ds) => ds.derivedRatePlanId)
          .filter((id): id is string => id !== null)
          .concat(matchingDerivedPlanIds);
      }
    }

    // Build the final where clause
    let finalWhere = where;
    if (additionalRatePlanIds.length > 0) {
      delete where.name;
      finalWhere = { ...where, id: In([...new Set(additionalRatePlanIds)]) };
    }

    // Fetch all rate plans with derived settings
    const ratePlans = await this.ratePlanRepository.find({
      where: finalWhere,
      order: {
        isPrimary: 'DESC',
        name: 'ASC'
      },
      select: select ?? {
        id: true,
        name: true,
        code: true,
        isPrimary: true,
        roundingMode: true,
        status: true,
        description: true,
        pricingMethodology: true,
        sellingStrategyType: true,
        marketSegmentId: true,
        promoCodes: true,
        distributionChannel: true,
        rfcAttributeMode: true,
        mrfcPositioningMode: true,
        hotelExtrasCodeList: true,
        adjustmentValue: true,
        adjustmentUnit: true,
        hourPrior: true,
        cancellationFeeValue: true,
        cancellationFeeUnit: true,
        hotelCxlPolicyCode: true,
        paymentTermCode: true,
        ratePlanTranslations: {
          languageCode: true,
          name: true,
          description: true
        },
        ratePlanPaymentTermSettings: {
          hotelPaymentTermId: true
        },

        ratePlanExtraServices: {
          extrasId: true
        },

        roomProductRatePlans: {
          roomProductId: true,
          roomProduct: {
            id: true,
            code: true,
            type: true
          }
        },

        baseSetting: {
          id: true,
          ratePlanId: true,
          derivedRatePlanId: true,
          followDailyPaymentTerm: true,
          followDailyCxlPolicy: true,
          followDailyIncludedAmenity: true,
          followDailyRoomProductAvailability: true,
          followDailyRestriction: true
        },

        derivedSetting: {
          id: true,
          ratePlanId: true,
          derivedRatePlanId: true,
          followDailyPaymentTerm: true,
          followDailyCxlPolicy: true,
          followDailyIncludedAmenity: true,
          followDailyRoomProductAvailability: true,
          followDailyRestriction: true
        }
      },

      relations: [...(filterDto.relations ?? [])]
    });

    // Transform into tree structure
    return ratePlans;
  }

  async findAll(
    filter: {
      hotelId: string;
      statusList?: RatePlanStatusEnum[];
      relations?: FindOptionsRelations<RatePlan>;
    },
    select?: FindOptionsSelect<RatePlan>
  ): Promise<RatePlan[]> {
    const { hotelId, statusList, relations } = filter;
    const where: FindOptionsWhere<RatePlan> = {
      hotelId
    };

    if (statusList && statusList.length > 0) {
      where.status = In(statusList);
    }

    return this.ratePlanRepository.find({
      where,
      relations,
      select
    });
  }

  async findDailyAdjustments(
    filter: {
      hotelId: string;
      ratePlanId?: string;
      ratePlanIds?: string[];
      dates?: string[];
      fromDate?: string;
      toDate?: string;
      relations?: FindOptionsRelations<RatePlanDailyAdjustment>;
    },
    select?: FindOptionsSelect<RatePlanDailyAdjustment>
  ): Promise<RatePlanDailyAdjustment[]> {
    const { hotelId, ratePlanId, ratePlanIds, dates, fromDate, toDate, relations } = filter;

    const where: FindOptionsWhere<RatePlanDailyAdjustment> = {
      hotelId
    };
    if (ratePlanId) {
      where.ratePlanId = ratePlanId;
    }
    if (ratePlanIds && ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }
    if (dates && dates.length > 0) {
      where.date = In(dates);
    }

    if (fromDate && toDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date AND "date"::date <= :toDate::date`, {
        fromDate: fromDate,
        toDate: toDate
      });
    } else if (fromDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date`, { fromDate: fromDate });
    } else if (toDate) {
      where.date = Raw(() => `"date"::date <= :toDate::date`, { toDate: toDate });
    }

    return this.ratePlanDailyAdjustmentRepository.find({
      where,
      select,
      relations
    });
  }

  async onboardWhipRatePlan(hotelId: string) {
    if (!hotelId) {
      return false;
    }

    const ratePlans = await this.ratePlanRepository.find({
      where: {
        hotelId,
        status: RatePlanStatusEnum.ACTIVE,
        distributionChannel: Raw(
          (alias) => `'${DistributionChannel.GV_SALES_ENGINE}' = ANY(${alias})`
        )
      },
      select: ['id']
    });

    if (ratePlans && ratePlans.length > 0) {
      await this.triggerUpdateWhipRatePlan(
        hotelId,
        ratePlans.map((x) => x.id)
      );

      return true;
    }

    return true;
  }

  async triggerUpdateWhipRatePlan(hotelId: string, ratePlanIds: string[]) {
    this.googleService.emit({ cmd: 'google.property.package' }, { hotelId, ratePlanIds });
  }
}
