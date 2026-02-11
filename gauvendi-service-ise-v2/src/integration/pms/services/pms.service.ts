import { Injectable, Logger } from '@nestjs/common';
import { ConnectorTypeEnum } from 'src/core/enums/connector';
import { ReservationsCreatePmsInput } from '../dtos/pms.dto';
import { ApaleoPmsService } from './apaleo-pms.service';
import { MewsPmsService } from './mews-pms.service';

@Injectable()
export class PmsService {
  private readonly logger = new Logger(PmsService.name);
  constructor(
    private readonly mewsPmsService: MewsPmsService,
    private readonly apaleoPmsService: ApaleoPmsService
  ) {}

  async pushReservationToPms(input: ReservationsCreatePmsInput) {
    const { connector } = input;
    const connectorType = connector?.connectorType;
    if (!connectorType) {
      this.logger.warn('Connector not found');
      return;
    }

    switch (connectorType) {
      case ConnectorTypeEnum.MEWS:
        return this.mewsPmsService.createReservationForMews(input);
      case ConnectorTypeEnum.APALEO:
        if (input.booking.mappingBookingCode) {
          return this.apaleoPmsService.updateReservationForApaleo(input);
        }
        return this.apaleoPmsService.createReservationForApaleo(input);
      default:
        this.logger.error(`Connector type ${connectorType} not supported`);
        return;
    }
  }
}
