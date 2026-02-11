import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  Connector,
  ConnectorStatusEnum,
  ConnectorTypeEnum
} from 'src/core/entities/hotel-entities/connector.entity';
import { BadRequestException } from 'src/core/exceptions';
import { Repository } from 'typeorm';
import { ConnectorDto } from '../dtos/connector.dto';

@Injectable()
export class ConnectorRepository {
  private readonly logger = new Logger(ConnectorRepository.name);
  constructor(
    @InjectRepository(Connector, DB_NAME.POSTGRES)
    private readonly connectorRepository: Repository<Connector>
  ) {}

  async getConnector(body: ConnectorDto): Promise<Connector | null> {
    try {
      const connector = await this.connectorRepository.findOne({
        where: {
          hotelId: body.hotelId,
          status: ConnectorStatusEnum.ACTIVE,
          ...(body.connectorType && { connectorType: body.connectorType as ConnectorTypeEnum })
        },
        relations: body.relations
      });

      return connector ?? null;
    } catch (error) {
      this.logger.error(`Error getting connector: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
