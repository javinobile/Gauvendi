import { DbName } from '@constants/db-name.constant';
import { HotelCityTax } from '@entities/hotel-entities/hotel-city-tax.entity';
import { HotelCityTaxAgeGroup } from '@entities/hotel-entities/hotel-city-tax-age-group.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, Repository, In } from 'typeorm';
import {
  HotelCityTaxQueryDto,
  UpdateHotelCityTaxDto,
  DeleteHotelCityTaxDto,
  CreateHotelCityTaxDto,
  GetHotelCityTaxDto,
  HotelCityTaxInputDto
} from './hotel-city-tax.dto';
import { BadRequestException, ConflictException, NotFoundException } from '@exceptions/index';
import { PmsService } from '../pms/pms.service';
import { ResponseStatusEnum } from '@src/core/enums/common';

@Injectable()
export class HotelCityTaxService {
  constructor(
    @InjectRepository(HotelCityTax, DbName.Postgres)
    private readonly hotelCityTaxRepository: Repository<HotelCityTax>,
    @InjectRepository(HotelCityTaxAgeGroup, DbName.Postgres)
    private readonly hotelCityTaxAgeGroupRepository: Repository<HotelCityTaxAgeGroup>,
    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    private readonly pmsService: PmsService
  ) {}

  async getHotelCityTaxs(query: HotelCityTaxQueryDto) {
    const sort = query.sort || [];
    const orderBy: FindOptionsOrder<HotelCityTax> = {};

    for (const s of sort) {
      const [field, order] = s.split(':');
      if (field === 'code') {
        orderBy.code = order as 'ASC' | 'DESC';
      }
      if (field === 'name') {
        orderBy.name = order as 'ASC' | 'DESC';
      }
      if (field === 'status') {
        orderBy.status = order as 'ASC' | 'DESC';
      }
      if (field === 'validFrom') {
        orderBy.validFrom = order as 'ASC' | 'DESC';
      }
      if (field === 'validTo') {
        orderBy.validTo = order as 'ASC' | 'DESC';
      }
    }

    const relations: string[] = [];
    if (query.expand?.includes('ageGroup')) {
      relations.push('hotelCityTaxAgeGroups');
    }

    // Build where conditions
    const whereConditions: any = {
      hotel: { code: query.hotelCode }
    };

    // Filter by ID list if provided
    if (query.idList && query.idList.length > 0) {
      whereConditions.id = In(query.idList);
    }

    const cityTaxs = await this.hotelCityTaxRepository.find({
      where: whereConditions,
      order: orderBy,
      relations
    });

    return cityTaxs?.map((cityTax) => {
      return {
        ...cityTax,
        ageGroupList: cityTax.hotelCityTaxAgeGroups,
        mappingCityTaxCode: cityTax.mappingPmsCityTaxCode,
        translationList: cityTax.translations
      };
    });
  }

  async getHotelCityTax(dto: GetHotelCityTaxDto) {
    return await this.hotelCityTaxRepository.findOne({
      where: {
        id: dto.id,
        hotel: { code: dto.hotelCode }
      },
      relations: ['hotelCityTaxAgeGroups']
    });
  }

  async createHotelCityTax(dto: CreateHotelCityTaxDto) {
    const hotel = await this.hotelRepository.findOne({
      where: { code: dto.hotelCode }
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with code ${dto.hotelCode} not found`);
    }

    const existingCode = await this.hotelCityTaxRepository.findOne({
      where: { code: dto.code, hotelId: hotel.id }
    });

    if (existingCode) {
      throw new ConflictException(
        `Hotel city tax with code ${dto.code} already exists for hotel ${dto.hotelCode}`
      );
    }

    const hotelCityTax = this.hotelCityTaxRepository.create({
      hotelId: hotel.id,
      code: dto.code,
      name: dto.name,
      unit: dto.unit,
      value: dto.value,
      chargeMethod: dto.chargeMethod,
      validFrom: dto.validFrom,
      validTo: dto.validTo,
      status: dto.status,
      description: dto.description,
      mappingPmsCityTaxCode: dto.mappingPmsCityTaxCode,
      translations: dto.translationInputList
    });

    const savedCityTax = await this.hotelCityTaxRepository.save(hotelCityTax);

    // Create age groups if provided
    if (dto.ageGroupInputList && dto.ageGroupInputList.length > 0) {
      const ageGroups = dto.ageGroupInputList.map((ag) =>
        this.hotelCityTaxAgeGroupRepository.create({
          hotelId: hotel.id,
          hotelCityTaxId: savedCityTax.id,
          fromAge: ag.fromAge,
          toAge: ag.toAge,
          value: ag.value
        })
      );

      await this.hotelCityTaxAgeGroupRepository.save(ageGroups);
    }

    return savedCityTax;
  }

  async updateHotelCityTax(dto: UpdateHotelCityTaxDto) {
    const hotelCityTax = await this.hotelCityTaxRepository.findOne({
      where: {
        id: dto.id,
        hotel: { code: dto.hotelCode }
      }
    });

    if (!hotelCityTax) {
      throw new NotFoundException(
        `Hotel city tax with id ${dto.id} not found for hotel ${dto.hotelCode}`
      );
    }

    const { id, code, hotelCode, translationInputList, ageGroupInputList, ...dataToUpdate } = dto;

    await this.hotelCityTaxRepository.update(hotelCityTax.id, {
      ...dataToUpdate,
      translations: translationInputList || []
    });

    // Update age groups if provided
    if (ageGroupInputList) {
      // Remove existing age groups
      await this.hotelCityTaxAgeGroupRepository.delete({
        hotelCityTaxId: hotelCityTax.id
      });

      // Create new age groups
      if (ageGroupInputList.length > 0) {
        const ageGroups = ageGroupInputList.map((ag) =>
          this.hotelCityTaxAgeGroupRepository.create({
            hotelId: hotelCityTax.hotelId,
            hotelCityTaxId: hotelCityTax.id,
            fromAge: ag.fromAge,
            toAge: ag.toAge,
            value: ag.value
          })
        );

        await this.hotelCityTaxAgeGroupRepository.save(ageGroups);
      }
    }

    return { success: true };
  }

  async deleteHotelCityTax(dto: DeleteHotelCityTaxDto) {
    const hotelCityTax = await this.hotelCityTaxRepository.findOne({
      where: {
        id: dto.id,
        hotel: { code: dto.hotelCode }
      }
    });

    if (!hotelCityTax) {
      throw new NotFoundException(
        `Hotel city tax with id ${dto.id} not found for hotel ${dto.hotelCode}`
      );
    }

    // Delete age groups first (foreign key constraint)
    await this.hotelCityTaxAgeGroupRepository.delete({
      hotelCityTaxId: dto.id
    });

    // Delete the city tax
    return await this.hotelCityTaxRepository.delete(dto.id);
  }

  async getPmsCityTaxList(hotelId: string) {
    return await this.pmsService.getPmsCityTaxList(hotelId);
  }

  async updateHotelCityTaxList(payload: HotelCityTaxInputDto[]) {
    try {
      const input: Partial<HotelCityTax>[] = payload.map((item) => {
        const newItem: Partial<HotelCityTax> = {
          id: item.id,
          mappingPmsCityTaxCode: item.mappingCityTaxCode
        };
        return newItem;
      });
      await this.hotelCityTaxRepository.save(input);

      return {
        status: ResponseStatusEnum.SUCCESS,
        message: 'Hotel city tax list updated successfully',
        data: true
      };
    } catch (error) {
      throw new BadRequestException('Unable to update hotel city tax list');
    }
  }
}
