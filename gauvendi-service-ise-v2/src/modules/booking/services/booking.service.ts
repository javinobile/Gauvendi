import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { ISE_SERVICE } from 'src/core/clients/ise-client.module';
import { PLATFORM_SERVICE } from 'src/core/clients/platform-client.module';
import { DB_NAME } from 'src/core/constants/db.const';
import { LanguageCodeEnum } from 'src/core/database/entities/base.entity';
import { BookingProposalSetting } from 'src/core/entities/booking-entities/booking-proposal-setting.entity';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { ReservationStatusEnum } from 'src/core/entities/booking-entities/reservation.entity';
import {
  BookingTransactionStatusEnum,
  BookingValidationMessage,
  ProcessPaymentValidationMessage
} from 'src/core/enums/booking-transaction';
import { ResponseCodeEnum, ResponseStatusEnum } from 'src/core/enums/common';
import { PaymentProviderCodeEnum } from 'src/core/enums/payment';
import { BadRequestException } from 'src/core/exceptions';
import { QUEUE_NAMES } from 'src/core/modules/queue/queue.constant';
import { RedisService } from 'src/core/modules/redis/redis.service';
import { getNights } from 'src/core/utils/datetime.util';
import { AdyenProcessPaymentResponseStatusEnum } from 'src/integration/payment/dtos/payment-interface.dto';
import {
  GetGVPaymentIntentDto,
  StorePaymentInformationDto
} from 'src/integration/payment/dtos/stripe-payment.dto';
import { PaymentInterfaceService } from 'src/integration/payment/services/payment-interface.service';
import { AvailabilityService } from 'src/modules/availability/services/availability.service';
import { BookingTransactionRepository } from 'src/modules/booking-transaction/repositories/booking-transaction.repository';
import { ConnectorRepository } from 'src/modules/connector/repositories/connector.repository';
import { ResponseContent, ResponseContentStatusEnum } from 'src/modules/core/dtos/common.dto';
import { GuestRepository } from 'src/modules/guest/repositories/guest.repository';
import { HotelPaymentAccountRepository } from 'src/modules/hotel-payment-account/repositories/hotel-payment-account.repository';
import { HotelRepository } from 'src/modules/hotel-v2/repositories/hotel.repository';
import { GlobalPaymentMethodRepository } from 'src/modules/hotel/repositories/global-payment-method.repository';
import { GlobalPaymentProviderRepository } from 'src/modules/hotel/repositories/global-payment-provider.repository';
import { HotelPaymentMethodSettingRepository } from 'src/modules/hotel/repositories/property-payment-method-setting.repository';
import { MappingPmsHotelRepository } from 'src/modules/mapping-pms-hotel/repositories/mapping-pms-hotel.repository';
import { ReservationTimeSliceRepository } from 'src/modules/reservation-time-slice/repositories/reservation-time-slice.repository';
import { ReservationRepository } from 'src/modules/reservation/repositories/reservation.repository';
import { BookingGateway } from 'src/ws/gateways/booking.gateway';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CancelBookingFilterDto } from '../dtos/cancel-booking.dto';
import { ConfirmBookingProposalInputDto } from '../dtos/confirm-booking-proposal.dto';
import { DeclineProposalBookingDto } from '../dtos/decline-propsal-booking.dto';
import {
  CompleteBookingPaymentDto,
  ConfirmBookingPaymentDto,
  GuestDto,
  RequestBookingDto,
  RoomAvailabilityDto,
  WSCreatePaymentStatusDto,
  WSPaymentCompleteDto
} from '../dtos/request-booking.dto';
import { UpdateBookingInformationDto } from '../dtos/update-booking-information.dto';
import { BookingQueueEvents } from '../queue/booking-queue-events';
import { BookingMetaTrackingRepository } from '../repositories/booking-meta-tracking.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingValidatorService } from './booking-validator.service';
import { CreateBookingService } from './create-booking.service';
import { CapturePayPalOrderResponse } from 'src/integration/payment/dtos/paypal-payment.dto';
import { BookingTransaction } from 'src/core/entities/booking-entities/booking-transaction.entity';
import { format } from 'date-fns';
import { CMD } from 'src/core/constants/cmd.const';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private bookingValidatorService: BookingValidatorService,
    private createBookingService: CreateBookingService,
    private connectorRepository: ConnectorRepository,
    private hotelRepository: HotelRepository,
    private bookingRepository: BookingRepository,
    private bookingMetaTrackingRepository: BookingMetaTrackingRepository,
    private reservationRepository: ReservationRepository,
    private availabilityService: AvailabilityService,
    private mappingPmsHotelRepository: MappingPmsHotelRepository,
    private globalPaymentProviderRepository: GlobalPaymentProviderRepository,
    private globalPaymentMethodRepository: GlobalPaymentMethodRepository,
    private hotelPaymentMethodSettingRepository: HotelPaymentMethodSettingRepository,
    private guestRepository: GuestRepository,
    private reservationTimeSliceRepository: ReservationTimeSliceRepository,
    private bookingQueueEvents: BookingQueueEvents,
    private redisService: RedisService,
    private bookingGateway: BookingGateway,
    private bookingTransactionRepository: BookingTransactionRepository,
    private hotelPaymentAccountRepository: HotelPaymentAccountRepository,
    private paymentInterfaceService: PaymentInterfaceService,

    @InjectQueue(QUEUE_NAMES.BOOKING)
    private bookingQueue: Queue,

    @InjectRepository(BookingProposalSetting, DB_NAME.POSTGRES)
    private bookingProposalSettingRepository: Repository<BookingProposalSetting>,

    @Inject(PLATFORM_SERVICE)
    private readonly platformService: ClientProxy,

    @Inject(ISE_SERVICE)
    private readonly iseService: ClientProxy
  ) {}

  async cppConfirmPaymentBooking(body: ConfirmBookingProposalInputDto): Promise<any> {
    try {
      const result = await lastValueFrom(
        this.platformService.send({ cmd: CMD.BOOKING.CPP_CONFIRM_PAYMENT_BOOKING }, { ...body })
      );
      return {
        data: result,
        status: ResponseContentStatusEnum.SUCCESS,
        message: 'Booking created successfully'
      };
    } catch (error) {
      const message = error?.message ?? 'Failed to confirm booking proposal';
      throw new BadRequestException(message);
    }
  }

  async declineProposalBooking(body: DeclineProposalBookingDto) {
    try {
      const reservation = await this.reservationRepository.getReservations({
        bookingId: body.bookingId
      });

      if (reservation.length === 0) {
        return false;
      }

      const hotelId = reservation[0].hotelId;

      await Promise.all(
        reservation.map((res) =>
          lastValueFrom(
            this.platformService.send(
              { cmd: 'cancel_reservation' },
              {
                reservationNumber: res.reservationNumber,
                bookingId: body.bookingId,
                hotelId,
                cancelledBy: body.cancelledBy
              }
            )
          )
        )
      );

      return true;
    } catch (error) {
      console.log('🚀 ~ BookingService ~ declineProposalBooking ~ error:', error);
      throw new BadRequestException('Failed to decline proposal booking');
    }
  }

  async requestBooking(body: RequestBookingDto, res: Response): Promise<any> {
    const dataResult = await lastValueFrom(
      this.iseService.send({ cmd: 'ise_request_booking' }, body)
    );

    return res.status(HttpStatus.OK).send({
      code: ResponseCodeEnum.SUCCESS,
      status: ResponseStatusEnum.SUCCESS,
      message: 'Booking created successfully',
      data: {
        booking: dataResult
      }
    });
  }

  async wsCreatePaymentStatus(body: WSCreatePaymentStatusDto) {
    const { bookingId } = body;
    this.bookingGateway.paymentStatus.set(bookingId, new BehaviorSubject(null));
    return true;
  }

  async wsPaymentComplete(body: WSPaymentCompleteDto) {
    await this.createBookingService.handleSocketPayment(body);
    return true;
  }

  async requestBookingQueue(body: RequestBookingDto): Promise<any> {
    try {
      const result = await lastValueFrom(
        this.platformService.send(
          { cmd: CMD.BOOKING.REQUEST_BOOKING_CREATION },
          { ...body, bookingFrom: 'ISE' }
        )
      );

      return result;
    } catch (error) {
      const message = error?.message ?? 'Failed to request booking queue';
      throw new BadRequestException(message);
    }
  }

  private buildRoomAvailabilityList(
    roomAvailabilityList: RoomAvailabilityDto[],
    body?: RequestBookingDto
  ) {
    // Since the first item in roomAvailabilityList is already the lowest price,
    // we don't need to call rfcRoomBasePriceViewService.getRfcRoomBasePriceView
    const result = roomAvailabilityList.map((item, index) => {
      const roomIds = this.getRoomIds(item);
      const allUnitIds = item.roomIdsGroup?.map((room) => room.id);
      if (body) {
        body.bookingInformation.reservationList[index].alternativeUnitIds = allUnitIds?.filter(
          (id) => !roomIds?.includes(id)
        );
      }
      return {
        roomProductId: item.roomProductId,
        roomProductName: item.roomProductName,
        roomProductCode: item.roomProductCode,
        isErfcDeduct: item.isErfcDeduct,
        roomIds: roomIds,
        roomAvailability: this.getRoomAvailability(item)
      };
    }) as RoomAvailabilityDto[];

    return result;
  }

  private getRoomIds(item: RoomAvailabilityDto) {
    if (item.roomProductCode?.startsWith('RFC')) {
      return [item.roomIdsGroup?.[0]?.id];
    }

    if (item.roomProductCode?.startsWith('ERFC') && !item.isErfcDeduct) {
      return item.roomIdsGroup?.map((room) => room.id);
    }

    // For other cases (not RFC and not ERFC without deduct),
    // since the first item is already the lowest price, use the first room
    return item.roomIdsGroup?.length ? [item.roomIdsGroup[0].id] : [];
  }

  private getRoomAvailability(item: RoomAvailabilityDto): any[] {
    if (item.roomProductCode?.startsWith('RFC')) {
      return item.roomIdsGroup?.[0]?.roomAvailabilityList ?? [];
    }

    if (item.roomProductCode?.startsWith('ERFC') && !item.isErfcDeduct) {
      return item.roomIdsGroup?.flatMap((room) => room.roomAvailabilityList) ?? [];
    }

    // Since the first item is already the lowest price, use the first room's availability
    return item.roomIdsGroup?.[0]?.roomAvailabilityList ?? [];
  }

  async updateBookingInformation(body: UpdateBookingInformationDto): Promise<any> {
    const bookingInput: Partial<Booking> & Pick<Booking, 'id'> = {
      id: body.booking.id || ''
    };

    return await this.bookingRepository.updateBooking(bookingInput);
  }

  async cancelBooking(filter: CancelBookingFilterDto): Promise<any> {
    const { bookingId, cancelledBy } = filter;

    const booking = await this.bookingRepository.getBooking(bookingId);
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    const reservations = booking.reservations.map((reservation) => {
      reservation.cancelledBy = cancelledBy || '';
      reservation.status = ReservationStatusEnum.CANCELLED;
      return reservation;
    });

    // await this.availabilityService.processRoomProductReleaseAvailability({
    //   hotelId: booking.hotelId ?? '',
    //   requestRooms: reservations.map((reservation) => ({
    //     roomProductId: reservation.roomProductId ?? '',
    //     arrival: reservation.arrival?.toISOString() ?? '',
    //     departure: reservation.departure?.toISOString() ?? '',
    //     roomUnitIds: reservation.roomIds ?? []
    //   }))
    // });

    return await this.reservationRepository.updateReservations(reservations);
  }

  private parsePaymentData(paymentData: string, paymentProviderCode: PaymentProviderCodeEnum): any {
    switch (paymentProviderCode) {
      case PaymentProviderCodeEnum.GAUVENDI_PAY: {
        return paymentData;
      }
      default: {
        return JSON.parse(paymentData);
      }
    }
  }

  async completeBookingPayment(body: CompleteBookingPaymentDto) {
    const { booking: bookingInput, paymentIntent: paymentIntentInput } = body;

    const bookingId = bookingInput.id;

    // Get booking
    const booking = await this.bookingRepository.getBookingWithRelations({
      id: bookingId,
      relations: ['reservations', 'reservations.reservationTimeSlices']
    });
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    const hotelId = booking.hotelId;
    if (!hotelId) {
      throw new BadRequestException('Hotel not found');
    }

    const paymentId = paymentIntentInput.id;
    const paymentProviderCode = paymentIntentInput.paymentProviderCode as PaymentProviderCodeEnum;

    // Get booking transaction
    const bookingTransaction =
      await this.bookingTransactionRepository.getBookingTransactionByBookingId(bookingId);

    // ERROR [HTTP] Error: Unexpected token 'p', "pi_3SjWkDA"... is not valid JSON - 500 - 8.574 seconds
    const paymentData = bookingTransaction?.paymentData
      ? this.parsePaymentData(bookingTransaction.paymentData, paymentProviderCode)
      : {};

    const paymentStatusFromClient = this.bookingGateway.paymentStatus.get(bookingId);

    // Handle payment based on provider
    switch (paymentProviderCode) {
      case PaymentProviderCodeEnum.GAUVENDI_PAY: {
        const [globalPaymentProvider, globalPaymentMethod] = await Promise.all([
          this.globalPaymentProviderRepository.getGlobalPaymentProvider({
            code: paymentProviderCode ?? ''
          }),
          this.globalPaymentMethodRepository.getGlobalPaymentMethod({
            code: bookingTransaction?.paymentMode ?? ''
          })
        ]);
        const propertyPaymentMethodSetting =
          await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSetting({
            propertyId: hotelId,
            globalPaymentProviderId: globalPaymentProvider?.id,
            globalPaymentMethodId: globalPaymentMethod?.id
          });
        const metadata = propertyPaymentMethodSetting?.metadata?.metadata;

        const connectedAccount =
          metadata['bookingEngineOriginKey'] != null
            ? metadata['bookingEngineOriginKey'].toString()
            : null;
        if (!connectedAccount) {
          return ResponseContent.error(ProcessPaymentValidationMessage.NOT_FOUND_PAYMENT_PROVIDER);
        }

        try {
          // Get payment intent information
          const paymentIntentResponse = await this.paymentInterfaceService.getStripePaymentIntent(
            paymentId,
            connectedAccount
          );

          if (!paymentIntentResponse?.data) {
            return ResponseContent.error(BookingValidationMessage.NOT_FOUND_PAYMENT_INTENT);
          }

          const pmResponse = plainToInstance(GetGVPaymentIntentDto, paymentIntentResponse.data);

          const paymentIntent = { ...pmResponse };

          if (paymentIntent.status?.toLowerCase() === 'succeeded') {
            // Update booking transaction
            if (bookingTransaction && paymentIntent.paymentMethodId) {
              try {
                // Get payment method information
                const paymentMethodResponse =
                  await this.paymentInterfaceService.getStripePaymentMethod(
                    paymentIntent.paymentMethodId,
                    connectedAccount
                  );

                if (paymentMethodResponse?.data) {
                  const card = plainToInstance(
                    StorePaymentInformationDto,
                    paymentMethodResponse.data
                  );
                  await this.bookingTransactionRepository.updateBookingTransaction({
                    id: bookingTransaction.id,
                    status: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED,
                    paymentDate: new Date(),
                    expiryMonth: card.expiryMonth?.toString().padStart(2, '0'),
                    expiryYear: card.expiryYear?.toString(),
                    accountNumber: card.maskedCardNumber ? `${card.maskedCardNumber}` : null,
                    cardType: card.brand,
                    paymentData
                  });
                } else {
                  await this.bookingTransactionRepository.updateBookingTransaction({
                    id: bookingTransaction.id,
                    status: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED,
                    paymentDate: new Date(),
                    paymentData
                  });
                }
              } catch (error) {
                this.logger.error(`Error getting payment method: ${error.message}`);
                // Still update transaction status even if payment method fetch fails
                await this.bookingTransactionRepository.updateBookingTransaction({
                  id: bookingTransaction.id,
                  status: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED,
                  paymentDate: new Date()
                });
              }
            }
            paymentStatusFromClient?.next({
              bookingId: bookingId,
              paymentStatus: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED
            });
          } else {
            // Update booking transaction
            if (bookingTransaction) {
              await this.updateBookingTransactionPaymentMessages(bookingTransaction, {
                status: 'Refused'
              });
            }
            await this.releaseRoomForBooking(booking);
            // Payment not succeeded - send compensate booking message
            // Notify via websocket
            paymentStatusFromClient?.next({
              bookingId: bookingId,
              paymentStatus: BookingTransactionStatusEnum.PAYMENT_FAILED
            });
            return ResponseContent.error(
              BookingValidationMessage.BOOKING_PAYMENT_NOT_YET_COMPLETED
            );
          }
        } catch (error) {
          this.logger.error(`Error processing Stripe payment: ${error.message}`);
          // Update booking transaction
          if (bookingTransaction) {
            await this.updateBookingTransactionPaymentMessages(bookingTransaction, {
              status: 'Refused'
            });
          }
          await this.releaseRoomForBooking(booking);
          // Notify via websocket
          paymentStatusFromClient?.next({
            bookingId: bookingId,
            paymentStatus: BookingTransactionStatusEnum.PAYMENT_FAILED
          });
          return ResponseContent.error(BookingValidationMessage.NOT_FOUND_PAYMENT_INTENT);
        }
        break;
      }

      case PaymentProviderCodeEnum.ADYEN:
      case PaymentProviderCodeEnum.APALEO_PAY: {
        const { paymentApiKey, liveEndpointUrlPrefix } = await this.getAdyenPaymentApiKeyPair(
          hotelId,
          paymentProviderCode,
          booking.reservations?.[0]?.hotelPaymentModeCode ?? ''
        );

        if (!paymentApiKey) {
          return ResponseContent.error(ProcessPaymentValidationMessage.NOT_FOUND_PAYMENT_API_KEY);
        }

        try {
          const submitPaymentResponse =
            await this.paymentInterfaceService.submitAdyenPaymentDetails(
              {
                redirectResult: paymentId,
                threeDSResult: null
              },
              paymentApiKey,
              liveEndpointUrlPrefix || ''
            );

          if (!submitPaymentResponse?.data) {
            return ResponseContent.error(ProcessPaymentValidationMessage.NOT_FOUND_PAYMENT_DATA);
          }

          const submitPaymentData = submitPaymentResponse.data;

          if (submitPaymentData.status === AdyenProcessPaymentResponseStatusEnum.AUTHORISED) {
            // Update booking transaction
            if (bookingTransaction) {
              const updateData: any = {
                id: bookingTransaction.id,
                status: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED,
                paymentDate: new Date(),
                referenceNumber: submitPaymentData.psp_reference
              };

              // Set card info from additional data
              if (submitPaymentData.additional_data) {
                const additionalData = submitPaymentData.additional_data;
                updateData.cardType =
                  additionalData['paymentMethod'] || additionalData['payment_method'];
                updateData.accountNumber =
                  additionalData['cardSummary'] || additionalData['card_summary'];
                updateData.accountHolder =
                  additionalData['cardHolderName'] || additionalData['card_holder_name'];

                const expiryDate = additionalData['expiryDate'] || additionalData['expiry_date'];
                if (expiryDate) {
                  try {
                    const parts = expiryDate.split('/');
                    if (parts.length === 2) {
                      updateData.expiryMonth = parts[0].padStart(2, '0');
                      updateData.expiryYear = parts[1];
                    }
                  } catch (e) {
                    this.logger.error(`Error parsing expiry date: ${e.message}`);
                  }
                }
              }

              await this.bookingTransactionRepository.updateBookingTransaction(updateData);
              // Notify via websocket
              paymentStatusFromClient?.next({
                bookingId: bookingId,
                paymentStatus: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED
              });
            }
          } else {
            // Update booking transaction
            if (bookingTransaction) {
              await this.updateBookingTransactionPaymentMessages(
                bookingTransaction,
                submitPaymentData
              );
            }

            await this.releaseRoomForBooking(booking);
            // Payment not authorized - send compensate booking message
            // Notify via websocket
            paymentStatusFromClient?.next({
              bookingId: bookingId,
              paymentStatus: BookingTransactionStatusEnum.PAYMENT_FAILED
            });

            return ResponseContent.error(
              BookingValidationMessage.BOOKING_PAYMENT_NOT_YET_COMPLETED
            );
          }
        } catch (error) {
          // Update booking transaction
          if (bookingTransaction) {
            await this.updateBookingTransactionPaymentMessages(bookingTransaction, {
              status: 'Refused'
            });
          }
          await this.releaseRoomForBooking(booking);
          this.logger.error(`Error processing Adyen payment: ${error.response?.data?.message}`);
          // Notify via websocket
          paymentStatusFromClient?.next({
            bookingId: bookingId,
            paymentStatus: BookingTransactionStatusEnum.PAYMENT_FAILED
          });
          return ResponseContent.error(
            ProcessPaymentValidationMessage.REQUEST_BOOKING_PAYMENT_FAILED
          );
        }
        break;
      }
      default:
        // Update booking transaction
        if (bookingTransaction) {
          await this.updateBookingTransactionPaymentMessages(bookingTransaction, {
            status: 'Refused'
          });
        }
        await this.releaseRoomForBooking(booking);
        // Notify via websocket
        paymentStatusFromClient?.next({
          bookingId: bookingId,
          paymentStatus: BookingTransactionStatusEnum.PAYMENT_FAILED
        });
        return ResponseContent.error(
          ProcessPaymentValidationMessage.REQUEST_BOOKING_PAYMENT_FAILED
        );
    }
  }

  private async updateBookingTransactionPaymentMessages(
    bookingTransaction: BookingTransaction,
    responsePayment: any
  ) {
    const updateData: any = {
      id: bookingTransaction.id,
      paymentMessages: [
        {
          status: responsePayment.status,
          message: responsePayment.refusal_reason || 'Card authentication failed',
          createdAt: new Date()
        }
      ]
    };
    await this.bookingTransactionRepository.updateBookingTransaction(updateData);
  }

  private async releaseRoomForBooking(booking: Booking) {
    const reservations = booking.reservations || [];
    if (!reservations) {
      return false;
    }

    await this.availabilityService.processRoomProductReleaseAvailability({
      hotelId: booking.hotelId ?? '',
      requestRooms: reservations?.map((reservation) => {
        const roomIds: string[] = [];
        for (const slice of reservation.reservationTimeSlices || []) {
          if (!slice.roomId || roomIds.includes(slice.roomId)) {
            continue;
          }

          roomIds.push(slice.roomId);
        }

        const arrival = reservation.arrival
          ? format(new Date(reservation.arrival), 'yyyy-MM-dd')
          : '';
        const departure = reservation.departure
          ? format(new Date(reservation.departure), 'yyyy-MM-dd')
          : '';
        this.logger.debug(
          `🚀 Release availability for room product ${reservation.roomProductId} from ${arrival} to ${departure}, room unit ids: ${roomIds.join(
            ', '
          )}`
        );
        const requestRoom = {
          roomProductId: reservation.roomProductId ?? '',
          arrival,
          departure,
          roomUnitIds: roomIds
        };
        return requestRoom;
      })
    });
  }

  private async getAdyenPaymentApiKeyPair(
    hotelId: string,
    paymentProviderCode: PaymentProviderCodeEnum,
    hotelPaymentModeCode: string
  ): Promise<{ paymentApiKey: string | null; liveEndpointUrlPrefix: string | null }> {
    try {
      const [globalPaymentProvider, globalPaymentMethod] = await Promise.all([
        this.globalPaymentProviderRepository.getGlobalPaymentProvider({
          code: paymentProviderCode ?? ''
        }),
        this.globalPaymentMethodRepository.getGlobalPaymentMethod({
          code: hotelPaymentModeCode ?? ''
        })
      ]);
      const propertyPaymentMethodSetting =
        await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSetting({
          propertyId: hotelId,
          globalPaymentProviderId: globalPaymentProvider?.id,
          globalPaymentMethodId: globalPaymentMethod?.id
        });

      return {
        paymentApiKey: propertyPaymentMethodSetting?.metadata?.metadata?.paymentApiKey || null,
        liveEndpointUrlPrefix: propertyPaymentMethodSetting?.metadata?.metadata?.urlPrefix || null
      };
    } catch (error) {
      this.logger.error(`Error getting Adyen payment API key: ${error.message}`);
      return { paymentApiKey: null, liveEndpointUrlPrefix: null };
    }
  }

  async confirmBookingPayment(body: ConfirmBookingPaymentDto) {
    const { propertyCode, refPaymentId, bookingId } = body;

    const booking = await this.bookingRepository.getBooking(bookingId);
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    const hotelId = booking.hotelId;
    if (!hotelId) {
      throw new BadRequestException('Hotel not found');
    }

    // Get booking transaction
    const bookingTransaction =
      await this.bookingTransactionRepository.getBookingTransactionByBookingId(bookingId);

    try {
      // call paypay service to capture
      const paypalPaymentResponse =
        await this.paymentInterfaceService.capturePayPalOrder(refPaymentId);

      if (!paypalPaymentResponse?.data) {
        throw new BadRequestException('Paypal payment not found');
      }

      const data = plainToInstance(CapturePayPalOrderResponse, paypalPaymentResponse.data);

      if (data.status.toLowerCase() !== 'completed') {
        throw new BadRequestException('Paypal payment not completed');
      }

      // Update booking transaction
      await this.bookingTransactionRepository.updateBookingTransaction({
        id: bookingTransaction?.id ?? uuidv4(),
        status: BookingTransactionStatusEnum.PAYMENT_SUCCEEDED,
        paymentDate: new Date(),
        referenceNumber: paypalPaymentResponse.data.id
      });

      return ResponseContent.success('Booking payment confirmed successfully');
    } catch (error) {
      this.logger.error(`Error confirming booking payment: ${error.message}`);
      // update booking transaction status to payment failed
      await this.bookingTransactionRepository.updateBookingTransaction({
        id: bookingTransaction?.id ?? uuidv4(),
        status: BookingTransactionStatusEnum.PAYMENT_FAILED,
        paymentDate: new Date()
      });
      return ResponseContent.error(ProcessPaymentValidationMessage.REQUEST_BOOKING_PAYMENT_FAILED);
    }
  }
}
