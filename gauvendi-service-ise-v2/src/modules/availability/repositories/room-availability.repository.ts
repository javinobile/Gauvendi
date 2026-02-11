// import { BadRequestException, Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { InjectRepository } from '@nestjs/typeorm';
// import { DB_NAME } from 'src/core/constants/db.const';
// import { RoomAvailabilityStatusEnum } from 'src/core/enums/room-availability';
// import { BaseService } from 'src/core/services/base.service';
// import { In, Raw, Repository } from 'typeorm';
// import { RoomAvailabilityDto } from '../dtos/room-availability.dto';
// import { RoomProductDailyAvailability } from 'src/core/entities/room-product-daily-availability.entity';
// import { RoomProductDailyAvailabilityStatusEnum } from 'src/core/enums/room-product-daily-availability';

// @Injectable()
// export class RoomAvailabilityRepository extends BaseService {
//   private readonly logger = new Logger(RoomAvailabilityRepository.name);

//   constructor(
//     @InjectRepository(RoomProductDailyAvailability, DB_NAME.POSTGRES)
//     private roomAvailabilityRepository: Repository<RoomProductDailyAvailability>,
//     configService: ConfigService
//   ) {
//     super(configService);
//   }

//   async getRoomAvailability(body: RoomAvailabilityDto): Promise<RoomProductDailyAvailability[]> {
//     try {
//       const roomAvailability = await this.roomAvailabilityRepository.find({
//         where: {
//           roomProductId: In(body.roomIds),
//           hotelId: body.hotelId,
//           date: Raw((alias) => `${alias} BETWEEN :from AND :to`, {
//             from: body.from,
//             to: body.to
//           })
//         }
//       });

//       return roomAvailability;
//     } catch (error) {
//       this.logger.error('Error getting room availability', error);
//       throw new BadRequestException('Error getting room availability');
//     }
//   }

//   async assignRoomAvailability(body: RoomProductDailyAvailability[]): Promise<void> {
//     try {
//       const ids = body.map((item) => item.id);
//       this.logger.log('Updating room availability', ids);
//       await this.roomAvailabilityRepository.update(ids, {
//         status: RoomProductDailyAvailabilityStatusEnum.ASSIGNED,
//         updatedBy: this.currentSystem,
//         updatedDate: new Date()
//       });
//     } catch (error) {
//       this.logger.error('Error updating room availability', error);
//       throw new BadRequestException('Error updating room availability');
//     }
//   }

//   async unassignRoomAvailability(body: RoomAvailability[]): Promise<void> {
//     try {
//       const ids = body.map((item) => item.id);
//       await this.roomAvailabilityRepository.update(ids, {
//         status: RoomAvailabilityStatusEnum.AVAILABLE,
//         updatedBy: this.currentSystem,
//         updatedDate: new Date()
//       });
//     } catch (error) {
//       this.logger.error('Error unassigning room availability', error);
//       throw new BadRequestException('Error unassigning room availability');
//     }
//   }
// }
