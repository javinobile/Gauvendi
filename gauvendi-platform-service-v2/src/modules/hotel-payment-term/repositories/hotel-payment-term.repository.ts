import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { RatePlanPaymentTermSetting } from '@src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { LanguageCodeEnum } from '@src/core/enums/common';
import { BadRequestException } from '@src/core/exceptions';
import { BaseService } from '@src/core/services/base.service';
import { DataSource, FindOptionsSelect, FindOptionsWhere, In, Raw, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  HotelPaymentTermFilterDto,
  HotelPaymentTermInputDto,
  HotelPaymentTermsFilterDto
} from '../dtos/hotel-payment-term.dto';
@Injectable()
export class HotelPaymentTermRepository extends BaseService {
  constructor(
    @InjectRepository(HotelPaymentTerm, DbName.Postgres)
    private readonly hotelPaymentTermRepository: Repository<HotelPaymentTerm>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    configService: ConfigService
  ) {
    super(configService);
  }

  findAll(
    filter: { hotelId?: string; isDefault?: boolean; supportedPaymentMethodCodes?: string[] },
    select?: FindOptionsSelect<HotelPaymentTerm>
  ) {
    const { hotelId, isDefault, supportedPaymentMethodCodes } = filter;

    const where: FindOptionsWhere<HotelPaymentTerm> = {};
    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }
    if (supportedPaymentMethodCodes?.length) {
      where.supportedPaymentMethodCodes = Raw(() => `supported_payment_method_codes && :supportedPaymentMethodCodes`, {
        supportedPaymentMethodCodes: supportedPaymentMethodCodes
      });
    }
    return this.hotelPaymentTermRepository.find({
      where,
      select
    });
  }

  getHotelPaymentTerms(filter: HotelPaymentTermFilterDto) {
    try {
      const { hotelId, ids } = filter;
      const queryBuilder = this.hotelPaymentTermRepository.createQueryBuilder('hotelPaymentTerm');
      if (hotelId) {
        queryBuilder.where('hotelPaymentTerm.hotelId = :hotelId', { hotelId });
      }
      if (ids?.length) {
        queryBuilder.where('hotelPaymentTerm.id IN (:...ids)', { ids: ids });
      }
      return queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelPaymentTermsByCodes(
    filter: HotelPaymentTermsFilterDto
  ): Promise<HotelPaymentTerm[] | null> {
    try {
      const hotelPaymentTerms = await this.hotelPaymentTermRepository.find({
        where: { code: In(filter.codes), hotelId: filter.hotelId }
      });
      const mappedHotelPaymentTerms = hotelPaymentTerms.map((hotelPaymentTerm) => {
        const itemTranslation =
          hotelPaymentTerm.translations.find(
            (translation) => translation.languageCode === filter.translateTo
          ) || {};

        return {
          ...hotelPaymentTerm,
          ...itemTranslation
        };
      });
      return mappedHotelPaymentTerms;
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }

  async createOrUpdateHotelPaymentTerm(input: HotelPaymentTermInputDto) {
    try {
      const hotelPaymentTerm: Partial<HotelPaymentTerm> = {
        id: input.id ? input.id : uuidv4(),
        updatedAt: new Date(),
        updatedBy: this.currentSystem,
        hotelId: input.hotelId,
        code: input.code,
        name: input.name,
        description: input.description!,
        payAtHotel: input.payAtHotel,
        payAtHotelDescription: input.payAtHotelDescription!,
        payOnConfirmation: input.payOnConfirmation,
        payOnConfirmationDescription: input.payOnConfirmationDescription!,
        supportedPaymentMethodCodes: input.supportedPaymentMethodCodeList,
        translations: input.translations?.map((translation) => ({
          languageCode: translation.languageCode as unknown as LanguageCodeEnum,
          name: translation.name,
          description: translation.description,
          payUponBookingDescription: translation.payUponBookingDescription,
          payAtHotelDescription: translation.payAtHotelDescription
        })),
        ...(!input.id ? { updatedAt: new Date(), updatedBy: this.currentSystem } : {})
      };

      await this.hotelPaymentTermRepository.upsert([hotelPaymentTerm], {
        conflictPaths: ['id'],
        skipUpdateIfNoValuesChanged: true
      });
    } catch (error) {
      const err = error?.message;
      throw new BadRequestException(err);
    }
  }

  async deleteHotelPaymentTerm(input: HotelPaymentTermFilterDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { ids, hotelId } = input;
      if (!ids?.length) {
        throw new BadRequestException('Ids are required');
      }

      // check if hotel payment term is used in any rate plan payment term setting
      const ratePlanPaymentTermSettings = await queryRunner.manager.find(
        RatePlanPaymentTermSetting,
        {
          where: { hotelPaymentTermId: In(ids!) }
        }
      );

      if (ratePlanPaymentTermSettings.length > 0) {
        throw new BadRequestException(
          'Hotel payment term is used in any rate plan payment term setting'
        );
      }

      const deleteResult = await queryRunner.manager.delete(HotelPaymentTerm, { id: In(ids!) });

      await queryRunner.commitTransaction();

      return deleteResult;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
