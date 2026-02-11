import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import {
  CancellationPolicyDisplayUnitEnum,
  CancellationTypeEnum,
  HotelCancellationPolicy
} from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import {
  HotelCancellationPoliciesFilterDto,
  HotelCancellationPolicyFilterDto
} from 'src/modules/hotel-cancellation-policy/dtos/hotel-cancellation-policy-filter.dto';
import { HotelCancellationPolicyInputDto } from 'src/modules/hotel-cancellation-policy/dtos/hotel-cancellation-policy-input.dto';
import { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { HotelCancellationPolicyDto } from '../dtos/hotel-cancellation-policy.dto';
@Injectable()
export class HotelCancellationPolicyRepository extends BaseService {
  constructor(
    @InjectRepository(HotelCancellationPolicy, DB_NAME.POSTGRES)
    private readonly hotelCancellationPolicyRepository: Repository<HotelCancellationPolicy>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async getHotelCancellationPolicies(
    filter: HotelCancellationPoliciesFilterDto
  ): Promise<HotelCancellationPolicy[] | null> {
    try {
      const hotelCancellationPolicies = await this.hotelCancellationPolicyRepository.find({
        where: { code: In(filter.codes), hotelId: filter.hotelId }
      });
      const mappedHotelCancellationPolicies = hotelCancellationPolicies.map(
        (hotelCancellationPolicy) => {
          const clone = structuredClone(hotelCancellationPolicy);
          const itemTranslation = hotelCancellationPolicy.translations.find(
            (translation) => translation.languageCode === filter.translateTo
          );

          if (itemTranslation) {
            if (itemTranslation.name) {
              clone.name = itemTranslation.name;
            }
            if (itemTranslation.description) {
              clone.description = itemTranslation.description;
            }
          }

          return clone;
        }
      );
      return mappedHotelCancellationPolicies;
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }

  async findAll(
    filterDto: HotelCancellationPolicyFilterDto
  ): Promise<HotelCancellationPolicyDto[]> {
    try {
      const where: FindOptionsWhere<HotelCancellationPolicy> = {
        hotelId: filterDto.hotelId
      };

      const { idList, isDefault } = filterDto;

      if (idList && idList.length > 0) {
        where.id = In(idList);
      }
      if (isDefault !== undefined) {
        where.isDefault = isDefault;
      }

      let relationsOptions: FindOptionsRelations<HotelCancellationPolicy> = {};
      if (filterDto.relations && filterDto.relations.length > 0) {
        relationsOptions = Filter.setOptionRelations<HotelCancellationPolicy>(
          relationsOptions,
          filterDto.relations
        );
      }

      let order: FindOptionsOrder<HotelCancellationPolicy> = {};
      if (filterDto.sort && filterDto.sort.length > 0) {
        order = Filter.setOptionSort(order, filterDto.sort);
      }

      const entities = await this.hotelCancellationPolicyRepository.find({
        where,
        order,
        relations: relationsOptions
      });

      return entities.map((entity) => {
        if (filterDto.translateTo) {
          if (entity.translations && entity.translations.length > 0) {
            const translation = entity.translations?.find(
              (t) => `${t.languageCode}`.toLowerCase() === `${filterDto.translateTo}`.toLowerCase()
            );

            if (translation && translation.name) {
              entity.name = translation.name;
            }
            if (translation && translation.description) {
              entity.description = translation.description;
            }
          }
        }
        const dto = this.entityToDto(entity);

        return dto;
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to fetch hotel cancellation policies', error.message);
    }
  }

  async updateHotelCancellationPolicy(
    input: HotelCancellationPolicyInputDto
  ): Promise<HotelCancellationPolicyDto> {
    try {
      // Get hotel by hotelId if provided, otherwise throw error
      let existingPolicy: HotelCancellationPolicy | null = null;
      if (input.id) {
        existingPolicy = await this.hotelCancellationPolicyRepository.findOne({
          where: { id: input.id, hotelId: input.hotelId }
        });
        if (!existingPolicy) {
          throw new BadRequestException('Hotel cancellation policy not found');
        }
      }

      // Prepare entity data
      const entityData: Partial<HotelCancellationPolicy> = {
        hotelId: input.hotelId,
        name: input.name,
        cancellationType: input.cancellationType as CancellationTypeEnum,
        hourPrior: input.hourPrior,
        displayUnit: input.displayUnit as CancellationPolicyDisplayUnitEnum,
        cancellationFeeValue: input.cancellationFeeValue,
        cancellationFeeUnit: input.cancellationFeeUnit,
        description: input.description
      };

      // Update or create
      let savedEntity: HotelCancellationPolicy;
      if (existingPolicy) {
        // Update existing
        Object.assign(existingPolicy, entityData);
        savedEntity = await this.hotelCancellationPolicyRepository.save(existingPolicy);
      } else {
        // Create new
        savedEntity = await this.hotelCancellationPolicyRepository.save(
          this.hotelCancellationPolicyRepository.create(entityData)
        );
      }

      if (!savedEntity) {
        throw new BadRequestException('Failed to retrieve saved policy');
      }

      return this.entityToDto(savedEntity);
    } catch (error) {
      console.log('Error updating hotel cancellation policy:', error);
      throw new BadRequestException('Failed to update hotel cancellation policy', error.message);
    }
  }

  private entityToDto(entity: HotelCancellationPolicy): HotelCancellationPolicyDto {
    const dto = new HotelCancellationPolicyDto();
    dto.id = entity.id;
    dto.hotelId = entity.hotelId;
    dto.cancellationType = entity.cancellationType;
    dto.hourPrior = entity.hourPrior;
    dto.displayUnit = entity.displayUnit;
    dto.cancellationFeeValue = Number(entity.cancellationFeeValue);
    dto.cancellationFeeUnit = entity.cancellationFeeUnit;
    dto.description = entity.description;

    dto.name = entity.name;
    dto.code = entity.code;
    dto.isDefault = entity.isDefault;

    dto.translationList =
      entity.translations?.map((translation) => {
        return {
          id: uuidv4(),
          hotelId: entity.hotelId,
          hotelCxlPolicyId: entity.id,
          languageCode: translation.languageCode,
          name: translation.name,
          description: translation.description
        };
      }) || [];
    return dto;
  }
}
