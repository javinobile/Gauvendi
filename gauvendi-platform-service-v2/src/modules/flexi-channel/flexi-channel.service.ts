import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { FlexiChannelType, FlexiHotel } from '@src/core/entities/flexi-entities/flexi-hotel.entity';
import { FlexiRatePlan } from '@src/core/entities/flexi-entities/flexi-rate-plan.entity';
import { FlexiRoomType } from '@src/core/entities/flexi-entities/flexi-room-type.entity';
import { BusinessLogicException, ValidationException } from '@src/core/exceptions';
import { DataSource, In, Repository } from 'typeorm';
import {
  CreateFlexiChannel,
  FlexiChannelFilter,
  FlexiChannelMapping,
  FlexiChannelMappingUpdate,
  UpdateFlexiChannel,
  UpdateFlexiRatePlanMapping,
  UpdateFlexiRatePlanMappings,
  UpdateFlexiRoomMapping,
  UpdateFlexiRoomMappings
} from './flexi-channel.dto';
import { GoogleHotelEntity, GoogleHotelStatusEnum } from '@src/core/entities/google-entities/google-hotel.entity';

// Constants for SiteMinder channel configuration
const SITEMINDER_CONFIG = {
  code: FlexiChannelType.SITEMINDER,
  name: 'SiteMinder',
  description:
    'Integrating with SiteMinder channel manager includes pushing availability, rates, inventory and restrictions updates.',
  logoUrl: 'https://assets-cdn.gauvendi.com/platform/partners/channel_manager/siteminder.png'
};

const GOOGLE_CONFIG = {
  code: FlexiChannelType.GOOGLE_HOTEL,
  name: 'Google Hotel (Free Booking Link)',
  description:
    'Integrating with Google Hotel (Free Booking Link) channel manager includes pushing availability, rates, inventory and restrictions updates.',
  logoUrl: 'https://assets-cdn.gauvendi.com/platform/partners/channel_manager/google_hotel_logo.svg'
};

@Injectable()
export class FlexiChannelService {
  constructor(
    @InjectRepository(FlexiHotel, DbName.Postgres)
    private readonly flexiHotelRepository: Repository<FlexiHotel>,

    @InjectRepository(FlexiRatePlan, DbName.Postgres)
    private readonly flexiRatePlanRepository: Repository<FlexiRatePlan>,

    @InjectRepository(FlexiRoomType, DbName.Postgres)
    private readonly flexiRoomTypeRepository: Repository<FlexiRoomType>,

    @InjectRepository(GoogleHotelEntity, DbName.Postgres)
    private readonly googleHotelRepository: Repository<GoogleHotelEntity>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource
  ) {}

  async getFlexiChannelList(filter: FlexiChannelFilter) {
    const { hotelId } = filter;

    if (!hotelId) {
      throw new ValidationException('Hotel id is required');
    }

    try {
      const siteminderObj = {
        ...SITEMINDER_CONFIG,
        isConnected: false
      };

      const googleObj = {
        ...GOOGLE_CONFIG,
        isConnected: false,
        metadata: null
      };

      const googleHotel = await this.googleHotelRepository.findOne({
        where: {
          hotelId
        }
      });

      const flexiHotels = await this.flexiHotelRepository.find({
        where: {
          hotelId
        }
      });

      // Build Google Hotel response
      if (googleHotel) {
        googleObj.isConnected = googleHotel.status === GoogleHotelStatusEnum.ACTIVE;
        googleObj.metadata = [
          {
            mappingHotelCode: googleHotel.hotelCode,
            name: googleHotel.hotelCode,
            id: googleHotel.id,
            hotelCode: googleHotel.hotelCode
          }
        ] as any;
      }

      // Build SiteMinder response
      if (!flexiHotels || flexiHotels.length === 0) {
        return [
          {
            ...siteminderObj
          },
          {
            ...googleObj
          }
        ];
      }

      const flexiHotelIds = flexiHotels.map((x) => x.id);

      const [salesPlanList, roomProductList] = await Promise.all([
        this.flexiRatePlanRepository.find({
          where: {
            flexiHotelId: In(flexiHotelIds)
          },
          select: {
            salesPlanId: true,
            code: true,
            flexiHotelId: true,
            extraServiceIncluded: true
          }
        }),
        this.flexiRoomTypeRepository.find({
          where: {
            flexiHotelId: In(flexiHotelIds)
          },
          select: {
            roomProductId: true,
            code: true,
            flexiHotelId: true
          }
        })
      ]);

      const hotelRoomMap = new Map<string, FlexiRoomType[]>();

      roomProductList.forEach((x) => {
        if (!hotelRoomMap.has(x.flexiHotelId)) {
          hotelRoomMap.set(x.flexiHotelId, []);
        }
        hotelRoomMap.get(x.flexiHotelId)!.push(x);
      });

      const hotelRatePlanMap = new Map<string, FlexiRatePlan[]>();
      salesPlanList.forEach((x) => {
        if (!hotelRatePlanMap.has(x.flexiHotelId)) {
          hotelRatePlanMap.set(x.flexiHotelId, []);
        }
        hotelRatePlanMap.get(x.flexiHotelId)!.push(x);
      });

      const metadata = flexiHotels.map((hotel) => ({
        roomProductList: hotelRoomMap.get(hotel.id) ?? [],
        salesPlanList: hotelRatePlanMap.get(hotel.id) ?? [],
        mappingHotelCode: hotel.code,
        name: hotel.name,
        id: hotel.id,
        hotelCode: hotel.code
      }));

      return [
        {
          ...siteminderObj,
          isConnected: true,
          metadata
        },
        {
          ...googleObj
        }
      ];
    } catch (error) {
      throw new BusinessLogicException(error);
    }
  }

