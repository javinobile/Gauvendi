import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  GlobalPaymentProvider,
  GlobalPaymentProviderCodeEnum
} from 'src/core/entities/hotel-entities/global-payment-provider.entity';
import { Repository } from 'typeorm';
import { GlobalPaymentProviderDto } from '../dtos/global-payment-provider.dto';

@Injectable()
export class GlobalPaymentProviderRepository {
  private readonly logger = new Logger(GlobalPaymentProviderRepository.name);
  constructor(
    @InjectRepository(GlobalPaymentProvider, DB_NAME.POSTGRES)
    private readonly globalPaymentProviderRepository: Repository<GlobalPaymentProvider>
  ) {}

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
      this.logger.error(`Error getting global payment provider: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
