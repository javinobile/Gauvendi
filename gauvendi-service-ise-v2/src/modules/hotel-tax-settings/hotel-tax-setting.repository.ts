import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  HotelTaxSetting,
  ServiceTypeEnum
} from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import {
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Repository
} from 'typeorm';

@Injectable()
export class HotelTaxSettingRepository {
  constructor(
    @InjectRepository(HotelTaxSetting, DB_NAME.POSTGRES)
    private readonly hotelTaxSettingRepository: Repository<HotelTaxSetting>
  ) {}

  findAll(
    filter: {
      ratePlanCodes?: string[];
      hotelId?: string;
    },
    select?: FindOptionsSelect<HotelTaxSetting>
  ): Promise<HotelTaxSetting[]> {
    const { ratePlanCodes, hotelId } = filter;
    const where: FindOptionsWhere<HotelTaxSetting> = {};

    if (hotelId) {
      where.hotelId = hotelId;
    }

    if (ratePlanCodes) {
      where.serviceType = ServiceTypeEnum.ACCOMMODATION;
      where.serviceCode = In(ratePlanCodes);
    }

    return this.hotelTaxSettingRepository.find({
      where,
      select
    });
  }
}