  private validateAndGetMapping<
    T extends
      | FlexiChannelMapping
      | FlexiChannelMappingUpdate
      | UpdateFlexiRoomMapping
      | UpdateFlexiRatePlanMapping
  >(hotelId: string, mappings: T[]): T {
    if (!hotelId) {
      throw new ValidationException('Hotel id is required');
    }

    if (!Array.isArray(mappings) || mappings.length === 0) {
      throw new ValidationException('Mappings array is required and cannot be empty');
    }

    // Note: Only the first mapping is used. If multiple mappings are needed, this should be refactored.
    return mappings[0];
  }

  async createFlexiChannelList(body: CreateFlexiChannel) {
    const { hotelId, mappings } = body;

    const mapping = this.validateAndGetMapping(hotelId, mappings);
    const { mappingHotelCode, name } = mapping;

    if (!mappingHotelCode || mappingHotelCode.trim().length === 0) {
      throw new ValidationException('Mapping hotel code is required');
    }

    const entity = this.flexiHotelRepository.create({
      hotelId,
      name: name?.trim() ?? '',
      code: mappingHotelCode.trim()
    });

    try {
      return await this.flexiHotelRepository.save(entity);
    } catch (error) {
      throw new BusinessLogicException(
        error instanceof Error ? error.message : 'Failed to create flexi channel'
      );
    }
  }

  async updateFlexiChannelList(body: UpdateFlexiChannel) {
    const { hotelId, mappings } = body;

    const mapping = this.validateAndGetMapping(hotelId, mappings);
    const { id, mappingHotelCode, name } = mapping;

    if (!id) {
      throw new ValidationException('Flexi hotel id is required');
    }

    if (!mappingHotelCode || mappingHotelCode.trim().length === 0) {
      throw new ValidationException('Mapping hotel code is required');
    }

    const entity = await this.flexiHotelRepository.findOne({
      where: { id, hotelId }
    });

    if (!entity) {
      throw new ValidationException('Flexi hotel not found');
    }

    // Whitelist fields for update
    entity.name = name?.trim() ?? '';
    entity.code = mappingHotelCode.trim();

    try {
      return await this.flexiHotelRepository.save(entity);
    } catch (error) {
      throw new BusinessLogicException(
        error instanceof Error ? error.message : 'Failed to update flexi channel'
      );
    }
  }

  async deleteFlexiChannelList(id: string) {
    if (!id) {
      throw new ValidationException('Flexi channel id is required');
    }

    const entity = await this.flexiHotelRepository.findOne({
      where: { id }
    });

    if (!entity) {
      throw new ValidationException('Flexi channel not found');
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Remove related mappings first (cascade delete would be better, but this ensures consistency)
      await queryRunner.manager.delete(FlexiRoomType, { flexiHotelId: id });
      await queryRunner.manager.delete(FlexiRatePlan, { flexiHotelId: id });
      // Then remove the hotel entity
      await queryRunner.manager.remove(FlexiHotel, entity);

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BusinessLogicException(
        error instanceof Error ? error.message : 'Failed to delete flexi channel'
      );
    } finally {
      await queryRunner.release();
    }
  }

