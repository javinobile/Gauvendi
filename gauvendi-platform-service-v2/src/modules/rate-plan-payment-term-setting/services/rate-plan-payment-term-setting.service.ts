import { Injectable } from '@nestjs/common';
import { ResponseContent, ResponseData } from 'src/core/dtos/common.dto';
import {
  RatePlanPaymentTermSettingDto,
  RatePlanPaymentTermSettingFilterDto,
  RatePlanPaymentTermSettingInputDto,
  RatePlanPaymentTermSettingDeleteDto
} from '../dtos';
import { RatePlanPaymentTermSettingRepository } from '../repositories/rate-plan-payment-term-setting.repository';
import {
  RatePlanPaymentTermSetting,
  SupportedPaymentMethodCodes
} from '@src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlanPaymentTermSettingResponseDto } from '../dtos/rate-plan-payment-term-setting.dto';
import { GlobalPaymentMethodRepository } from '@src/modules/global-payment-method/repositories/global-payment-method.repository';
import { GlobalPaymentMethod } from '@src/core/entities/hotel-entities/global-payment-method.entity';
import { HotelPaymentTermRepository } from '@src/modules/hotel-payment-term/repositories/hotel-payment-term.repository';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { CreateRatePlanPaymentTermSettingInputDto } from '../dtos/rate-plan-payment-term-setting-input.dto';

@Injectable()
export class RatePlanPaymentTermSettingService {
  constructor(
    private readonly ratePlanPaymentTermSettingRepository: RatePlanPaymentTermSettingRepository,
    private readonly globalPaymentMethodRepository: GlobalPaymentMethodRepository,
    private readonly hotelPaymentTermRepository: HotelPaymentTermRepository
  ) {}

  async ratePlanPaymentTermSettingList(
    filter: RatePlanPaymentTermSettingFilterDto
  ): Promise<RatePlanPaymentTermSettingResponseDto[]> {
    const data =
      await this.ratePlanPaymentTermSettingRepository.ratePlanPaymentTermSettingList(filter);
    const mappedData = await this.mapEntitiesToDtos(data);
    return mappedData;
  }

  async createRatePlanPaymentTermSetting(input: RatePlanPaymentTermSettingInputDto) {
    return await this.ratePlanPaymentTermSettingRepository.createRatePlanPaymentTermSetting(input);
  }

  async createRatePlanPaymentTermSettingList(input: CreateRatePlanPaymentTermSettingInputDto) {
    return await this.ratePlanPaymentTermSettingRepository.createRatePlanPaymentTermSettingList(
      input
    );
  }

  async updateRatePlanPaymentTermSetting(input: RatePlanPaymentTermSettingInputDto) {
    return await this.ratePlanPaymentTermSettingRepository.updateRatePlanPaymentTermSetting(input);
  }

  async deleteRatePlanPaymentTermSetting(input: RatePlanPaymentTermSettingDeleteDto) {
    return await this.ratePlanPaymentTermSettingRepository.deleteRatePlanPaymentTermSetting(input);
  }

  private async mapEntityToDto(
    entity: RatePlanPaymentTermSetting,
    allPaymentMethods: GlobalPaymentMethod[],
    hotelPaymentTerms: HotelPaymentTerm[]
  ): Promise<RatePlanPaymentTermSettingResponseDto> {
    const hotelPaymentTerm = hotelPaymentTerms.find(
      (term) => term.id === entity.hotelPaymentTermId
    );
    const paymentMethodCodes = entity?.supportedPaymentMethodCodes;
    const paymentMethodsData = allPaymentMethods?.filter((method) =>
      paymentMethodCodes?.includes(method.code as SupportedPaymentMethodCodes)
    );

    return {
      id: entity.id,
      propertyId: entity.hotelId,
      salesPlanId: entity.ratePlanId,
      propertyPaymentTermId: entity.hotelPaymentTermId,
      propertyPaymentTerm: {
        id: hotelPaymentTerm?.id,
        code: hotelPaymentTerm?.code,
        name: hotelPaymentTerm?.name,
        description: hotelPaymentTerm?.description,
        payAtHotel: hotelPaymentTerm?.payAtHotel,
        payAtHotelDescription: hotelPaymentTerm?.payAtHotelDescription,
        payOnConfirmation: hotelPaymentTerm?.payOnConfirmation,
        payOnConfirmationDescription: hotelPaymentTerm?.payOnConfirmationDescription
      },
      supportedPaymentMethodCodeList: entity.supportedPaymentMethodCodes || [],
      paymentMethodList: paymentMethodsData?.map((method) => ({
        id: method.id,
        code: method.code,
        name: method.name,
        description: method.description
      })),
      isDefault: entity.isDefault
    };
  }

  private async mapEntitiesToDtos(
    entities: RatePlanPaymentTermSetting[]
  ): Promise<RatePlanPaymentTermSettingResponseDto[]> {
    const [allPaymentMethods, hotelPaymentTerms] = await Promise.all([
      this.globalPaymentMethodRepository.getGlobalPaymentMethodList({}),
      this.hotelPaymentTermRepository.getHotelPaymentTerms({
        ids: entities.map((entity) => entity.hotelPaymentTermId)
      })
    ]);

    return Promise.all(
      entities.map((entity) => this.mapEntityToDto(entity, allPaymentMethods, hotelPaymentTerms))
    );
  }
}
