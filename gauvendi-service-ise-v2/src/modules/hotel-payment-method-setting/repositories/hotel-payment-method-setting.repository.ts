import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  HotelPaymentMethodSetting,
  PaymentMethodStatusEnum
} from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { BaseService } from 'src/core/services/base.service';
import { Repository, IsNull } from 'typeorm';
import { HotelPaymentMethodSettingDto } from '../dtos/hotel-payment-method-setting.dto';
import { BadRequestException } from 'src/core/exceptions';
@Injectable()
export class HotelPaymentMethodSettingRepository extends BaseService {
  constructor(
    @InjectRepository(HotelPaymentMethodSetting, DB_NAME.POSTGRES)
    private readonly hotelPaymentMethodSettingRepository: Repository<HotelPaymentMethodSetting>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async getHotelPaymentMethodSetting(
    body: HotelPaymentMethodSettingDto
  ): Promise<HotelPaymentMethodSetting | null> {
    try {
      const hotelPaymentMethodSetting = await this.hotelPaymentMethodSettingRepository.findOne({
        where: {
          hotelId: body.hotelId,
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
      throw new BadRequestException(error.message);
    }
  }
}
