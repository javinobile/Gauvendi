import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PLATFORM_SERVICE } from '../../core/clients/platform-client.module';
import { CMD } from '../../core/constants/cmd.const';
import {
  CreateOrUpdatePropertyTrackingDto,
  DeletePropertyTrackingDto,
  PropertyTrackingFilterDto,
} from './dtos/property-tracking.dto';

@Injectable()
export class PropertyTrackingService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy,
  ) {}

  getPropertyTrackingList(filter: PropertyTrackingFilterDto) {
    return this.platformClient.send(
      { cmd: CMD.PROPERTY_TRACKING.GET_LIST },
      filter,
    );
  }

  createOrUpdatePropertyTracking(dto: CreateOrUpdatePropertyTrackingDto) {
    return this.platformClient.send(
      { cmd: CMD.PROPERTY_TRACKING.CREATE_OR_UPDATE },
      dto,
    );
  }

  deletePropertyTracking(dto: DeletePropertyTrackingDto) {
    return this.platformClient.send(
      { cmd: CMD.PROPERTY_TRACKING.DELETE },
      dto,
    );
  }

  getMetaConversionConfig(propertyCode: string) {
    return this.platformClient.send(
      { cmd: CMD.PROPERTY_TRACKING.GET_META_CONVERSION_CONFIG },
      { propertyCode },
    );
  }
}
