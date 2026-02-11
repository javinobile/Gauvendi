import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { CustomerPaymentGateway } from 'src/core/entities/booking-entities/customer-payment-gateway.entity';
import { BaseService } from 'src/core/services/base.service';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CustomerPaymentGatewayRepository extends BaseService {
  private readonly logger = new Logger(CustomerPaymentGatewayRepository.name);

  constructor(
    @InjectRepository(CustomerPaymentGateway, DB_NAME.POSTGRES)
    private customerPaymentGatewayRepository: Repository<CustomerPaymentGateway>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async createCustomerPaymentGateway(
    body: Partial<CustomerPaymentGateway>
  ): Promise<CustomerPaymentGateway> {
    const customerPaymentGateway = this.customerPaymentGatewayRepository.create({
      id: uuidv4(),
      internalCustomerId: body.internalCustomerId,
      refPaymentCustomerId: body.refPaymentCustomerId,
      refPaymentMethodId: body.refPaymentMethodId,
      paymentProvider: body.paymentProvider,
      createdBy: this.currentSystem,
      createdAt: new Date(),
      updatedBy: this.currentSystem,
      updatedAt: new Date()
    });

    try {
      return await this.customerPaymentGatewayRepository.save(customerPaymentGateway);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
