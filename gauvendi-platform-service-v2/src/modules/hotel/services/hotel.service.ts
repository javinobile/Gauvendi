import { ServiceTypeEnum } from '@enums/common';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HotelTax } from '@src/core/entities/hotel-entities/hotel-tax.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import {
  AmenityStatusEnum,
  DistributionChannelEnum,
  HotelAmenity
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { In, Raw, Repository } from 'typeorm';

@Injectable()
export class HotelService implements OnModuleInit {
  constructor(
    @InjectRepository(HotelAmenity, DbName.Postgres)
    private hotelAmenityRepository: Repository<HotelAmenity>,

    @InjectRepository(HotelTaxSetting, DbName.Postgres)
    private hotelTaxSettingRepository: Repository<HotelTaxSetting>,

    @InjectRepository(HotelTax, DbName.Postgres)
    private hotelTaxRepository: Repository<HotelTax>
  ) {}

  async onModuleInit() {}

  async getHotelAmenities(hotelId: string, isIse: boolean = false) {
    const distributionChannels = isIse
      ? [DistributionChannelEnum.GV_SALES_ENGINE]
      : [DistributionChannelEnum.GV_VOICE, DistributionChannelEnum.GV_SALES_ENGINE];
    const qb = this.hotelAmenityRepository
      .createQueryBuilder('h')
      .leftJoin('h.hotelAmenityPrices', 'hap')
      .leftJoin('hap.hotelAgeCategory', 'hac')
      .where('h.hotelId = :hotelId', { hotelId })
      .andWhere('h.status = :status', { status: AmenityStatusEnum.ACTIVE })
      .andWhere('h.distribution_channel && :distributionChannels', {
        distributionChannels: distributionChannels
      })
      .orderBy('h.displaySequence', 'ASC')
      .select([
        'h.id',
        'h.name',
        'h.sellingType',
        'h.description',
        'h.status',
        'h.amenityType',
        'h.pricingUnit',
        'h.code',
        'h.distributionChannel',
        'hap.price',
        'hac.code',
        'hac.fromAge',
        'hac.toAge',
        'h.isePricingDisplayMode',
        'h.translations',
        'h.linkedAmenityCode',
        'h.availability'
      ]);

    return qb.getMany();
  }

  /**
   * Get hotel tax settings for both accommodation (rate plan) and extras
   * @param hotelId - Hotel ID
   * @param ratePlanCode - Rate plan code for accommodation taxes
   * @param extraServiceCodes - Array of extra service codes for extras taxes
   * @param fromDate - Start date for tax validity (optional)
   * @param toDate - End date for tax validity (optional)
   * @returns Combined tax settings grouped by service type
   */
  async getHotelTaxSettings(
    hotelId: string,
    codeList: string[] | null = null,
    fromDate?: string,
    toDate?: string
  ): Promise<{
    accommodationTaxes: HotelTaxSetting[];
    extrasTaxes: HotelTaxSetting[];
  }> {
    if (!codeList || codeList.length === 0) {
      return {
        accommodationTaxes: [],
        extrasTaxes: []
      };
    }
    try {
      const where: any = {
        hotelId,
        hotelTax: {}
      };

      // Handle date filters if provided
      if (fromDate && toDate) {
        where.hotelTax.validFrom = Raw((alias) => `${alias} IS NULL OR ${alias} <= :toDate`, {
          toDate
        });
        where.hotelTax.validTo = Raw((alias) => `${alias} IS NULL OR ${alias} >= :fromDate`, {
          fromDate
        });
      }

      // Service code conditions
      let serviceCodes: string[] = [];

      const whereServiceCode: any = {
        ...where
      };
      if (codeList?.length) {
        serviceCodes.push(...codeList);
      }

      if (serviceCodes.length > 0) {
        where.serviceCode = In(serviceCodes);
      }

      // Find with relations
      const hotelTaxSettings = await this.hotelTaxSettingRepository.find({
        where,
        relations: ['hotelTax'],
        select: {
          serviceCode: true,
          serviceType: true,
          taxCode: true,
          hotelTax: {
            rate: true,
            name: true,
            code: true,
            validFrom: true,
            validTo: true
          }
        }
      });

      const hotelTaxes = await this.hotelTaxRepository.find({
        where: {
          hotelId,
          code: In(hotelTaxSettings.map((tax) => tax.taxCode))
        }
      });

      for (const taxSettings of hotelTaxSettings) {
        const hotelTax = hotelTaxes.find((tax) => tax.code === taxSettings.taxCode);
        if (hotelTax) {
          taxSettings.hotelTax = hotelTax;
        }
      }

      // Separate by service type
      const accommodationTaxes = hotelTaxSettings.filter(
        (tax) => tax.serviceType === ServiceTypeEnum.ACCOMMODATION
      );

      const extrasTaxes = hotelTaxSettings.filter(
        (tax) => tax.serviceType === ServiceTypeEnum.EXTRAS
      );

      // Calculate totals
      const totalAccommodationTaxRate = accommodationTaxes.reduce(
        (acc, tax) => acc + (tax.hotelTax?.rate || 0),
        0
      );
      const totalExtrasTaxRate = extrasTaxes.reduce(
        (acc, tax) => acc + (tax.hotelTax?.rate || 0),
        0
      );

      const extrasTaxMap = new Map<string, number>();
      extrasTaxes.forEach((tax) => {
        const currentRate = extrasTaxMap.get(tax.serviceCode) || 0;
        extrasTaxMap.set(tax.serviceCode, currentRate + (tax.hotelTax?.rate || 0));
      });

      return {
        accommodationTaxes,
        extrasTaxes
      };
    } catch (error) {
      // Log error if needed
      return {
        accommodationTaxes: [],
        extrasTaxes: []
      };
    }
  }
}
