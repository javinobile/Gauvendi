import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { ApaleoWebhookService } from './apaleo-webhook.service';
import { ApaleoWebhookPayloadDto } from './apaleo-webhook.dto';

@Controller()
export class ApaleoWebhookController {
  constructor(private readonly apaleoWebhookService: ApaleoWebhookService) {}

  // @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_SERVICE_CHANGED })
  // async handleApaleoServiceChanged(@Payload() body: ApaleoWebhookPayloadDto) {
  //   return this.apaleoWebhookService.handleApaleoServiceChanged(body);
  // }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_RESERVATION_CREATED })
  async handleApaleoReservationCreated(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoReservationCreated(body, 'created');
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_RESERVATION_CHANGED })
  async handleApaleoReservationUpdated(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoReservationCreated(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_RESERVATION_CANCELED })
  async handleApaleoReservationCanceled(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoReservationCreated(body);
  }

  //TODO: Handle reservation deleted
  // @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_RESERVATION_DELETED })
  // async handleApaleoReservationDeleted(@Payload() body: ApaleoWebhookPayloadDto) {
  //   return this.apaleoWebhookService.handleApaleoReservationCreated(body);
  // }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_RESERVATION_UNIT_ASSIGNED })
  async handleApaleoReservationUnitAssigned(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoReservationCreated(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_RESERVATION_UNIT_UNASSIGNED })
  async handleApaleoReservationUnitUnassigned(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoReservationCreated(body);
  }

  // @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_RESERVATION_SET_TO_NO_SHOW })
  // async handleApaleoReservationSetToNoShow(@Payload() body: ApaleoWebhookPayloadDto) {
  //   return this.apaleoWebhookService.handleApaleoReservationCreated(body);
  // }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_RESERVATION_AMENDED })
  async handleApaleoReservationAmended(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoReservationCreated(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_BLOCK_CREATED })
  async handleApaleoBlockCreated(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoBlockEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_BLOCK_CHANGED })
  async handleApaleoBlockChanged(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoBlockEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_BLOCK_DELETED })
  async handleApaleoBlockDeleted(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoBlockEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_BLOCK_CONFIRMED })
  async handleApaleoBlockConfirmed(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoBlockEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_BLOCK_CANCELED })
  async handleApaleoBlockCanceled(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoBlockEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_MAINTENANCE_CREATED })
  async handleApaleoMaintenanceCreated(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoMaintenanceEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_MAINTENANCE_CHANGED })
  async handleApaleoMaintenanceChanged(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoMaintenanceEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_MAINTENANCE_DELETED })
  async handleApaleoMaintenanceDeleted(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoMaintenanceEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_FOLIO_PAYMENT_POSTED })
  async handleApaleoFolioPaymentPosted(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoFolioEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_FOLIO_PAYMENT_FAILED })
  async handleApaleoFolioPaymentFailed(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoFolioEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_FOLIO_PAYMENT_CANCELED })
  async handleApaleoFolioPaymentCanceled(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoFolioEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_FOLIO_REFUND_POSTED })
  async handleApaleoFolioRefundPosted(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoFolioEvents(body);
  }

  @MessagePattern({ cmd: CMD.PMS.APALEO.HANDLE_FOLIO_REFUND_FAILED })
  async handleApaleoFolioRefundFailed(@Payload() body: ApaleoWebhookPayloadDto) {
    return this.apaleoWebhookService.handleApaleoFolioEvents(body);
  }
}
