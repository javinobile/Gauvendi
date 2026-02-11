import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  AmenityStatusEnum,
  DistributionChannelEnum,
  HotelAmenity
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import {
  HotelTaxSetting,
  ServiceTypeEnum
} from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { S3Service } from 'src/core/s3/s3.service';
import { CurrencyService } from 'src/modules/currency/currency.service';
import { FindOptionsWhere, In, Raw, Repository } from 'typeorm';
import { HotelFilterDto, HotelResponseDto } from '../dtos/hotel.dto';
import { HotelRepository } from '../repositories/hotel.repository';
import { ResponseData } from 'src/modules/core/dtos/common.dto';
@Injectable()
export class HotelService {
  constructor(
    private readonly hotelRepository: HotelRepository,
    private s3Service: S3Service,
    private readonly currencyService: CurrencyService,

    @InjectRepository(HotelTaxSetting, DB_NAME.POSTGRES)
    private hotelTaxSettingRepository: Repository<HotelTaxSetting>,
    @InjectRepository(HotelAmenity, DB_NAME.POSTGRES)
    private hotelAmenityRepository: Repository<HotelAmenity>
  ) {}

  async getHotel(filter: HotelFilterDto): Promise<HotelResponseDto> {
    const result = await this.hotelRepository.getHotel(filter);
    const mappedResult = await this.mapHotel(result);
    return mappedResult;
  }

  async getHotelWidget(filter: HotelFilterDto): Promise<ResponseData<HotelResponseDto>> {
    const hotels = await this.hotelRepository.getHotels(filter);
    const mappedResult = await Promise.all(hotels.map((hotel) => this.mapHotelWidget(hotel)));
    return {
      count: hotels.length,
      totalPage: 1,
      data: mappedResult
    };
  }

