import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomUnit } from 'src/core/entities/room-unit.entity';
import { In, Repository } from 'typeorm';
import { RoomDto } from '../dtos/room.dto';

@Injectable()
export class RoomRepository {
  private readonly logger = new Logger(RoomRepository.name);

  constructor(
    @InjectRepository(RoomUnit, DB_NAME.POSTGRES)
    private roomRepository: Repository<RoomUnit>
  ) {}

  async getRooms(body: RoomDto): Promise<RoomUnit[]> {
    try {
      const rooms = await this.roomRepository.find({
        where: {
          ...(body.rfcIds ? { id: In(body.rfcIds) } : {})
        }
      });
      return rooms;
    } catch (error) {
      this.logger.error('Error getting rooms', error);
      throw new BadRequestException('Error getting rooms');
    }
  }

  async getRoom(body: RoomDto): Promise<RoomUnit | null> {
    try {
      const room = await this.roomRepository.findOne({
        where: {
          ...(body.id ? { id: body.id } : {}),
          ...(body.hotelId ? { hotelId: body.hotelId } : {})
        }
      });
      return room;
    } catch (error) {
      this.logger.error('Error getting room', error);
      throw new BadRequestException('Error getting room');
    }
  }
}
