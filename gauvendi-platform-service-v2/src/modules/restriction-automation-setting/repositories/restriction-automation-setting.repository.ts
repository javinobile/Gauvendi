import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import {
  RestrictionAutomationSetting,
  RestrictionAutomationSettingTypeEnum
} from '@src/core/entities/restriction-automation-setting.entity';
import { BadRequestException } from '@src/core/exceptions';
import { In, Repository } from 'typeorm';
import {
  RestrictionAutomationSettingFilterDto,
  RestrictionAutomationSettingInputDto
} from '../dtos/restriction-automation-setting.dto';
import { Filter } from '@src/core/dtos/common.dto';

@Injectable()
export class RestrictionAutomationSettingRepository {
  constructor(
    @InjectRepository(RestrictionAutomationSetting, DbName.Postgres)
    private readonly restrictionAutomationSettingRepository: Repository<RestrictionAutomationSetting>
  ) {}

  getRestrictionAutomationSettings(filter: RestrictionAutomationSettingFilterDto) {
    try {
      const { hotelId, referId, types, relations } = filter;
      const queryBuilder = this.restrictionAutomationSettingRepository.createQueryBuilder(
        'restrictionAutomationSetting'
      );
      if (hotelId) {
        queryBuilder.andWhere('restrictionAutomationSetting.hotelId = :hotelId', { hotelId });
      }
      if (referId) {
        queryBuilder.andWhere('restrictionAutomationSetting.referenceId = :referId', {
          referId
        });
      }
      if (types?.length) {
        queryBuilder.andWhere('restrictionAutomationSetting.type IN (:...types)', { types: types });
      }
      if (relations?.length) {
        Filter.setQueryBuilderRelations(queryBuilder, 'restrictionAutomationSetting', relations);
      }
      return queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateRestrictionAutomationSettings(input: RestrictionAutomationSettingInputDto[]) {
    try {
      const result = await this.restrictionAutomationSettingRepository.upsert(input, {
        conflictPaths: ['hotelId', 'type', 'referenceId'] // unique constraint
      });
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllByReferenceId(referenceId: string[]) {
    return this.restrictionAutomationSettingRepository.find({
      where: { referenceId: In(referenceId) }
    });
  }
}
