import { LanguageCodeEnum, ServiceTypeEnum } from '@enums/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductPricingMethodDetailService } from '@src/modules/room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.service';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { HotelRepository } from 'src/modules/hotel/repositories/hotel.repository';
import { FindOptionsSelect, FindOptionsWhere, In, Repository } from 'typeorm';
import { PropertyTaxDto, PropertyTaxFilterDto, UpdateTaxSettingsInputDto } from '../dto';
import { PropertyTaxUnit } from '../enums/property-tax-unit.enum';
@Injectable()
export class HotelTaxRepository extends BaseService {
  constructor(
    @InjectRepository(HotelTax, DbName.Postgres)
    private readonly hotelTaxRepository: Repository<HotelTax>,
    @InjectRepository(HotelTaxSetting, DbName.Postgres)
    private readonly hotelTaxSettingRepository: Repository<HotelTaxSetting>,
    private readonly hotelRepository: HotelRepository,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    configService: ConfigService,

    private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService
  ) {
    super(configService);
  }

  async findAll(
    filter: { hotelId: string; taxCodes: string[]; taxIds: string[] },
    select?: FindOptionsSelect<HotelTax>
  ): Promise<HotelTax[]> {
    const { hotelId, taxCodes, taxIds } = filter;
    const where: FindOptionsWhere<HotelTax> = {
      hotelId
    };

    if (taxCodes?.length) {
      where.code = In(taxCodes);
    }

    if (taxIds?.length) {
      where.id = In(taxIds);
    }

    return this.hotelTaxRepository.find({
      where,
      select
    });
  }

  async findTaxSettings(filter: { hotelId: string }): Promise<HotelTaxSetting[]> {
    const { hotelId } = filter;
    const where: FindOptionsWhere<HotelTaxSetting> = {
      hotelId
    };
    return this.hotelTaxSettingRepository.find({
      where
    });
  }

