import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  HotelConfiguration,
  HotelConfigurationTypeEnum
} from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { In, Repository } from 'typeorm';
import {
  HotelConfigurationByTypesDto,
  HotelConfigurationDto
} from '../dtos/hotel-configuration.dto';

@Injectable()
export class HotelConfigurationRepository {
  private readonly logger = new Logger(HotelConfigurationRepository.name);

  constructor(
    @InjectRepository(HotelConfiguration, DB_NAME.POSTGRES)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>
  ) {}

  async getHotelConfiguration(body: HotelConfigurationDto): Promise<HotelConfiguration | null> {
    try {
      const hotelConfiguration = await this.hotelConfigurationRepository.findOne({
        where: {
          hotelId: body.hotelId,
          configType: body.configType as HotelConfigurationTypeEnum
        }
      });

      return hotelConfiguration;
    } catch (error) {
      this.logger.error(`Error getting hotel configuration: ${error}`);
      throw new Error(error);
    }
  }

  async getHotelConfigurationByTypes(
    body: HotelConfigurationByTypesDto
  ): Promise<HotelConfiguration[]> {
    try {
      const hotelConfiguration = await this.hotelConfigurationRepository.find({
        where: {
          hotelId: body.hotelId,
          configType: In(body.configTypes)
        },
        select: {
          configType: true,
          configValue: true
        }
      });

      return hotelConfiguration;
    } catch (error) {
      this.logger.error(`Error getting hotel configuration by types: ${error}`);
      throw new Error(error);
    }
  }
}
