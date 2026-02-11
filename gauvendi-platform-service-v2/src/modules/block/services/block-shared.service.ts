import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  BlockDaily,
  BlockStatus
} from '@src/core/entities/availability-entities/block-daily.entity';
import { DbName } from '@src/core/constants/db-name.constant';
import { GroupBooking } from '@src/core/entities/availability-entities/group-booking.entity';
import { ApaleoBlockDto } from '@src/modules/pms/apaleo/apaleo.dto';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '@src/core/services/base.service';
import { ConfigService } from '@nestjs/config';
import { ResponseStatusEnum } from '@src/core/enums/common';
import { chunk } from 'lodash';
import { RoomProductAvailabilityService } from '@src/modules/room-product-availability/room-product-availability.service';

@Injectable()
export class BlockSharedService extends BaseService {
  private readonly logger = new Logger(BlockSharedService.name);

  constructor(
    @InjectRepository(BlockDaily, DbName.Postgres)
    private blockDailyRepository: Repository<BlockDaily>,

    @InjectRepository(GroupBooking, DbName.Postgres)
    private groupBookingRepository: Repository<GroupBooking>,

    @InjectRepository(RoomProductMappingPms, DbName.Postgres)
    private roomProductMappingPmsRepository: Repository<RoomProductMappingPms>,

    @Inject(forwardRef(() => RoomProductAvailabilityService))
    private roomProductAvailabilityService: RoomProductAvailabilityService,

    configService: ConfigService
  ) {
    super(configService);
  }

  async handleBlockFromApaleoBlock(block: ApaleoBlockDto, hotelId: string) {
    try {
      // create group booking or get existing group booking
      let [groupBooking, roomProductMappingPms] = await Promise.all([
        this.groupBookingRepository.findOne({
          where: {
            hotelId: hotelId,
            mappingPmsCode: block.group.id
          },
          select: {
            id: true
          }
        }),
        this.roomProductMappingPmsRepository.findOne({
          where: {
            hotelId: hotelId,
            roomProductMappingPmsCode: block.unitGroup.id
          },
          select: {
            roomProductId: true
          }
        })
      ]);
      if (!roomProductMappingPms?.roomProductId) {
        this.logger.warn('Room product mapping pms not found');
        return false;
      }

      if (!groupBooking) {
        const newGroupBooking: Partial<GroupBooking> = {
          hotelId: hotelId,
          mappingPmsCode: block.group.id,
          name: block.group.name
        };
        groupBooking = await this.groupBookingRepository.save(newGroupBooking);
      }

      const newBlocks: Partial<BlockDaily>[] = [];
      const commonFields: Partial<BlockDaily> = {
        hotelId: hotelId,
        roomProductId: roomProductMappingPms.roomProductId,
        groupBookingId: groupBooking.id,
        mappingPmsCode: block.id,
        status: block.status as BlockStatus,
        createdBy: this.currentSystem,
        updatedBy: this.currentSystem
      };

      const getBlockValues = (pickedUnits: number, blockedUnits: number) => {
        return {
          [BlockStatus.TENTATIVE]: {
            definitelyBlock: 0,
            tentativelyBlock: blockedUnits,
            pickedUnits: pickedUnits
          },
          [BlockStatus.DEFINITE]: {
            definitelyBlock: blockedUnits,
            tentativelyBlock: 0,
            pickedUnits: pickedUnits
          },
          [BlockStatus.CANCELED]: {
            definitelyBlock: blockedUnits,
            tentativelyBlock: 0,
            pickedUnits: 0
          }
        };
      };
      for (const timeSlice of block.timeSlices) {
        const blockValues = getBlockValues(timeSlice.pickedUnits, timeSlice.blockedUnits);
        const blockValue = blockValues[block.status as BlockStatus];
        const newBlock: Partial<BlockDaily> = {
          ...commonFields,
          date: timeSlice.from.split('T')[0], // Extract date from ISO string (already in hotel timezone)
          definitelyBlock: blockValue.definitelyBlock,
          tentativelyBlock: blockValue.tentativelyBlock,
          pickedUnits: blockValue.pickedUnits
        };
        newBlocks.push(newBlock);
      }

      const dates = newBlocks.map((block) => block.date!).filter((date) => !!date);

      const existingBlocks = await this.blockDailyRepository.find({
        where: {
          hotelId: hotelId,
          roomProductId: roomProductMappingPms.roomProductId,
          groupBookingId: groupBooking.id,
          mappingPmsCode: block.id
          // date: In(dates)
        }
      });
      const existingBlocksMap = new Map<string, BlockDaily>(
        existingBlocks.map((block) => [block.date, block])
      );

      const blockId = uuidv4();
      for (const [index, newBlock] of newBlocks.entries()) {
        const existingBlock = existingBlocksMap.get(newBlock.date!);
        if (!existingBlock) {
          newBlocks[index].id = uuidv4();
          newBlocks[index].blockId = blockId;
          continue;
        }

        existingBlocksMap.delete(newBlock.date!);
        newBlocks[index] = {
          ...existingBlock,
          ...newBlock
        };
      }

      const deletedBlocks = Array.from(existingBlocksMap.values());
      const deletedBlockIds = deletedBlocks.map((block) => block.id);
      await Promise.all([
        deletedBlockIds.length
          ? this.blockDailyRepository.delete(deletedBlockIds)
          : Promise.resolve(),
        newBlocks.length
          ? this.blockDailyRepository.upsert(newBlocks, {
              conflictPaths: ['id'],
              skipUpdateIfNoValuesChanged: true
            })
          : Promise.resolve()
      ]);
      const roomProductIds = [roomProductMappingPms.roomProductId];
      await this.roomProductAvailabilityService.processUpdateRoomProductAvailability(
        hotelId,
        roomProductIds,
        dates
      );
      return true;
    } catch (error) {
      this.logger.error(error.message);
      return false;
    }
  }

  async deleteBlockFromApaleoBlock(mappingPmsCode: string, hotelId: string) {
    try {
      const blockDailyData = await this.blockDailyRepository.find({
        where: {
          hotelId: hotelId,
          mappingPmsCode: mappingPmsCode
        },
        select: {
          date: true,
          roomProductId: true
        }
      });
      if (!blockDailyData?.length) {
        this.logger.warn('Block daily data not found');
        return false;
      }

      await this.blockDailyRepository.delete({
        hotelId: hotelId,
        mappingPmsCode: mappingPmsCode
      });

      await this.roomProductAvailabilityService.processUpdateRoomProductAvailability(
        hotelId,
        [blockDailyData[0].roomProductId],
        blockDailyData.map((block) => block.date!)
      );
      return true;
    } catch (error) {
      this.logger.error(error.message);
      return false;
    }
  }
}
