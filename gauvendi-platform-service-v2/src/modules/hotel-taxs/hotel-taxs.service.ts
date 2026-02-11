import { DbName } from '@constants/db-name.constant';
import { HotelTaxSetting } from '@entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from '@entities/hotel-entities/hotel-tax.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { BadRequestException, ConflictException, NotFoundException } from '@exceptions/index';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseStatusEnum } from '@src/core/enums/common';
import { FindOptionsOrder, Repository } from 'typeorm';
import { PmsService } from '../pms/pms.service';
import {
  CreateHotelTaxDto,
  DeleteHotelTaxDto,
  GetHotelTaxDto,
  HotelTaxInputDto,
  HotelTaxQueryDto,
  SetDefaultHotelTaxDto,
  UpdateHotelTaxDto
} from './hotel-taxs.dto';

@Injectable()
export class HotelTaxsService {
  constructor(
    @InjectRepository(HotelTax, DbName.Postgres)
    private readonly hotelTaxRepository: Repository<HotelTax>,
    @InjectRepository(HotelTaxSetting, DbName.Postgres)
    private readonly hotelTaxSettingRepository: Repository<HotelTaxSetting>,
    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,
    private readonly pmsService: PmsService
  ) {}

  async getHotelTaxs(query: HotelTaxQueryDto) {
    const sort: string[] = query.sort || [];
    const orderBy: FindOptionsOrder<HotelTax> = {};

    for (const s of sort) {
      const [field, order] = s.split(':');
      if (field === 'code') {
        orderBy.code = order as 'ASC' | 'DESC';
      }
      if (field === 'name') {
        orderBy.name = order as 'ASC' | 'DESC';
      }
      if (field === 'validFrom') {
        orderBy.validFrom = order as 'ASC' | 'DESC';
      }
      if (field === 'validTo') {
        orderBy.validTo = order as 'ASC' | 'DESC';
      }
    }

    const hotelTaxs = await this.hotelTaxRepository.find({
      where: {
        hotel: { code: query.hotelCode }
      },
      relations: ['hotelTaxSettings'],
      order: orderBy
    });

    return hotelTaxs.map((tax) => {
      const { rate, mappingPmsTaxCode, translations, hotelTaxSettings, ...rest } = tax;
      return {
        ...rest,
        value: rate ? Number((Number(rate) * 100).toFixed(4)) : 0,
        mappingTaxCode: mappingPmsTaxCode,
        translationList: translations,
        mappingServiceCodeList: hotelTaxSettings
          .filter((setting) => query.typeList?.includes(setting.serviceType))
          .map((setting) => setting.serviceCode),
        type: null,
        unit: 'PERCENTAGE'
      };
    });
  }

  async getHotelTax(dto: GetHotelTaxDto) {
    const hotel = await this.hotelRepository.findOne({
      where: { code: dto.hotelCode }
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with code ${dto.hotelCode} not found`);
    }

    const tax = await this.hotelTaxRepository.findOne({
      where: {
        id: dto.id,
        hotelId: hotel.id
      }
    });

    if (!tax) {
      return null;
    }

    return {
      ...tax,
      value: tax.rate ? Number(tax.rate) : 0,
      mappingTaxCode: tax.mappingPmsTaxCode,
      translationList: tax.translations
    };
  }

  async createHotelTax(dto: CreateHotelTaxDto) {
    const hotel = await this.hotelRepository.findOne({
      where: { code: dto.hotelCode }
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with code ${dto.hotelCode} not found`);
    }

    // Check if code already exists for this hotel
    const existingTax = await this.hotelTaxRepository.findOne({
      where: {
        code: dto.code,
        hotelId: hotel.id
      }
    });

    if (existingTax) {
      throw new ConflictException(
        `Tax with code ${dto.code} already exists for hotel ${dto.hotelCode}`
      );
    }

    const hotelTax = this.hotelTaxRepository.create({
      hotelId: hotel.id,
      code: dto.code,
      name: dto.name,
      rate: dto.value,
      validFrom: dto.validFrom,
      validTo: dto.validTo,
      description: dto.description,
      mappingPmsTaxCode: dto.mappingPmsTaxCode,
      isDefault: false,
      translations: dto.propertyTaxTranslationInputList || []
    });

    const savedTax = await this.hotelTaxRepository.save(hotelTax);

    return {
      ...savedTax,
      value: savedTax.rate ? Number(savedTax.rate) : 0,
      mappingTaxCode: savedTax.mappingPmsTaxCode,
      translationList: savedTax.translations
    };
  }

