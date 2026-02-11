import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { GlobalPaymentMethod } from 'src/core/entities/hotel-entities/global-payment-method.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsSelect, FindOptionsWhere, Repository } from 'typeorm';
import {
  GlobalPaymentMethodDto,
  GlobalPaymentMethodFilterDto
} from '../dtos/global-payment-method.dto';

@Injectable()
export class GlobalPaymentMethodRepository extends BaseService {
  constructor(
    @InjectRepository(GlobalPaymentMethod, DbName.Postgres)
    private readonly globalPaymentMethodRepository: Repository<GlobalPaymentMethod>,

    configService: ConfigService
  ) {
    super(configService);
  }

  async findOne(filter: { id?: string; code?: string }, select?: FindOptionsSelect<GlobalPaymentMethod>): Promise<GlobalPaymentMethod | null> {
    try {
      const { id, code } = filter;
      const where: FindOptionsWhere<GlobalPaymentMethod> = {};
      if (id) {
        where.id = id;
      }
      if (code) {
        where.code = code;
      }
      return await this.globalPaymentMethodRepository.findOne({ where, select });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getGlobalPaymentMethod(body: GlobalPaymentMethodDto): Promise<GlobalPaymentMethod | null> {
    try {
      const globalPaymentMethod = await this.globalPaymentMethodRepository.findOne({
        where: {
          code: body.code
        }
      });

      return globalPaymentMethod ?? null;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  getGlobalPaymentMethodList(filter: GlobalPaymentMethodFilterDto) {
    const { codes, ids, translateTo } = filter;
    try {
      const queryBuilder =
        this.globalPaymentMethodRepository.createQueryBuilder('globalPaymentMethod');
      if (codes?.length) {
        queryBuilder.andWhere('globalPaymentMethod.code IN (:...codes)', { codes: codes });
      }
      if (ids?.length) {
        queryBuilder.andWhere('globalPaymentMethod.id IN (:...ids)', { ids: ids });
      }
      // if translateTo is not null, add translation query
      if (translateTo) {
        // queryBuilder.andWhere('globalPaymentMethod.translateTo = :translateTo', { translateTo });
      }
      return queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
