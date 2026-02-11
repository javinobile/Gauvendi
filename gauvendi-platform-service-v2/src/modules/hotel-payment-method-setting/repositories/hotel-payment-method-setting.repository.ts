import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelPaymentMethodSetting } from '@src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { PaymentMethodStatusEnum } from '@src/core/enums/common';
import { BadRequestException } from '@src/core/exceptions';
import { FindOptionsWhere, Repository } from 'typeorm';
import { HotelPaymentMethodSettingFilterDto } from '../dtos/hotel-payment-method-setting.dto';

@Injectable()
export class HotelPaymentMethodSettingRepository {
  constructor(
    @InjectRepository(HotelPaymentMethodSetting, DbName.Postgres)
    private readonly hotelPaymentMethodSettingRepository: Repository<HotelPaymentMethodSetting>
  ) {}

  async getHotelPaymentMethodSetting(
    body: {
      hotelId: string;
      id?: string;
      globalPaymentProviderId?: string;
      globalPaymentMethodId?: string;
      status?: PaymentMethodStatusEnum;
    }
  ): Promise<HotelPaymentMethodSetting | null> {
    try {
      const where: FindOptionsWhere<HotelPaymentMethodSetting> = {
        
      };

      if (body.hotelId) {
        where.hotelId = body.hotelId;
      }
      if (body.globalPaymentProviderId) {
        where.globalPaymentProviderId = body.globalPaymentProviderId;
      }
      if (body.globalPaymentMethodId) {
        where.globalPaymentMethodId = body.globalPaymentMethodId;
      }
      if (body.status) {
        where.status = body.status;
      }
      if (body.id) {
        where.id = body.id;
      }


      const hotelPaymentMethodSetting = await this.hotelPaymentMethodSettingRepository.findOne({
        where
      });

      return hotelPaymentMethodSetting;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  async create(input: Partial<HotelPaymentMethodSetting>): Promise<HotelPaymentMethodSetting> {
    try {
      return await this.hotelPaymentMethodSettingRepository.save(input);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async save(input: HotelPaymentMethodSetting): Promise<HotelPaymentMethodSetting> {
    try {
      return await this.hotelPaymentMethodSettingRepository.save(input);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  getHotelPaymentMethodSettings(filter: HotelPaymentMethodSettingFilterDto) {
    try {
      const { hotelId, paymentMethodIds, status } = filter;
      const queryBuilder = this.hotelPaymentMethodSettingRepository.createQueryBuilder(
        'hotelPaymentMethodSetting'
      );
      if (hotelId) {
        queryBuilder.andWhere('hotelPaymentMethodSetting.hotelId = :hotelId', { hotelId });
      }

      if (paymentMethodIds?.length) {
        queryBuilder.andWhere(
          'hotelPaymentMethodSetting.globalPaymentMethodId IN (:...paymentMethodIds)',
          {
            paymentMethodIds
          }
        );
      }

      if (status) {
        queryBuilder.andWhere('hotelPaymentMethodSetting.status = :status', { status });
      }

      return queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