  async updateHotelTax(dto: UpdateHotelTaxDto) {
    const hotelTax = await this.hotelTaxRepository.findOne({
      where: {
        id: dto.id,
        hotel: { code: dto.hotelCode }
      }
    });

    if (!hotelTax) {
      throw new NotFoundException(
        `Hotel tax with id ${dto.id} not found for hotel ${dto.hotelCode}`
      );
    }

    // Check if code already exists for this hotel (excluding current record)
    if (dto.code && dto.code !== hotelTax.code) {
      const existingTax = await this.hotelTaxRepository.findOne({
        where: {
          code: dto.code,
          hotel: { code: dto.hotelCode }
        }
      });

      if (existingTax) {
        throw new ConflictException(
          `Tax with code ${dto.code} already exists for hotel ${dto.hotelCode}`
        );
      }
    }

    // Handle value conversion
    if (dto.value !== undefined) {
      hotelTax.rate = dto.value;
    }
    // Handle date conversions
    if (dto.validFrom !== undefined && dto.validFrom !== null) {
      hotelTax.validFrom = new Date(dto.validFrom);
    } else {
      hotelTax.validFrom = null;
    }

    if (dto.validTo !== undefined && dto.validTo !== null) {
      hotelTax.validTo = new Date(dto.validTo);
    } else {
      hotelTax.validTo = null;
    }

    if (dto.name !== undefined) {
      hotelTax.name = dto.name;
    }
    hotelTax.description = dto.description || '';

    // Handle translations if provided
    if (dto.propertyTaxTranslationInputList !== undefined) {
      hotelTax.translations = dto.propertyTaxTranslationInputList?.map((translation) => ({
        languageCode: translation.languageCode,
        name: translation.name || '',
        description: translation.description || ''
      }));
    }

    return this.hotelTaxRepository.save(hotelTax);
  }

  async deleteHotelTax(dto: DeleteHotelTaxDto) {
    const hotel = await this.hotelRepository.findOne({
      where: { code: dto.hotelCode }
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with code ${dto.hotelCode} not found`);
    }

    const hotelTax = await this.hotelTaxRepository.findOne({
      where: {
        id: dto.id,
        hotelId: hotel.id
      }
    });

    if (!hotelTax) {
      throw new NotFoundException(
        `Hotel tax with id ${dto.id} not found for hotel ${dto.hotelCode}`
      );
    }

    if (hotelTax.isDefault) {
      throw new BadRequestException(`Hotel tax is default and cannot be deleted`);
    }

    // Delete related tax settings first
    await this.hotelTaxSettingRepository.delete({
      taxCode: hotelTax.code,
      hotelId: hotel.id
    });

    // Delete the tax
    return await this.hotelTaxRepository.delete(dto.id);
  }

  async setDefaultHotelTax(dto: SetDefaultHotelTaxDto) {
    const { defaultTaxIds, hotelId } = dto;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    const hotelTaxes = defaultTaxIds
      ? await this.hotelTaxRepository.find({
          where: {
            hotelId: hotelId
          }
        })
      : [];

    for (const tax of hotelTaxes) {
      if (defaultTaxIds?.includes(tax.id)) {
        tax.isDefault = true;
      } else {
        tax.isDefault = false;
      }
    }
    return await this.hotelTaxRepository.save(hotelTaxes);
  }

  async getPmsTaxList(hotelId: string) {
    return await this.pmsService.getPmsTaxList(hotelId);
  }

  async updateHotelTaxList(payload: HotelTaxInputDto[]) {
    try {
      const input: Partial<HotelTax>[] = payload.map((item) => {
        const newItem: Partial<HotelTax> = {
          id: item.id,
          mappingPmsTaxCode: item.mappingTaxCode
        };
        return newItem;
      });
      await this.hotelTaxRepository.save(input);

      return {
        status: ResponseStatusEnum.SUCCESS,
        message: 'Hotel tax list updated successfully',
        data: true
      };
    } catch (error) {
      throw new BadRequestException('Unable to update hotel tax list');
    }
  }
}
