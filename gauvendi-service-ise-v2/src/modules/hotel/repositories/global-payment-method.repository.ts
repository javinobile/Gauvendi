import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { GlobalPaymentMethod } from 'src/core/entities/hotel-entities/global-payment-method.entity';
import { Repository } from 'typeorm';
import { GlobalPaymentMethodDto } from '../dtos/global-payment-method.dto';

@Injectable()
export class GlobalPaymentMethodRepository {
  private readonly logger = new Logger(GlobalPaymentMethodRepository.name);
  constructor(
    @InjectRepository(GlobalPaymentMethod, DB_NAME.POSTGRES)
    private readonly globalPaymentMethodRepository: Repository<GlobalPaymentMethod>
  ) {}

  async getGlobalPaymentMethod(body: GlobalPaymentMethodDto): Promise<GlobalPaymentMethod | null> {
    try {
      const globalPaymentMethod = await this.globalPaymentMethodRepository.findOne({
        where: {
          code: body.code ,
        }
      });

      return globalPaymentMethod ?? null;
    } catch (error) {
      this.logger.error(`Error getting global payment method: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
