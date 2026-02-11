import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { GlobalPaymentProvider } from '@src/core/entities/hotel-entities/global-payment-provider.entity';
import { GlobalPaymentProviderCodeEnum } from '@src/core/enums/common';
import { DbName } from 'src/core/constants/db-name.constant';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { Repository } from 'typeorm';
import { GlobalPaymentProviderDto, GlobalPaymentProviderFilterDto } from '../dtos/global-payment-provider.dto';

@Injectable()
export class GlobalPaymentProviderRepository extends BaseService {
  constructor(
    @InjectRepository(GlobalPaymentProvider, DbName.Postgres)
    private readonly globalPaymentProviderRepository: Repository<GlobalPaymentProvider>,

    configService: ConfigService
  ) {
    super(configService);
  }

  async getGlobalPaymentProvider(
    body: GlobalPaymentProviderDto
  ): Promise<GlobalPaymentProvider | null> {
    try {
      const globalPaymentProvider = await this.globalPaymentProviderRepository.findOne({
        where: {
          code: body.code as GlobalPaymentProviderCodeEnum
        }
      });

      return globalPaymentProvider ?? null;
    } catch (error) {

      throw new BadRequestException(error.message);
    }
  }

  getGlobalPaymentProviderList(filter: GlobalPaymentProviderFilterDto) {
    const { codes, ids } = filter;
    try {
      const queryBuilder =
        this.globalPaymentProviderRepository.createQueryBuilder('globalPaymentProvider');
      if (codes?.length) {
        queryBuilder.andWhere('globalPaymentProvider.code IN (:...codes)', { codes: codes });
      }
      if (ids?.length) {
        queryBuilder.andWhere('globalPaymentProvider.id IN (:...ids)', { ids: ids });
      }
      return queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
