import { Injectable } from '@nestjs/common';
import { HotelPaymentMethodSetting } from '@src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { GlobalPaymentMethodRepository } from '@src/modules/global-payment-method/repositories/global-payment-method.repository';
import {
  HotelPaymentMethodSettingFilterDto,
  HotelPaymentMethodSettingResponseDto
} from '../dtos/hotel-payment-method-setting.dto';
import { HotelPaymentMethodSettingRepository } from '../repositories/hotel-payment-method-setting.repository';
import { GlobalPaymentProviderRepository } from '@src/modules/global-payment-provider/repositories/global-payment-provider.repository';

@Injectable()
export class HotelPaymentMethodSettingService {
  constructor(
    private readonly hotelPaymentMethodSettingRepository: HotelPaymentMethodSettingRepository,
    private readonly globalPaymentProviderRepository: GlobalPaymentProviderRepository,
    private readonly globalPaymentMethodRepository: GlobalPaymentMethodRepository
  ) {}

  async getHotelPaymentMethodSettings(filter: HotelPaymentMethodSettingFilterDto) {
    const data =
      await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSettings(filter);
    if (!data?.length) return [];

    const mappedData = await this.mapHotelPaymentMethodSettings(data);
    return mappedData;
  }

  private async mapHotelPaymentMethodSettings(
    data: HotelPaymentMethodSetting[]
  ): Promise<HotelPaymentMethodSettingResponseDto[]> {
    const paymentProviderIds = data?.flatMap((item) => item.globalPaymentProviderId);
    const paymentMethodIds = data?.flatMap((item) => item.globalPaymentMethodId);
    const [paymentProdvidersData, paymentMethodsData] = await Promise.all([
      this.globalPaymentProviderRepository.getGlobalPaymentProviderList({
        ids: paymentProviderIds
      }),
      this.globalPaymentMethodRepository.getGlobalPaymentMethodList({
        ids: paymentMethodIds
      })
    ]);

    const mappedData: HotelPaymentMethodSettingResponseDto[] = data?.map((item) => {
      const paymentProvider = paymentProdvidersData.find(
        (provider) => provider.id === item.globalPaymentProviderId
      );
      const paymentMethod = paymentMethodsData.find(
        (method) => method.id === item.globalPaymentMethodId
      );
      return {
        globalPaymentMethodId: item.globalPaymentMethodId,
        propertyPaymentMethodSettingId: item.id,
        code: paymentMethod?.code || '',
        name: paymentMethod?.name || '',
        description: paymentMethod?.description || '',
        metadata: item.metadata,
        paymentProvider: paymentProvider
          ? {
              id: paymentProvider.id,
              code: paymentProvider.code,
              name: paymentProvider.name,
              description: paymentProvider.description,
              imageUrl: paymentProvider.imageUrl
            }
          : null
      };
    });
    return mappedData;
  }
}
