import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { Response } from "express";
import { map } from "rxjs";
import { CancelReservationDto } from "./dtos/cancel-reservation.dto";
import { SendCancellationReservationEmailDto } from "./dtos/send-cancellation-reservation-email.dto";
import {
  PushPmsReservationInput,
  RatePlanDetailsFilterDto,
  ReservationBookingFlowFilterDto,
  ReservationChannelFilterDto,
  ReservationManagementFilterDto,
  ReservationPmsFilterDto,
  ReservationSourceFilterDto,
  UpdateReservationGuestListInput,
  UpdateReservationLockUnitInput,
} from "./reservation.dto";

@Injectable()
export class ReservationService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  getReservationManagementList(query: ReservationManagementFilterDto) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.MANAGEMENT_LIST }, query).pipe(
      map((result) => {
        return { ...result, isCustomResponse: true };
      })
    );
  }

  getReservationSourceList(query: ReservationSourceFilterDto) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.SOURCE_LIST }, query);
  }

  getReservationBookingFlowList(query: ReservationBookingFlowFilterDto) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.BOOKING_FLOW_LIST }, query);
  }

  getReservationChannelList(query: ReservationChannelFilterDto) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.CHANNEL_LIST }, query);
  }

  getReservationStatusList() {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.STATUS_LIST }, {});
  }

  getReservationList(query: ReservationManagementFilterDto, response: Response) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.LIST }, query).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  getReservationOverview(query: ReservationManagementFilterDto, response: Response) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.OVERVIEW }, query).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  getReservationDetails(query: ReservationManagementFilterDto, response: Response) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.DETAILS }, query).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  getReservationGuestList(query: ReservationManagementFilterDto, response: Response) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.GUEST_LIST }, query).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  updateReservationGuestList(body: UpdateReservationGuestListInput) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.UPDATE_GUEST_LIST }, body);
  }

  getReservationCompany(query: ReservationManagementFilterDto, response: Response) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.COMPANY }, query).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  getReservationPricingDetails(query: ReservationManagementFilterDto, response: Response) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.PRICING_DETAILS }, query).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  getReservationEmailHistory(query: ReservationManagementFilterDto, response: Response) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.EMAIL_HISTORY }, query).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  syncPmsReservations(query: ReservationPmsFilterDto, response: Response) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.SYNC_PMS_RESERVATIONS }, query).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  cancelReservation(body: CancelReservationDto) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.CANCEL_RESERVATION }, body);
  }

  sendCancellationEmail(body: SendCancellationReservationEmailDto) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.SEND_CANCELLATION_RESERVATION_EMAIL }, body);
  }

  getRatePlanDetails(query: RatePlanDetailsFilterDto) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.RATE_PLAN_DETAILS }, query);
  }

  updateReservationLockUnit(body: UpdateReservationLockUnitInput) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.UPDATE_RESERVATION_LOCK_UNIT }, body);
  }

  pushPmsReservation(body: PushPmsReservationInput) {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.PUSH_PMS_RESERVATION }, body);
  }

  migrateReservationAmenityExtraType() {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.MIGRATE_RESERVATION_AMENITY_EXTRA_TYPE }, {});
  }

  migrateReservationStatus() {
    return this.clientProxy.send({ cmd: CMD.RESERVATION.MIGRATE_RESERVATION_STATUS }, {});
  }
}
