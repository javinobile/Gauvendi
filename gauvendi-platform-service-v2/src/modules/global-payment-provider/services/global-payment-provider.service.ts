import { Injectable } from '@nestjs/common';
import { GlobalPaymentProviderFilterDto } from '../dtos/global-payment-provider.dto';
import { GlobalPaymentProviderRepository } from '../repositories/global-payment-provider.repository';
import { GlobalPaymentProvider } from '@src/core/entities/hotel-entities/global-payment-provider.entity';

@Injectable()
export class GlobalPaymentProviderService {
  constructor(private readonly globalPaymentProviderRepository: GlobalPaymentProviderRepository) {}

  async getGlobalPaymentProviders(filter: GlobalPaymentProviderFilterDto) {
    const data = await this.globalPaymentProviderRepository.getGlobalPaymentProviderList(filter);
    return this.mapGlobalPaymentProviders(data);
  }

  private mapGlobalPaymentProviders(data: GlobalPaymentProvider[]) {
    return data.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl
    }));
  }
}
