import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CMD, CRON_JOB_CMD } from '@src/core/constants/cmd.const';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import {
  CancelReservationInput,
  PushPmsReservationInput,
  RatePlanDetailsFilterDto,
  ReleaseBookingInput,
  ReservationManagementFilterDto,
  ReservationPmsFilterDto,
  SendCancellationReservationEmailDto,
  UpdateReservationGuestListInput,
  UpdateReservationLockUnitInput
} from '../dtos/reservation.dto';
import { ReservationService } from '../services/reservation.service';

@Controller('reservation-management')
export class ReservationController {
  private readonly logger = new Logger(ReservationController.name);
  constructor(private readonly reservationService: ReservationService) {}

  @MessagePattern({ cmd: CMD.RESERVATION.MANAGEMENT_LIST })
  async reservationManagementList(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationManagementList(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.SOURCE_LIST })
  async reservationSourceList(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationSourceList(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.BOOKING_FLOW_LIST })
  async reservationBookingFlowList(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationBookingFlowList(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.CHANNEL_LIST })
  async reservationChannelList(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationChannelList(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.STATUS_LIST })
  reservationStatusList() {
    return this.reservationService.getReservationStatusList();
  }

  @MessagePattern({ cmd: CMD.RESERVATION.LIST })
  async reservationList(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationList(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.OVERVIEW })
  async reservationOverview(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationOverview(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.DETAILS })
  async reservationDetails(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationDetails(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.GUEST_LIST })
  async reservationGuestList(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationGuestList(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.COMPANY })
  async reservationCompany(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationCompany(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.PRICING_DETAILS })
  async reservationPricingDetails(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationPricingDetails(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.EMAIL_HISTORY })
  async reservationEmailHistory(@Payload() filter: ReservationManagementFilterDto) {
    return await this.reservationService.getReservationEmailHistory(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.SYNC_PMS_RESERVATIONS })
  async pullPmsReservations(@Payload() filter: ReservationPmsFilterDto) {
    return await this.reservationService.syncPmsReservations(filter);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.CANCEL_RESERVATION })
  async cancelReservation(@Payload() input: CancelReservationInput) {
    return await this.reservationService.cancelReservation(input);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.SEND_CANCELLATION_RESERVATION_EMAIL })
  async sendCancellationReservationEmail(@Payload() input: SendCancellationReservationEmailDto) {
    return await this.reservationService.sendCancellationReservationEmail(input);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.RATE_PLAN_DETAILS })
  async ratePlanDetails(@Payload() input: RatePlanDetailsFilterDto) {
    return await this.reservationService.getRatePlanDetails(input);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.JOB_PULL_PMS_RESERVATIONS })
  async jobPullPmsReservations() {
    this.reservationService.jobPullPmsReservations();
    return true;
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_PULL_PMS_RESERVATIONS })
  async jobPullPmsReservationsEvent() {
    this.logger.debug('Cron job: pull pms reservations event');
    this.reservationService.jobPullPmsReservations();
    return true;
  }

  @MessagePattern({ cmd: CMD.RESERVATION.UPDATE_RESERVATION_LOCK_UNIT })
  async updateReservationLockUnit(@Payload() input: UpdateReservationLockUnitInput) {
    return await this.reservationService.updateReservationLockUnit(input);
  }

  @MessagePattern({ cmd: CMD.CRON_JOB.RELEASE_PROPOSED_RESERVATION })
  async releaseProposedReservation() {
    return await this.reservationService.releaseProposedReservation();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.RELEASE_PROPOSED_RESERVATION })
  async releaseProposedReservationEvent() {
    this.logger.debug('Cron job: release proposed reservation event');
    return await this.reservationService.releaseProposedReservation();
  }

  @MessagePattern({ cmd: CMD.CRON_JOB.JOB_RELEASE_PENDING_PAYMENT })
  async releasePendingPayment() {
    return await this.reservationService.releasePendingPayment();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_RELEASE_PENDING_PAYMENT })
  async releasePendingPaymentEvent() {
    this.logger.debug('Cron job: release pending payment event');
    return await this.reservationService.releasePendingPayment();
  }

  @MessagePattern({ cmd: CMD.RESERVATION.GENERATE_RESERVATION_NOTES })
  async generateReservationNotes(
    @Payload()
    input: {
      booking: Booking;
      reservation: Reservation;
      hotel: Hotel;
      alternativeUnitIds?: string[];
    }
  ) {
    return await this.reservationService.generateReservationNotes(input);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.PUSH_PMS_RESERVATION })
  async pushPmsReservation(@Payload() input: PushPmsReservationInput) {
    return await this.reservationService.pushPmsReservation(input);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.MIGRATE_RESERVATION_AMENITY_EXTRA_TYPE })
  async migrateReservationAmenityExtraType() {
    return await this.reservationService.migrateReservationAmenityExtraType();
  }

  @MessagePattern({ cmd: CMD.RESERVATION.MIGRATE_RESERVATION_STATUS })
  async migrateReservationStatus() {
    return await this.reservationService.migrateReservationStatus();
  }

  @MessagePattern({ cmd: CMD.RESERVATION.UPDATE_GUEST_LIST })
  async updateReservationGuestList(@Payload() input: UpdateReservationGuestListInput) {
    return await this.reservationService.updateReservationGuestList(input);
  }

  @MessagePattern({ cmd: CMD.RESERVATION.RELEASE_BOOKING })
  async releaseBooking(@Payload() input: ReleaseBookingInput) {
    return await this.reservationService.releaseBooking(input);
  }
}
