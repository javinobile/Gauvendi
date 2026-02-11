import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { GOOGLE_INTERFACE_SERVICE } from '@src/core/client/google-interface-client.module';
import { DbName } from '@src/core/constants/db-name.constant';
import { GoogleHotelEntity } from '@src/core/entities/google-entities/google-hotel.entity';
import { BusinessLogicException, ValidationException } from '@src/core/exceptions';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class GoogleHotelService {
  constructor(
    @Inject(GOOGLE_INTERFACE_SERVICE) private readonly googleService: ClientProxy,

    @InjectRepository(GoogleHotelEntity, DbName.Postgres)
    private readonly googleHotelRepository: Repository<GoogleHotelEntity>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource
  ) {}

  async googleHotelOnboarding(hotelId: string) {
    return this.googleService.send({ cmd: 'google.property.onboard' }, { hotelId });
  }

  async googleHotelActivate(hotelId: string) {
    return this.googleService.send({ cmd: 'google.property.activate' }, { hotelId });
  }

  async googleHotelInitialize(hotelId: string) {
    return this.googleService.send({ cmd: 'google.property.initialize' }, { hotelId });
  }

  async googleHotelDelete(hotelId: string) {
    if (!hotelId) {
      throw new ValidationException('Google hotel id is required');
    }

    const entity = await this.googleHotelRepository.findOne({
      where: { hotelId }
    });

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Then remove the hotel entity
      await queryRunner.manager.remove(GoogleHotelEntity, entity);

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
}
