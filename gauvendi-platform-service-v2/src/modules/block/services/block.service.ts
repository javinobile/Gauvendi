import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { IsNull, Repository } from 'typeorm';
import { BlockSharedService } from './block-shared.service';
import { PmsService } from '@src/modules/pms/pms.service';
import { ConnectorTypeEnum } from '@src/core/enums/common';
import { ApaleoService } from '@src/modules/pms/apaleo/apaleo.service';
import { Connector } from '@src/core/entities/hotel-entities/connector.entity';
import { DATE_TIME_ISO8601 } from '@src/core/constants/date.constant';
import { addYears, format } from 'date-fns';
import { chunk } from 'lodash';

@Injectable()
export class BlockService {
  private readonly logger = new Logger(BlockService.name);
  constructor(
    private readonly blockSharedService: BlockSharedService,
    private readonly pmsService: PmsService,
    private readonly apaleoService: ApaleoService,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>
  ) {}

  async jobPullBlockPms() {
    try {
      const hotels = await this.hotelRepository.find({
        where: {
          deletedAt: IsNull()
        },
        select: ['id']
      });

      let connectors = await this.pmsService.getPmsConnectors(
        hotels.map((hotel) => hotel.id),
        ['mappingPmsHotel']
      );

      for (const connector of connectors) {
        switch (connector.connectorType) {
          case ConnectorTypeEnum.APALEO: {
            await this.handleApaleoBlocks(connector);
            break;
          }
          default:
            break;
        }
      }
    } catch (error) {
      this.logger.error(error.message);
      return false;
    }
  }

  private async handleApaleoBlocks(connector: Connector) {
    const mappingHotelCode = connector.mappingPmsHotel?.[0]?.mappingHotelCode;
    const hotelId = connector.hotelId;
    const accessToken = await this.apaleoService.getAccessToken(
      connector.refreshToken,
      mappingHotelCode
    );
    if (!accessToken) {
      this.logger.warn(`No access token found for connector ${connector.id}`);
      return false;
    }

    // get blocks from current date to 1 year later
    //A date and time (without fractional second part) in UTC or with UTC offset as defined in ISO8601:2004
    const startDate = format(new Date(), DATE_TIME_ISO8601);
    const endDate = format(addYears(new Date(), 1), DATE_TIME_ISO8601);
    const queryParams = new URLSearchParams();
    queryParams.append('propertyIds', mappingHotelCode);
    queryParams.append('expand', 'timeSlices');
    queryParams.append('from', startDate);
    queryParams.append('to', endDate);
    const blocks = await this.apaleoService.getApaleoBlocks(accessToken, queryParams);
    if (blocks?.length) {
      const chunkedBlocks = chunk(blocks, 50);
      for (const chunk of chunkedBlocks) {
        await Promise.all(
          chunk.map((block) => this.blockSharedService.handleBlockFromApaleoBlock(block, hotelId))
        );
      }
    }
    return true;
  }
}
