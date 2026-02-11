import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ConfigService } from '@nestjs/config';
import { LanguageCodeEnum } from '@src/core/enums/common';
import { DbName } from 'src/core/constants/db-name.constant';
import { Filter } from 'src/core/dtos/common.dto';
import {
  CancellationPolicyDisplayUnitEnum,
  CancellationTypeEnum,
  HotelCancellationPolicy
} from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { HotelRepository } from 'src/modules/hotel/repositories/hotel.repository';
import { FindOptionsOrder, FindOptionsWhere, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  HotelCancellationPoliciesFilterDto,
  HotelCancellationPolicyDto,
  HotelCancellationPolicyFilterDto
} from '../dto';
import { HotelCancellationPolicyInputDto } from '../dto/hotel-cancellation-policy-input.dto';
@Injectable()
export class HotelCancellationPolicyRepository extends BaseService {
  constructor(
    @InjectRepository(HotelCancellationPolicy, DbName.Postgres)
    private readonly hotelCancellationPolicyRepository: Repository<HotelCancellationPolicy>,
    private readonly hotelRepository: HotelRepository,
    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(
    filterDto: HotelCancellationPolicyFilterDto
  ): Promise<HotelCancellationPolicyDto[]> {
    try {
      const hotel = await this.hotelRepository.findByCode(filterDto.hotelCode);
      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }
      const { idList, isDefault } = filterDto;
      let where:
        | FindOptionsWhere<HotelCancellationPolicy>
        | FindOptionsWhere<HotelCancellationPolicy>[] = {
        hotelId: hotel.id
      };
      if (idList && idList.length > 0) {
        where.id = In(idList);
      }
      if (isDefault !== undefined) {
        where.isDefault = isDefault;
      }

      if (filterDto.relations && filterDto.relations.length > 0) {
        where = Filter.setOptionRelations(where, filterDto.relations);
      }

      let order: FindOptionsOrder<HotelCancellationPolicy> = {};
      if (filterDto.sort && filterDto.sort.length > 0) {
        order = Filter.setOptionSort(order, filterDto.sort);
      }

      const entities = await this.hotelCancellationPolicyRepository.find({
        where,
        order
      });

      return entities.map((entity) => {
        const dto = this.entityToDto(entity);

        if (filterDto.translateTo) {
          dto.translationList = dto.translationList?.filter(
            (translation) => translation.languageCode === filterDto.translateTo
          );
        }

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
        description: input.description,
        translations: input.translationList?.map((translation) => ({
          languageCode: translation.languageCode as LanguageCodeEnum,
          name: translation.name,
          description: translation.description
        }))
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

  async getHotelCancellationPolicies(
    filter: HotelCancellationPoliciesFilterDto
  ): Promise<HotelCancellationPolicy[] | null> {
    try {
      const hotelCancellationPolicies = await this.hotelCancellationPolicyRepository.find({
        where: { code: In(filter.codes), hotelId: filter.hotelId }
      });
      const mappedHotelCancellationPolicies = hotelCancellationPolicies.map(
        (hotelCancellationPolicy) => {
          const itemTranslation =
            hotelCancellationPolicy.translations.find(
              (translation) => translation.languageCode === filter.translateTo
            ) || {};

          return {
            ...hotelCancellationPolicy,
            ...itemTranslation
          };
        }
      );
      return mappedHotelCancellationPolicies;
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
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