  async getHotelTaxes(filter: PropertyTaxFilterDto): Promise<PropertyTaxDto[]> {
    try {
      const hotel = await this.hotelRepository.findByCode(filter.hotelCode);
      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }

      // Build service code mapping per tax code
      const serviceCodeListPerTaxCodeMap = new Map<string, string[]>();

      if (
        (filter.serviceCodeList && filter.serviceCodeList.length > 0) ||
        (filter.typeList && filter.typeList.length > 0)
      ) {
        // Build where conditions for tax settings
        const whereConditions:
          | FindOptionsWhere<HotelTaxSetting>
          | FindOptionsWhere<HotelTaxSetting>[] = {
          hotelId: hotel.id
        };

        if (filter.serviceCodeList && filter.serviceCodeList.length > 0) {
          whereConditions.serviceCode = In(filter.serviceCodeList);
        }

        if (filter.typeList && filter.typeList.length > 0) {
          // Convert PropertyTaxType to HotelTaxTypeEnum names
          const typeNames = filter.typeList.map((type) => type.toString() as ServiceTypeEnum);
          whereConditions.serviceType = In(typeNames);
        }

        const propertyTaxSettingList = await this.hotelTaxSettingRepository.find({
          where: whereConditions
        });

        // Group by tax code and collect service codes
        propertyTaxSettingList.forEach((setting) => {
          const taxCode = setting.taxCode;
          if (!serviceCodeListPerTaxCodeMap.has(taxCode)) {
            serviceCodeListPerTaxCodeMap.set(taxCode, []);
          }
          serviceCodeListPerTaxCodeMap.get(taxCode)!.push(setting.serviceCode);
        });
      }

      // Query hotel taxes using find options
      const hotelTaxWhereConditions: FindOptionsWhere<HotelTax> = {
        hotelId: hotel.id
      };

      if (filter.idList && filter.idList.length > 0) {
        hotelTaxWhereConditions.id = In(filter.idList);
      }

      const propertyTaxList = await this.hotelTaxRepository.find({
        where: hotelTaxWhereConditions
      });

      // Map entities to DTOs
      let data: PropertyTaxDto[] = propertyTaxList.map((item) => {
        let translations = item.translations;
        if (filter.translateTo) {
          translations = translations.filter(
            (translation) => translation.languageCode === filter.translateTo
          );
        }

        return {
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description,
          value: item.rate ? Number((Number(item.rate) * 100).toFixed(4)) : 0, // Convert rate to percentage
          unit: PropertyTaxUnit.PERCENTAGE,
          validFrom: item.validFrom,
          validTo: item.validTo,
          mappingTaxCode: item.mappingPmsTaxCode,
          isDefault: item.isDefault,
          mappingServiceCodeList: serviceCodeListPerTaxCodeMap.get(item.code) || [],
          translationList: translations
        };
      });

      // Sort by name
      data = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      return data;
    } catch (error) {
      console.log(error);
      console.error('Error in propertyTaxList:', error);
      throw new BadRequestException('Failed to fetch property taxes', error.message);
    }
  }

  async findAllForBookingCalculate(
    filter: {
      hotelId: string;
    },
    select?: FindOptionsSelect<HotelTax>
  ): Promise<HotelTax[]> {
    const where: FindOptionsWhere<HotelTax> = {
      hotelId: filter.hotelId
    };

    return this.hotelTaxRepository.find({
      where,
      select
    });
  }

  async updateHotelTaxSettings(input: UpdateTaxSettingsInputDto): Promise<null> {
    // Validation: propertyId is required

    const hotel = await this.hotelRepository.findByCode(input.hotelCode);
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }

    // Validation: itemList is required
    if (!input.itemList || input.itemList.length === 0) {
      throw new BadRequestException('Item list is required');
    }

    // Extract service codes and validate
    const serviceCodeList = input.itemList
      .map((item) => item.serviceCode)
      .filter((code) => code != null)
      .filter((code, index, array) => array.indexOf(code) === index); // Remove duplicates

    if (serviceCodeList.length === 0) {
      throw new BadRequestException('Service code unavailable');
    }

    // Validation: serviceType is required for all items
    if (input.itemList.some((item) => !item.serviceType)) {
      throw new BadRequestException('ServiceType is required for all items');
    }

    try {
      // Find existing tax settings
      const whereConditions: FindOptionsWhere<HotelTaxSetting> = {
        hotelId: hotel.id,
        serviceCode: In(serviceCodeList)
      };

      const existingTaxMappings = await this.hotelTaxSettingRepository.find({
        where: whereConditions
      });

      // Group existing mappings by service code
      const taxMappingPerServiceCodeMap = new Map<string, HotelTaxSetting[]>();
      existingTaxMappings.forEach((mapping) => {
        const serviceCode = mapping.serviceCode;
        if (!taxMappingPerServiceCodeMap.has(serviceCode)) {
          taxMappingPerServiceCodeMap.set(serviceCode, []);
        }
        taxMappingPerServiceCodeMap.get(serviceCode)!.push(mapping);
      });

      const insertEntities: HotelTaxSetting[] = [];
      const deleteEntities: HotelTaxSetting[] = [];

      // Process each item
      input.itemList.forEach((item) => {
        // Skip items without required fields
        if (!item.serviceCode || !item.serviceType) {
          return null;
        }

        const taxCodeList = item.taxCodeList || []; // Always returns array (never null)

        if (taxCodeList.length > 0) {
          if (taxMappingPerServiceCodeMap.has(item.serviceCode)) {
            // Have existing tax mappings
            const existedTaxMappingList = taxMappingPerServiceCodeMap.get(item.serviceCode);

            // Find new tax codes that don't exist yet
            const newTaxMappingList = taxCodeList
              .filter(
                (taxCode) => !existedTaxMappingList?.some((mapping) => mapping.taxCode === taxCode)
              )
              .map((taxCode) => {
                const taxMapping = new HotelTaxSetting();
                taxMapping.hotelId = hotel.id;
                taxMapping.serviceType = item.serviceType!;
                taxMapping.serviceCode = item.serviceCode!;
                taxMapping.taxCode = taxCode;
                return taxMapping;
              });
            insertEntities.push(...newTaxMappingList);

            // Find unused tax mappings to delete
            const unusedTaxMappingList =
              existedTaxMappingList?.filter((entity) => !taxCodeList.includes(entity.taxCode)) ||
              [];
            deleteEntities.push(...unusedTaxMappingList);
          } else {
            // No existing tax mappings, create all new ones
            const taxMappingList = taxCodeList.map((taxCode) => {
              const taxMapping = new HotelTaxSetting();
              taxMapping.hotelId = hotel.id;
              taxMapping.serviceType = item.serviceType!;
              taxMapping.serviceCode = item.serviceCode!;
              taxMapping.taxCode = taxCode;
              return taxMapping;
            });
            insertEntities.push(...taxMappingList);
          }
        } else {
          // Empty tax code list - delete existing mappings if any
          if (taxMappingPerServiceCodeMap.has(item.serviceCode)) {
            const taxMappingList = taxMappingPerServiceCodeMap.get(item.serviceCode) || [];
            deleteEntities.push(...taxMappingList);
          }
        }
      });

      // Execute database operations
      if (insertEntities.length > 0) {
        await this.hotelTaxSettingRepository.save(insertEntities);
      }

      if (deleteEntities.length > 0) {
        await this.hotelTaxSettingRepository.remove(deleteEntities);
      }

      // TODO: trigger daily selling price
      // find rate plan ids by service code
      const ratePlans = await this.ratePlanRepository.find({
        where: {
          code: In(serviceCodeList)
        },
        select: {
          id: true
        }
      });

      // check if tax code not change, no need to trigger pricing
      const oldMappingTax = existingTaxMappings.map((item) => item.taxCode);
      const needTriggerPricing = insertEntities.some(
        (item) => !oldMappingTax.includes(item.taxCode)
      );

      const ratePlanIds = ratePlans.map((item) => item.id);

      if (ratePlanIds.length > 0 && needTriggerPricing) {
        await this.roomProductPricingMethodDetailService.triggerAllRoomProductPricingMethodDetail(
          {
            hotelId: hotel.id,
            ratePlanIds: ratePlanIds,
            isPushToPms: false,
          }
        );
      }

      return null;
    } catch (error) {
      console.error('Error in updateTaxSettings:', error);
      throw new BadRequestException('Unable to update tax settings');
    }
  }

  async getHotelTax(body: { hotelId: string }): Promise<HotelTax | null> {
    try {
      const hotelTax = await this.hotelTaxRepository.findOne({
        where: {
          hotelId: body.hotelId,
          isDefault: true
        }
      });

      return hotelTax;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelTaxsWithTranslations(filter: {
    ids?: string[];
    translateTo?: LanguageCodeEnum | null;
  }) {
    try {
      const { ids, translateTo } = filter;

      const qb = this.hotelTaxRepository.createQueryBuilder('hotelTax');
      if (ids?.length) {
        qb.andWhere('hotelTax.id IN (:...ids)', { ids });
      }

      const hotelTaxes = await qb.getMany();

      if (!hotelTaxes.length) return [];

      const mappedHotelTaxes = hotelTaxes.map((hotelTax) => {
        const translation = hotelTax.translations?.find(
          (translation) => translation.languageCode === translateTo
        );
        if (!translation) return hotelTax;

        return {
          ...hotelTax,
          name: translation?.name,
          description: translation?.description,
          translations: hotelTax.translations
        };
      });

      return mappedHotelTaxes;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
