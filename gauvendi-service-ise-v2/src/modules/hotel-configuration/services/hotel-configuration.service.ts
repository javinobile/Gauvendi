import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { Repository } from 'typeorm';

import { LanguageCodeEnum, Translation } from 'src/core/database/entities/base.entity';
import {
  HotelConfiguration,
  HotelConfigurationTypeEnum
} from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelRetailCategoryTranslation } from 'src/core/entities/hotel-retail-category-translation.entity';
import { S3Service } from 'src/core/s3/s3.service';
import { HotelConfigurationFilterDto } from '../dtos/hotel-configuration-filter.dto';
import { FontWeightDetailsTypeEnum } from '../dtos/hotel-configuration.enums';
import { FontWeightDetailsDto, HotelMainFontDto } from '../dtos/hotel-main-font.dto';
import { HotelConfigurationRepository } from '../repositories/hotel-configuration.repository';
import { HotelBrandingResponseDto } from '../dtos/hotel-brandings.dto';

@Injectable()
export class HotelConfigurationService {
  constructor(
    private readonly hotelConfigurationRepository: HotelConfigurationRepository,
    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,
    private readonly s3Service: S3Service
  ) {}

  async findMainFontInformation(
    filter: HotelConfigurationFilterDto
  ): Promise<HotelMainFontDto[] | null> {
    try {
      let hotelId = filter.hotelId;
      if (filter.hotelCode && !filter.hotelId) {
        const hotel = await this.hotelRepository.findOne({ where: { code: filter.hotelCode } });
        if (!hotel) {
          throw new NotFoundException('Hotel not found');
        }
        hotelId = hotel.id;
      }

      // Step 2: Create hotel configuration filter
      const hotelConfigurationFilter: HotelConfigurationFilterDto = {
        hotelId: hotelId,
        configTypes: [HotelConfigurationTypeEnum.FONT_FAMILY_PRIMARY]
      };

      // Step 3: Get hotel configuration
      const mainFontConfigResponse =
        await this.hotelConfigurationRepository.findAll(hotelConfigurationFilter);

      if (!mainFontConfigResponse || mainFontConfigResponse.length === 0) {
        return null;
      }

      // Step 4: Extract font configuration
      const mainFontConfig = mainFontConfigResponse[0];
      const configValueMetaData = mainFontConfig.configValue?.metadata;

      if (!configValueMetaData || Object.keys(configValueMetaData).length === 0) {
        return null;
      }

      // Step 5: Extract font information
      const fontName = configValueMetaData['content']?.toString() || null;
      const isCustomFont = configValueMetaData['isCustomFont']
        ? Boolean(configValueMetaData['isCustomFont'].toString())
        : undefined;

      // Step 6: Create property main font DTO
      const hotelMainFont: HotelMainFontDto = {
        fontName,
        isCustomFont: isCustomFont,
        fontWeightDetailsList: await this.getFontWeightDataList(configValueMetaData)
      };

      // Step 7: Return response
      return [hotelMainFont];
    } catch (error) {
      console.error('Error in findMainFontInformation:', error);
      throw error;
    }
  }

  async findAll(filter: HotelConfigurationFilterDto): Promise<HotelConfiguration[]> {
    let hotelId = filter.hotelId;
    if (filter.hotelCode && !filter.hotelId) {
      const hotel = await this.hotelRepository.findOne({ where: { code: filter.hotelCode } });
      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }
      hotelId = hotel.id;
    }

    return this.hotelConfigurationRepository.findAll({
      ...filter,
      hotelId
    });
  }

  private translationToDto(translation: HotelRetailCategoryTranslation): Translation {
    return {
      languageCode: translation.languageCode as LanguageCodeEnum,
      name: translation.name,
      description: ''
    };
  }

  private async getFontWeightDataList(
    configValueMetaData: Record<string, any>
  ): Promise<FontWeightDetailsDto[]> {
    try {
      // Step 1: Extract font weight URLs
      const fontWeight300Url = configValueMetaData['fontWeight300Url']?.toString() || null;
      const fontWeight400Url = configValueMetaData['fontWeight400Url']?.toString() || null;
      const fontWeight500Url = configValueMetaData['fontWeight500Url']?.toString() || null;
      const fontWeight600Url = configValueMetaData['fontWeight600Url']?.toString() || null;
      const fontWeight700Url = configValueMetaData['fontWeight700Url']?.toString() || null;

      // Step 2: Filter non-null URLs
      const fontWeightUrlList = [
        fontWeight300Url,
        fontWeight400Url,
        fontWeight500Url,
        fontWeight600Url,
        fontWeight700Url
      ].filter((url) => url !== null) as string[];

      if (fontWeightUrlList.length === 0) {
        return [];
      }

      // Step 3: Get file library data
      const urlList = await Promise.all(
        fontWeightUrlList.map((url) => this.s3Service.getPreSignedUrl(url))
      );
      // const fileLibraryList = await this.getFileLibraryList(fileLibraryFilter);
      // if (!fileLibraryList || fileLibraryList.length === 0) {
      //   return [];
      // }

      // Step 4: Map file libraries to font weight details
      const fontWeightDetailsList: FontWeightDetailsDto[] = [];

      for (const url of urlList) {
        // Determine font weight type
        let type: FontWeightDetailsTypeEnum | undefined = undefined;

        if (fontWeight300Url && url.includes(fontWeight300Url)) {
          type = FontWeightDetailsTypeEnum.FONT_WEIGHT_300;
        } else if (fontWeight400Url && url.includes(fontWeight400Url)) {
          type = FontWeightDetailsTypeEnum.FONT_WEIGHT_400;
        } else if (fontWeight500Url && url.includes(fontWeight500Url)) {
          type = FontWeightDetailsTypeEnum.FONT_WEIGHT_500;
        } else if (fontWeight600Url && url.includes(fontWeight600Url)) {
          type = FontWeightDetailsTypeEnum.FONT_WEIGHT_600;
        } else if (fontWeight700Url && url.includes(fontWeight700Url)) {
          type = FontWeightDetailsTypeEnum.FONT_WEIGHT_700;
        }

        const fontWeightDetails: FontWeightDetailsDto = {
          url: url,
          type
        };

        fontWeightDetailsList.push(fontWeightDetails);
      }

      return fontWeightDetailsList;
    } catch (error) {
      console.error('Error in getFontWeightDataList:', error);
      return [];
    }
  }

  async getHotelBrandings(
    filter: HotelConfigurationFilterDto
  ): Promise<HotelBrandingResponseDto[]> {
    const result = await this.findAll({
      ...filter,
      configTypes: [HotelConfigurationTypeEnum.PROPERTY_BRANDING]
    });
    const metadata = result?.[0]?.configValue?.metadata as Record<string, any>[];
    if (!metadata) {
      return [];
    }

    const mappedData = Object.keys(metadata).map((key) => ({
      key: key,
      value: metadata[key]
    }));
    return mappedData;
  }
}
