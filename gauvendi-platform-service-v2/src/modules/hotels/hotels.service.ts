import { DbName } from '@constants/db-name.constant';
import { HotelConfiguration } from '@entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { HotelConfigurationTypeEnum, PaymentAccountOriginEnum } from '@enums/common';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { FileLibrary } from '@src/core/entities/core-entities/file-library.entity';
import { HotelPaymentAccount } from '@src/core/entities/hotel-entities/hotel-payment-account.entity';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { S3Service } from '@src/core/s3/s3.service';
import { DataSource, Repository } from 'typeorm';
import {
  HotelPhotoTypeEnum,
  UploadEmailGeneralImagesDto,
  UploadHotelFaviconDto,
  UploadHotelLogoDto
} from './dtos/upload-hotel-image.dto';
import { transformHotelToResponse } from './hotel.util';
import {
  GetPaymentAccountListQueryDto,
  HotelInformationQueryDto,
  HotelsQueryDto,
  UpdateHotelInformationBodyDto
} from './hotels.dto';
@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);

  constructor(
    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    private readonly configService: ConfigService,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly s3Service: S3Service,

    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,

    @InjectRepository(FileLibrary, DbName.Postgres)
    private readonly fileLibraryRepository: Repository<FileLibrary>,

    @InjectRepository(MappingPmsHotel, DbName.Postgres)
    private readonly mappingPmsHotelRepository: Repository<MappingPmsHotel>,

    @InjectRepository(HotelPaymentAccount, DbName.Postgres)
    private readonly hotelPaymentAccountRepository: Repository<HotelPaymentAccount>
  ) {}

  async getHotelInformation(payload: HotelInformationQueryDto) {
    const relations: string[] = [];

    // Add conditional joins based on expand parameters
    if (payload.expand && payload.expand.length > 0) {
      if (payload.expand.includes('hotelConfiguration')) {
        relations.push('hotelConfigurations');
        relations.push('baseCurrency');
        relations.push('country');
        relations.push('iconImage');
        relations.push('emailImage');
      }
      if (payload.expand.includes('hotelTaxSettings')) {
        relations.push('hotelTaxSettings');
      }
    }
    const hotel = await this.hotelRepository.findOne({
      where: {
        ...(payload.hotelCode && { code: payload.hotelCode }),
        ...(payload.hotelId && { id: payload.hotelId })
      },
      relations
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel with code ${payload.hotelCode} not found`);
    }
    return transformHotelToResponse(
      hotel,
      this.configService.get('S3_CDN_URL'),
      payload.translateTo
    );
  }

  async getHotels(payload: HotelsQueryDto) {
    const relations: string[] = [];
    if (payload.expand?.includes('country')) {
      relations.push('country');
    }
    if (payload.expand?.includes('currency')) {
      relations.push('baseCurrency');
    }
    if (payload.expand?.includes('iconImage')) {
      relations.push('hotelConfigurations');
    }
    const hotels = await this.hotelRepository.find({
      relations
    });
    return hotels?.map((hotel) =>
      transformHotelToResponse(hotel, this.configService.get('S3_CDN_URL'))
    );
  }

  async getHotelMapping(payload: { hotelId: string }) {
    const hotel = await this.mappingPmsHotelRepository.findOne({
      where: { hotelId: payload.hotelId },
      relations: ['connector']
    });

    if (!hotel) {
      return null;
    }

    return [
      {
        id: hotel.id,
        connectorId: hotel.connectorId,
        mappingHotelCode: hotel.mappingHotelCode,
        connector: {
          connectorType: hotel.connector.connectorType
        }
      }
    ];
  }

  async updateHotelInformation(payload: UpdateHotelInformationBodyDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the existing hotel
      const existingHotel = await this.hotelRepository.findOne({
        where: { code: payload.code },
        relations: ['hotelConfigurations']
      });

      if (!existingHotel) {
        throw new NotFoundException(`Hotel with code ${payload.code} not found`);
      }

      // Prepare hotel update data with proper field mapping
      const hotelUpdateData: Partial<Hotel> = {};

      // Map DTO fields to entity fields
      if (payload.name !== undefined) hotelUpdateData.name = payload.name;
      if (payload.status !== undefined) hotelUpdateData.status = payload.status;
      if (payload.initialSetup !== undefined) hotelUpdateData.initialSetup = payload.initialSetup;
      if (payload.city !== undefined) hotelUpdateData.city = payload.city;
      if (payload.state !== undefined) hotelUpdateData.state = payload.state;
      if (payload.postalCode !== undefined) hotelUpdateData.postalCode = payload.postalCode;
      if (payload.address !== undefined) hotelUpdateData.address = payload.address;
      if (payload.countryId !== undefined) hotelUpdateData.countryId = payload.countryId;
      if (payload.baseCurrencyId !== undefined)
        hotelUpdateData.baseCurrencyId = payload.baseCurrencyId;
      if (payload.phoneCode !== undefined) hotelUpdateData.phoneCode = payload.phoneCode;
      if (payload.phoneNumber !== undefined) hotelUpdateData.phoneNumber = payload.phoneNumber;
      if (payload.timeZone !== undefined) hotelUpdateData.timeZone = payload.timeZone;
      if (payload.roomNumber !== undefined) hotelUpdateData.roomNumber = payload.roomNumber;
      if (payload.addressDisplay !== undefined)
        hotelUpdateData.addressDisplay = payload.addressDisplay;
      if (payload.measureMetric !== undefined)
        hotelUpdateData.measureMetric = payload.measureMetric;
      if (payload.isCityTaxIncludedSellingPrice !== undefined)
        hotelUpdateData.isCityTaxIncludedSellingPrice = payload.isCityTaxIncludedSellingPrice;
      if (payload.latitude !== undefined) hotelUpdateData.latitude = payload.latitude;
      if (payload.longitude !== undefined) hotelUpdateData.longitude = payload.longitude;

      // Handle field name mappings
      if (payload.emailAddressList !== undefined)
        hotelUpdateData.emailAddress = payload.emailAddressList;
      if (payload.preferredLanguage !== undefined)
        hotelUpdateData.preferredLanguageCode = payload.preferredLanguage;

      // Update hotel if there are changes
      if (Object.keys(hotelUpdateData).length > 0) {
        await queryRunner.manager.update(Hotel, { id: existingHotel.id }, hotelUpdateData);
      }

      // Handle configuration updates
      await this.updateHotelConfigurations(
        queryRunner,
        existingHotel.id,
        existingHotel.hotelConfigurations,
        payload
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Hotel information updated successfully',
        data: { status: 'Success' }
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update hotel information: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  private async updateHotelConfigurations(
    queryRunner: any,
    hotelId: string,
    hotelConfigurations: HotelConfiguration[],
    payload: UpdateHotelInformationBodyDto
  ) {
    const allowTypes = [
      HotelConfigurationTypeEnum.TERMS_OF_USE_URL,
      HotelConfigurationTypeEnum.PRIVACY_STATEMENT_URL,
      HotelConfigurationTypeEnum.IMPRESSUM_URL,
      HotelConfigurationTypeEnum.LOGO_URL
    ];

    for (const type of allowTypes) {
      const existingConfig = hotelConfigurations.find((c) => c.configType === type);
      if (existingConfig) {
        let configValue = existingConfig?.configValue || {};
        switch (type) {
          case HotelConfigurationTypeEnum.TERMS_OF_USE_URL:
            configValue.metadata = payload.hotelTermAndConditionUrl;
            break;

          case HotelConfigurationTypeEnum.PRIVACY_STATEMENT_URL:
            configValue.metadata = payload.hotelPrivacyPolicyUrl;
            break;

          case HotelConfigurationTypeEnum.IMPRESSUM_URL:
            configValue.metadata = payload.hotelImpressumUrl;
            break;

          case HotelConfigurationTypeEnum.LOGO_URL:
            configValue.content = payload.hotelWebsiteUrl?.defaultUrl;
            break;
        }
        await queryRunner.manager.update(
          HotelConfiguration,
          { id: existingConfig.id },
          { configValue }
        );
      }
    }
  }

  async uploadHotelLogo(payload: UploadHotelLogoDto & { file: any }) {
    const hotel = await this.hotelRepository.findOne({
      where: {
        code: payload.hotelCode
      }
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel code ${payload.hotelCode} not found`);
    }
    const originalFileName = payload.file?.originalname?.replace(/\s+/g, '_');
    const key = `hotel/${payload.hotelCode}/${new Date().getTime()}_${originalFileName}`;
    await this.s3Service.uploadFile(payload.file, key);
    const logo = await this.fileLibraryRepository.save({
      originalName: originalFileName,
      contentType: payload.file?.mimetype,
      url: key,
      fileSize: payload.file?.size
    });
    hotel.iconImageId = logo.id;
    return this.hotelRepository.save(hotel);
  }

  async uploadHotelFavicon(payload: UploadHotelFaviconDto & { file: any }) {
    const hotelConfiguration = await this.hotelConfigurationRepository.findOne({
      where: {
        hotel: { code: payload.hotelCode },
        configType: HotelConfigurationTypeEnum.FAVICON_IMAGE_URL
      }
    });
    if (!hotelConfiguration) {
      throw new NotFoundException(`Hotel configuration with code ${payload.hotelCode} not found`);
    }
    const originalFileName = payload.file?.originalname?.replace(/\s+/g, '_');
    const key = `hotel/${payload.hotelCode}/${new Date().getTime()}_${originalFileName}`;
    await this.s3Service.uploadFile(payload.file, key);

    const fullUrl = this.configService.get('S3_CDN_URL') + '/' + key;
    hotelConfiguration.configValue = {
      ...hotelConfiguration.configValue,
      content: fullUrl
    };

    return this.hotelConfigurationRepository.save(hotelConfiguration);
  }

  async getPaymentAccountList(payload: GetPaymentAccountListQueryDto) {
    try {
      const { hotelId, origin } = payload;

      const paymentAccounts = await this.hotelPaymentAccountRepository.find({
        where: {
          hotelId,
          // fallback for call from platform
          origin: origin || PaymentAccountOriginEnum.EXTRANET
        }
      });

      return paymentAccounts;
    } catch (error) {
      this.logger.error(`Error fetching payment account list: `, JSON.stringify(error));

      if (!(error instanceof BadRequestException)) {
        throw error;
      }

      throw new BadRequestException(`Failed to fetch payment account list: ${error.message}`);
    }
  }

  async uploadHotelImages(payload: UploadEmailGeneralImagesDto & { file: any }) {
    const { hotelPhotoType } = payload;

    const hotelConfiguration = await this.hotelConfigurationRepository.findOne({
      where: {
        hotel: { code: payload.hotelCode },
        configType: HotelConfigurationTypeEnum.BRANDING_MARKETING
      }
    });
    if (!hotelConfiguration) {
      throw new NotFoundException(`Hotel configuration with code ${payload.hotelCode} not found`);
    }
    const fullUrl = await this.buildImageUrl(payload);
    const metadata = hotelConfiguration.configValue.metadata;
    const keys = {
      [HotelPhotoTypeEnum.EMAIL_PROPERTY_COVER]: 'hotelImageCoverUrl',
      [HotelPhotoTypeEnum.EMAIL_LOGO]: 'hotelImageLogoUrl',
      [HotelPhotoTypeEnum.EMAIL_PROPERTY_PREVIEW]: 'hotelImagePreviewUrl'
    };
    const key = keys[hotelPhotoType] as any;
    hotelConfiguration.configValue = {
      metadata: {
        ...metadata,
        [key]: fullUrl
      }
    };

    return this.hotelConfigurationRepository.save(hotelConfiguration);
  }

  private async buildImageUrl(payload: UploadEmailGeneralImagesDto & { file: any }) {
    const originalFileName = payload.file?.originalname?.replace(/\s+/g, '_');
    const key = `hotel/${payload.hotelCode}/${new Date().getTime()}_${originalFileName}`;
    await this.s3Service.uploadFile(payload.file, key);
    const fullUrl = this.configService.get(ENVIRONMENT.S3_CDN_URL) + '/' + key;
    return fullUrl;
  }
}
