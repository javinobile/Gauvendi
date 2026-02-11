import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  HotelPaymentMethodSetting,
  PaymentMethodStatusEnum
} from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { Repository } from 'typeorm';
import { PropertyPaymentMethodSettingDto } from '../dtos/property_payment_method_setting.dto';

@Injectable()
export class HotelPaymentMethodSettingRepository {
  private readonly logger = new Logger(HotelPaymentMethodSettingRepository.name);
  constructor(
    @InjectRepository(HotelPaymentMethodSetting, DB_NAME.POSTGRES)
    private readonly hotelPaymentMethodSettingRepository: Repository<HotelPaymentMethodSetting>
  ) {}

  async getHotelPaymentMethodSetting(
    body: PropertyPaymentMethodSettingDto
  ): Promise<HotelPaymentMethodSetting | null> {
    try {
      const hotelPaymentMethodSetting = await this.hotelPaymentMethodSettingRepository.findOne({
        where: {
          hotelId: body.propertyId,
          ...(body.globalPaymentProviderId && {
            globalPaymentProviderId: body.globalPaymentProviderId
          }),
          ...(body.globalPaymentMethodId && {
            globalPaymentMethodId: body.globalPaymentMethodId
          }),
          status: PaymentMethodStatusEnum.ACTIVE
        }
      });

      return hotelPaymentMethodSetting;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