  async updateFlexiRoomMappings(body: UpdateFlexiRoomMappings) {
    const { hotelId, mappings } = body;

    const mapping = this.validateAndGetMapping(hotelId, mappings);
    const { id } = mapping;

    if (!id) {
      throw new ValidationException('Flexi hotel id is required');
    }

    const entity = await this.flexiHotelRepository.findOne({
      where: { id, hotelId }
    });

    if (!entity) {
      throw new ValidationException('Flexi hotel not found');
    }

    const cleanMappings = (mapping?.roomProductList || [])
      .filter(
        (x: { id: string; mappingCode: string }) =>
          x.id && x.mappingCode && x.id.trim().length > 0 && x.mappingCode.trim().length > 0
      )
      .map((x: { id: string; mappingCode: string }) => ({
        id: x.id.trim(),
        mappingCode: x.mappingCode.trim()
      }));

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get old mappings for response
      const oldMappings = await queryRunner.manager.find(FlexiRoomType, {
        where: {
          flexiHotelId: id
        }
      });

      // Delete old mappings
      if (oldMappings.length > 0) {
        await queryRunner.manager.remove(FlexiRoomType, oldMappings);
      }

      // Create new mappings if any
      let created: FlexiRoomType[] = [];
      if (cleanMappings.length > 0) {
        const newMappings = cleanMappings.map((x) => {
          const entity = new FlexiRoomType();
          entity.flexiHotelId = id;
          entity.roomProductId = x.id;
          entity.code = x.mappingCode;
          return entity;
        });
        created = await queryRunner.manager.save(FlexiRoomType, newMappings);
      }

      await queryRunner.commitTransaction();

      return {
        removed: oldMappings,
        created
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BusinessLogicException(
        error instanceof Error ? error.message : 'Failed to update flexi room mappings'
      );
    } finally {
      await queryRunner.release();
    }
  }

  async updateFlexiRatePlanMappings(body: UpdateFlexiRatePlanMappings) {
    const { hotelId, mappings } = body;

    const mapping = this.validateAndGetMapping(hotelId, mappings);
    const { id } = mapping;

    if (!id) {
      throw new ValidationException('Flexi hotel id is required');
    }

    const entity = await this.flexiHotelRepository.findOne({
      where: { id, hotelId }
    });

    if (!entity) {
      throw new ValidationException('Flexi hotel not found');
    }

    const cleanMappings = (mapping?.salesPlanList || [])
      .filter(
        (x: { id: string; mappingCode: string; extraServiceIncluded: boolean }) =>
          x.id && x.mappingCode && x.id.trim().length > 0 && x.mappingCode.trim().length > 0
      )
      .map((x: { id: string; mappingCode: string; extraServiceIncluded: boolean }) => ({
        id: x.id.trim(),
        mappingCode: x.mappingCode.trim(),
        extraServiceIncluded: Boolean(x.extraServiceIncluded)
      }));

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get old mappings for response
      const oldMappings = await queryRunner.manager.find(FlexiRatePlan, {
        where: {
          flexiHotelId: id
        }
      });

      // Delete old mappings
      if (oldMappings.length > 0) {
        await queryRunner.manager.remove(FlexiRatePlan, oldMappings);
      }

      // Create new mappings if any
      let created: FlexiRatePlan[] = [];
      if (cleanMappings.length > 0) {
        const newMappings = cleanMappings.map((x) => {
          const entity = new FlexiRatePlan();
          entity.flexiHotelId = id;
          entity.salesPlanId = x.id;
          entity.code = x.mappingCode;
          // Convert boolean to number (0 or 1) to match entity type definition
          entity.extraServiceIncluded = x.extraServiceIncluded ?? false;
          return entity;
        });
        created = await queryRunner.manager.save(FlexiRatePlan, newMappings);
      }

      await queryRunner.commitTransaction();

      return {
        removed: oldMappings,
        created
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BusinessLogicException(
        error instanceof Error ? error.message : 'Failed to update flexi rate plan mappings'
      );
    } finally {
      await queryRunner.release();
    }
  }
}
