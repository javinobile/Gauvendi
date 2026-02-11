import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { In, Like, Repository } from 'typeorm';

import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { HotelPaymentTerm } from 'src/core/entities/hotel-entities/hotel-payment-term.entity';
import { HotelPaymentTermFilterDto } from '../dtos/hotel-payment-term-filter.dto';

@Injectable()
export class HotelPaymentTermRepository extends BaseService {
  constructor(
    @InjectRepository(HotelPaymentTerm, DB_NAME.POSTGRES)
    private readonly hotelPaymentTermRepository: Repository<HotelPaymentTerm>,
    configService: ConfigService
  ) {
    super(configService);
  }

  /**
   * Get rate plan payment term settings with filtering and pagination
   * Preserves exact Java logic from RatePlanPaymentTermSettingServiceImpl.ratePlanPaymentTermSettingList()
   */
  async findAll(filter: HotelPaymentTermFilterDto): Promise<HotelPaymentTerm[]> {
    try {
      const { where, relations, order } = Filter.buildCondition<
        HotelPaymentTerm,
        HotelPaymentTermFilterDto
      >(filter);

      if (filter.hotelId) {
        where.hotelId = filter.hotelId;
      }
      if (filter.idList && filter.idList.length > 0) {
        where.id = In(filter.idList);
      }
      if (filter.name) {
        where.name = Like(`%${filter.name}%`);
      }
      if (filter.code) {
        where.code = Like(`%${filter.code}%`);
      }
      if (filter.codeList && filter.codeList.length > 0) {
        where.code = In(filter.codeList);
      }

      if (filter.payAtHotel !== undefined) {
        where.payAtHotel = filter.payAtHotel;
      }

      if (filter.payOnConfirmation !== undefined) {
        where.payOnConfirmation = filter.payOnConfirmation;
      }

      const entities = await this.hotelPaymentTermRepository.find({
        where,
        order,
        relations
      });

      const languageCodeList = filter.languageCodeList || [];
      if (languageCodeList && languageCodeList.length > 0) {
        return entities.map((entity) => {
          if (entity.translations && entity.translations.length > 0) {
            const translation = entity.translations?.find(
              (t) => `${t.languageCode}`.toLowerCase() === `${languageCodeList[0]}`.toLowerCase()
            );

            if (translation && translation.name) {
              entity.name = translation.name;
            }
            if (translation && translation.description) {
              entity.description = translation.description;
            }
          }
          return entity;
        });
      }

      return entities;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get rate plan payment term settings',
        error.message
      );
    }
  }
}