  private async mapHotel(hotel: Hotel): Promise<HotelResponseDto> {
    const currencyWithRates = await this.currencyService.getCurrencyWithRates(hotel.baseCurrencyId);
    const [
      iconImageUrl,
      backgroundCategoryImageUrl,
      customThemeImageUrl,
      lowestPriceImageUrl,
      stayOptionBackgroundImageUrl,
      customizeStayOptionBackgroundImageUrl,
      stayOptionSuggestionImageUrl,
      signatureBackgroundImageUrl
    ] = await Promise.all([
      hotel.iconImage?.url ? await this.s3Service.getPreSignedUrl(hotel.iconImage.url) : '',
      hotel.backgroundCategoryImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.backgroundCategoryImage.url)
        : '',
      hotel.customThemeImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.customThemeImage.url)
        : '',
      hotel.lowestPriceImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.lowestPriceImage.url)
        : '',
      hotel.stayOptionBackgroundImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.stayOptionBackgroundImage.url)
        : '',
      hotel.customizeStayOptionBackgroundImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.customizeStayOptionBackgroundImage.url)
        : '',
      hotel.stayOptionSuggestionImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.stayOptionSuggestionImage.url)
        : '',
      hotel.signatureBackgroundImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.signatureBackgroundImage.url)
        : ''
    ]);

    return {
      id: hotel.id,
      name: hotel.name,
      code: hotel.code,
      timeZone: hotel.timeZone,
      iconImageUrl: iconImageUrl,
      iconSymbolUrl: iconImageUrl,
      state: hotel.state,
      city: hotel.city,
      address: hotel.address,
      phoneCode: hotel.phoneCode,
      phoneNumber: hotel.phoneNumber,
      emailAddressList: hotel.emailAddress,
      postalCode: hotel.postalCode,
      signature: hotel.signature,
      backgroundCategoryImageUrl: backgroundCategoryImageUrl,
      customThemeImageUrl: customThemeImageUrl,
      lowestPriceImageUrl: lowestPriceImageUrl,
      measureMetric: hotel.measureMetric,
      addressDisplay: hotel.addressDisplay,
      isCityTaxIncludedSellingPrice: hotel.isCityTaxIncludedSellingPrice,
      brand: {
        name: hotel.brand?.name
      },
      country: {
        name: hotel.country?.name,
        code: hotel.country?.code,
        phoneCode: hotel.country?.phoneCode,
        translationList: hotel.country?.translations
      },
      taxSetting: hotel.taxSetting,
      serviceChargeSetting: hotel.serviceChargeSetting,
      hotelPaymentModeList: hotel.paymentModes,
      hotelConfigurationList: hotel.hotelConfigurations.map((hotelConfiguration) => ({
        configType: hotelConfiguration.configType,
        configValue: hotelConfiguration.configValue
      })),
      paymentAccount: null,
      baseCurrency: {
        code: hotel.baseCurrency?.code,
        currencyRateList:
          currencyWithRates?.currencyRates?.map((currencyRate) => ({
            rate: currencyRate.rate,
            exchangeCurrency: {
              code: currencyRate.exchangeCurrency?.code
            }
          })) ?? []
      },
      stayOptionBackgroundImageUrl: stayOptionBackgroundImageUrl,
      customizeStayOptionBackgroundImageUrl: customizeStayOptionBackgroundImageUrl,
      stayOptionSuggestionImageUrl: stayOptionSuggestionImageUrl,
      signatureBackgroundImageUrl: signatureBackgroundImageUrl
    };
  }

  private async mapHotelWidget(hotel: Hotel): Promise<HotelResponseDto> {
    const currencyWithRates = await this.currencyService.getCurrencyWithRates(hotel.baseCurrencyId);
    const [
      iconImageUrl,
      backgroundCategoryImageUrl,
      customThemeImageUrl,
      lowestPriceImageUrl,
      stayOptionBackgroundImageUrl,
      customizeStayOptionBackgroundImageUrl,
      stayOptionSuggestionImageUrl,
      signatureBackgroundImageUrl
    ] = await Promise.all([
      hotel.iconImage?.url ? await this.s3Service.getPreSignedUrl(hotel.iconImage.url) : '',
      hotel.backgroundCategoryImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.backgroundCategoryImage.url)
        : '',
      hotel.customThemeImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.customThemeImage.url)
        : '',
      hotel.lowestPriceImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.lowestPriceImage.url)
        : '',
      hotel.stayOptionBackgroundImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.stayOptionBackgroundImage.url)
        : '',
      hotel.customizeStayOptionBackgroundImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.customizeStayOptionBackgroundImage.url)
        : '',
      hotel.stayOptionSuggestionImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.stayOptionSuggestionImage.url)
        : '',
      hotel.signatureBackgroundImage?.url
        ? await this.s3Service.getPreSignedUrl(hotel.signatureBackgroundImage.url)
        : ''
    ]);

    return {
      id: hotel.id,
      name: hotel.name,
      code: hotel.code,
      timeZone: hotel.timeZone,
      iconImageUrl: iconImageUrl,
      iconSymbolUrl: iconImageUrl,
      state: hotel.state,
      city: hotel.city,
      address: hotel.address,
      phoneCode: hotel.phoneCode,
      phoneNumber: hotel.phoneNumber,
      emailAddressList: hotel.emailAddress,
      postalCode: hotel.postalCode,
      signature: hotel.signature,
      backgroundCategoryImageUrl: backgroundCategoryImageUrl,
      customThemeImageUrl: customThemeImageUrl,
      lowestPriceImageUrl: lowestPriceImageUrl,
      measureMetric: hotel.measureMetric,
      addressDisplay: hotel.addressDisplay,
      isCityTaxIncludedSellingPrice: hotel.isCityTaxIncludedSellingPrice,
      brand: {
        name: hotel.brand?.name
      },
      country: {
        name: hotel.country?.name,
        code: hotel.country?.code,
        phoneCode: hotel.country?.phoneCode,
        translationList: hotel.country?.translations
      },
      taxSetting: hotel.taxSetting,
      serviceChargeSetting: hotel.serviceChargeSetting,
      hotelPaymentModeList: hotel.paymentModes,
      hotelConfigurationList: hotel.hotelConfigurations.map((hotelConfiguration) => ({
        configType: hotelConfiguration.configType,
        configValue: hotelConfiguration.configValue
      })),
      paymentAccount: null,
      baseCurrency: {
        code: hotel.baseCurrency?.code,
        currencyRateList:
          currencyWithRates?.currencyRates?.map((currencyRate) => ({
            rate: currencyRate.rate,
            exchangeCurrency: {
              code: currencyRate.exchangeCurrency?.code
            }
          })) ?? []
      },
      stayOptionBackgroundImageUrl: stayOptionBackgroundImageUrl,
      customizeStayOptionBackgroundImageUrl: customizeStayOptionBackgroundImageUrl,
      stayOptionSuggestionImageUrl: stayOptionSuggestionImageUrl,
      signatureBackgroundImageUrl: signatureBackgroundImageUrl
    };
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
    serviceCodes: string[] | null = null,
    fromDate?: string,
    toDate?: string
  ): Promise<{
    accommodationTaxes: HotelTaxSetting[];
    extrasTaxes: HotelTaxSetting[];
  }> {
    if (!serviceCodes || serviceCodes.length === 0) {
      return {
        accommodationTaxes: [],
        extrasTaxes: []
      };
    }
    try {
      const where: FindOptionsWhere<HotelTaxSetting> = {
        hotelId,
        hotelTax: {}
      };

      where.hotelTax = {
        hotelId: hotelId
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

      if (serviceCodes?.length) {
        serviceCodes.push(...serviceCodes);
      }

      if (serviceCodes.length > 0) {
        where.serviceCode = In(serviceCodes);
      }

      // Find with relations
      const hotelTaxSettings = await this.hotelTaxSettingRepository.find({
        where,
        relations: ['hotelTax'],
        select: {
          hotelId: true,
          serviceCode: true,
          serviceType: true,
          taxCode: true,
          hotelTax: {
            code: true,
            rate: true,
            name: true,
            validFrom: true,
            validTo: true
          }
        }
      });

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
        'hac.code'
      ]);

    return qb.getMany();
  }
}
