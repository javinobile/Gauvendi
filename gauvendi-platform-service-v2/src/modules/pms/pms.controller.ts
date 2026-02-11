import { Body, Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { ReservationsCreatePmsDto } from './dtos/pms.dto';
import {
  AuthorizeConnectorDto,
  CreateMappingHotelDto,
  DeauthorizeConnectorDto,
  GetPmsHotelListDto
} from './pms.dto';
import { PmsService } from './pms.service';

@Controller('pms')
export class PmsController {
  constructor(private readonly pmsService: PmsService) {}

  @MessagePattern({ cmd: CMD.PMS.APALEO.REGISTER_WEBHOOK })
  async registerApaleoWebhook(@Body() payload: { hotelId: string; webhookUrl: string }) {
    return this.pmsService.registerApaleoWebhook(payload.hotelId, payload.webhookUrl);
  }

  @MessagePattern({ cmd: CMD.PMS.CONNECTOR.GET_LIST })
  async getPmsConnectorList(@Body() payload: { hotelId: string }) {
    return this.pmsService.getPmsConnectorList(payload);
  }

  @MessagePattern({ cmd: CMD.PMS.CONNECTOR.AUTHORIZE_CONNECTOR })
  async authorizeConnector(@Body() payload: AuthorizeConnectorDto) {
    return this.pmsService.authorizeConnector(payload);
  }

  @MessagePattern({ cmd: CMD.PMS.CONNECTOR.GET_PMS_HOTEL_LIST })
  async getPmsHotelList(@Body() payload: GetPmsHotelListDto) {
    return this.pmsService.getPmsHotelList(payload);
  }

  @MessagePattern({ cmd: CMD.PMS.CONNECTOR.CREATE_MAPPING_HOTEL })
  async createMappingHotel(@Body() payload: CreateMappingHotelDto) {
    return this.pmsService.createMappingPmsHotel(payload);
  }

  @MessagePattern({ cmd: CMD.PMS.CONNECTOR.DEAUTHORIZE_CONNECTOR })
  async deauthorizeConnector(@Body() payload: DeauthorizeConnectorDto) {
    return this.pmsService.deauthorizeConnector(payload);
  }

  @MessagePattern({ cmd: CMD.PMS.PUSH_RESERVATIONS_TO_PMS })
  async pushReservationToPms(@Body() payload: ReservationsCreatePmsDto) {
    return this.pmsService.pushReservationToPms(payload);
  }
}
