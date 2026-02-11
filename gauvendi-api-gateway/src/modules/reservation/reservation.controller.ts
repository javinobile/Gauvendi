import { Body, Controller, Get, HttpStatus, Post, Query, Res } from "@nestjs/common";
import { Public } from "@src/core/decorators/is-public.decorator";
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
import { ReservationService } from "./reservation.service";

@Controller("reservation")
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get("management-list")
  getReservationManagementList(@Query() query: ReservationManagementFilterDto) {
    return this.reservationService.getReservationManagementList(query);
  }

  @Get("source-list")
  getReservationSourceList(@Query() query: ReservationSourceFilterDto) {
    return this.reservationService.getReservationSourceList(query);
  }

  @Get("booking-flow-list")
  getReservationBookingFlowList(@Query() query: ReservationBookingFlowFilterDto) {
    return this.reservationService.getReservationBookingFlowList(query);
  }

  @Get("channel-list")
  getReservationChannelList(@Query() query: ReservationChannelFilterDto) {
    return this.reservationService.getReservationChannelList(query);
  }

  @Get("status-list")
  getReservationStatusList() {
    return this.reservationService.getReservationStatusList();
  }

  @Get("list")
  getReservationList(@Query() query: ReservationManagementFilterDto, @Res() res: Response) {
    return this.reservationService.getReservationList(query, res);
  }

  @Get("overview")
  getReservationOverview(@Query() query: ReservationManagementFilterDto, @Res() res: Response) {
    return this.reservationService.getReservationOverview(query, res);
  }

  @Get("details")
  getReservationDetails(@Query() query: ReservationManagementFilterDto, @Res() res: Response) {
    return this.reservationService.getReservationDetails(query, res);
  }

  @Get("guest-list")
  getReservationGuestList(@Query() query: ReservationManagementFilterDto, @Res() res: Response) {
    return this.reservationService.getReservationGuestList(query, res);
  }

  @Post("guest-list")
  createReservationGuestList(@Body() body: UpdateReservationGuestListInput) {
    return this.reservationService.updateReservationGuestList(body);
  }

  @Get("company")
  getReservationCompany(@Query() query: ReservationManagementFilterDto, @Res() res: Response) {
    return this.reservationService.getReservationCompany(query, res);
  }

  @Get("pricing-details")
  getReservationPricingDetails(@Query() query: ReservationManagementFilterDto, @Res() res: Response) {
    return this.reservationService.getReservationPricingDetails(query, res);
  }

  @Get("email-history")
  getReservationEmailHistory(@Query() query: ReservationManagementFilterDto, @Res() res: Response) {
    return this.reservationService.getReservationEmailHistory(query, res);
  }

  @Post("sync-pms-reservations")
  syncPmsReservations(@Body() query: ReservationPmsFilterDto, @Res() res: Response) {
    return this.reservationService.syncPmsReservations(query, res);
  }

  @Post("cancel")
  async cancelReservation(@Body() body: CancelReservationDto) {
    return this.reservationService.cancelReservation(body);
  }

  @Post("send-cancellation-email")
  async sendCancellationEmail(@Body() body: SendCancellationReservationEmailDto) {
    return this.reservationService.sendCancellationEmail(body);
  }

  @Get("rate-plan-details")
  async getRatePlanDetails(@Query() query: RatePlanDetailsFilterDto) {
    return this.reservationService.getRatePlanDetails(query);
  }

  @Post("update-reservation-lock-unit")
  async updateReservationLockUnit(@Body() body: UpdateReservationLockUnitInput, @Res() res: Response) {
    return this.reservationService.updateReservationLockUnit(body).pipe(
      map((result) => {
        return res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("push-pms-reservation")
  async pushPmsReservation(@Body() body: PushPmsReservationInput, @Res() res: Response) {
    return this.reservationService.pushPmsReservation(body).pipe(
      map((result) => {
        return res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Public()
  @Get("migrate-reservation-amenity-extra-type")
  async migrateReservationAmenityExtraType() {
    return this.reservationService.migrateReservationAmenityExtraType();
  }

  @Public()
  @Get("migrate-reservation-status")
  async migrateReservationStatus() {
    return this.reservationService.migrateReservationStatus();
  }
}
