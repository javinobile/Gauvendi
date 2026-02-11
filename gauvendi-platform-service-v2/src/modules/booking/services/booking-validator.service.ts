import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HotelConfigurationTypeEnum } from '@src/core/enums/common';
import { HotelConfigurationRepository } from '@src/modules/hotel-configuration/hotel-configuration.repository';
import { RoomProductAvailabilityService } from '@src/modules/room-product-availability/room-product-availability.service';
import { getDay, getHours, getMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { BOOKING_ERROR_CODES } from '../contants/booking.const';
import { RequestBookingDto, RoomAvailabilityDto } from '../dtos/request-booking.dto';

@Injectable()
export class BookingValidatorService {
  private readonly logger = new Logger(BookingValidatorService.name);

  constructor(
    private hotelConfigurationService: HotelConfigurationRepository,
    private roomProductAvailabilityService: RoomProductAvailabilityService
  ) {}

  async validateBookingRequest(
    payload: RequestBookingDto,
    hotel: Hotel
  ): Promise<RoomAvailabilityDto[]> {
    this.validateRequiredFields(payload);
    this.validateArrivalDeparture(payload);
    await this.validateClosingHours(payload, hotel);
    const roomAvailabilityList = await this.validateRoomAndProductAvailability(payload, hotel);
    // const connector = await this.isConnectedToOhip(hotel.id);
    // if (connector) {
    //   this.validateHouseLevelAvailability(hotel.id, connector?.refreshToken ?? '');
    // }
    return roomAvailabilityList;
  }

  private validateRequiredFields(payload: RequestBookingDto) {
    const { bookingInformation } = payload;
    const required = bookingInformation?.guestInformation;
    if (!required.id && (!required?.firstName || !required?.emailAddress)) {
      throw new BadRequestException(BOOKING_ERROR_CODES.BOOKING_MISSING_REQUIRED_GUEST_INFO);
    }

    if (!bookingInformation.reservationList?.length) {
      throw new BadRequestException(BOOKING_ERROR_CODES.BOOKING_RESERVATION_LIST_EMPTY);
    }

    for (const reservation of bookingInformation.reservationList) {
      if (!reservation.arrival || !reservation.departure) {
        throw new BadRequestException(BOOKING_ERROR_CODES.BOOKING_MISSING_ARRIVAL_OR_DEPARTURE);
      }
    }
  }

  private validateArrivalDeparture(payload: RequestBookingDto) {
    for (const reservation of payload.bookingInformation.reservationList) {
      const { arrival, departure } = reservation;
      if (departure <= arrival) {
        throw new BadRequestException(BOOKING_ERROR_CODES.BOOKING_DEPARTURE_MUST_BE_AFTER_ARRIVAL);
      }

      // Basic validation - detailed timezone validation will be done in validateClosingHours
      const now = new Date();
      if (new Date(arrival) < now) {
        throw new BadRequestException(BOOKING_ERROR_CODES.BOOKING_ARRIVAL_CANNOT_BE_IN_THE_PAST);
      }
    }
  }

  private async validateClosingHours(payload: RequestBookingDto, hotel: Hotel) {
    const timeZone = hotel.timeZone;
    if (!timeZone) {
      throw new BadRequestException(BOOKING_ERROR_CODES.BOOKING_HOTEL_TIMEZONE_NOT_CONFIGURED);
    }

    // Get current date in hotel's timezone
    const currentTimeInHotelTZ = new Date();
    const currentDateInHotelTZ = formatInTimeZone(currentTimeInHotelTZ, timeZone, 'yyyy-MM-dd');

    for (const reservation of payload.bookingInformation.reservationList) {
      // Get arrival date
      const arrivalDateStr = reservation.arrival;

      // Only check closing hours if arrival date is today in hotel timezone
      if (arrivalDateStr === currentDateInHotelTZ) {
        const hotelConfig = await this.hotelConfigurationService.getHotelConfiguration({
          hotelId: hotel.id,
          configType: HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING
        });

        if (!hotelConfig?.configValue) {
          throw new BadRequestException(
            BOOKING_ERROR_CODES.BOOKING_HOTEL_CONFIGURATION_NOT_FOUND_CONFIG_VALUE
          );
        }

        const settings = hotelConfig.configValue ? hotelConfig.configValue : {};
        const closingHours = settings.metadata;

        if (!closingHours) {
          throw new BadRequestException(
            BOOKING_ERROR_CODES.BOOKING_HOTEL_CLOSING_HOURS_NOT_CONFIGURED
          );
        }

        // Get current time details in hotel timezone
        const currentHotelTime = formatInTimeZone(
          currentTimeInHotelTZ,
          timeZone,
          'yyyy-MM-dd HH:mm:ss'
        );
        const currentHotelDate = new Date(currentHotelTime);
        const currentHour = getHours(currentHotelDate);
        const currentMinute = getMinutes(currentHotelDate);

        // Get day of week for today in hotel timezone
        const daysOfWeek = [
          'SUNDAY',
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY'
        ];
        const todayDay = daysOfWeek[getDay(currentHotelDate)];
        const closingTime = closingHours[todayDay];

        if (!closingTime) {
          throw new BadRequestException(`No closing hour configured for ${todayDay}`);
        }

        // Parse closing time (format: "HH:mm")
        const [closingHour, closingMinute] = closingTime.split(':').map(Number);

        // Check if current time is past closing hours
        if (
          currentHour > closingHour ||
          (currentHour === closingHour && currentMinute >= closingMinute)
        ) {
          throw new BadRequestException('Hotel is currently closed for check-in');
        }
      }
    }
  }

  private async validateRoomAndProductAvailability(
    payload: RequestBookingDto,
    hotel: Hotel
  ): Promise<RoomAvailabilityDto[]> {
    const roomAvailability = await this.roomProductAvailabilityService.roomProductCheckAvailability(
      {
        hotelId: hotel.id,
        requestRooms: payload.bookingInformation.reservationList?.map((r) => ({
          roomProductId: r.roomProductId ?? '',
          arrival: r.arrival,
          departure: r.departure
        }))
      }
    );
    return (roomAvailability ?? []).map((response) => ({
      roomProductId: response?.['id'],
      roomProductName: response?.['name'],
      roomProductCode: response?.['code'],
      isErfcDeduct: response?.['rfcAllocationSetting'] === 'DEDUCT',
      roomIds: response.roomProductAssignedUnits.map((unit) => unit.roomUnitId),
      roomIdsGroup: response.roomProductAssignedUnits.map((unit) => ({
        id: unit.roomUnitId,
        roomAvailabilityList: (
          unit.roomUnit.roomUnitAvailabilities.map((availability) => ({
            roomId: unit.roomUnitId,
            totalAmount: Number(unit.totalAmount),
            date: availability.date,
            status: availability.status
          })) as any[]
        )?.sort((a, b) => a.totalAmount - b.totalAmount)
      }))
    }));

    // const rfcCodes = this.extractRfcCodes(payload);
    // const { rfcIds, mappingRfcs } = await this.getRfcDetails(rfcCodes, hotel.id);
    // const productRooms = await this.getProductRooms(rfcIds);
    // this.assignRoomIdsToRfcs(mappingRfcs, productRooms);

    // // const mappingErfcs = mappingRfcs.filter((r) => r.isErfcDeduct);
    // // const mappingRemainingRfcs = mappingRfcs.filter((r) => !r.isErfcDeduct);

    // // const { from, to } = this.getDateRange(payload);
    // const roomIds = this.extractRoomIds(productRooms);

    // const roomAvailability = await this.roomAvailabilityService.getRoomAvailability({
    //   hotelId: hotel.id,
    //   roomIds,
    //   from: payload.bookingInformation.arrivalDate,
    //   to: payload.bookingInformation.departureDate
    // });

    // const roomAvailabilityMapped = this.buildRoomAvailabilityList(roomAvailability);

    // const roomAvailabilityList = Object.keys(roomAvailabilityMapped).reduce((acc, curr) => {
    //   acc[curr] = roomAvailabilityMapped[curr].map((r) => r.status);
    //   return acc;
    // }, {});
    // this.validateRoomAvailability(mappingRfcs, roomAvailabilityList);
    // this.logger.log('Room and product availability validated');
    // mappingRfcs.forEach((r) => {
    //   r.roomIdsGroup =
    //     r.roomIdsGroup?.map((id) => ({
    //       id,
    //       roomAvailabilityList: roomAvailabilityMapped[id]
    //     })) ?? [];
    // });
    // return mappingRfcs;
  }

  // private extractRfcCodes(payload: RequestBookingDto): string[] {
  //   return payload.bookingInformation.reservationList
  //     .map((p) => p.rfcRatePlanCode?.split('-')?.[0])
  //     .filter((r) => !!r);
  // }

  // private async getRfcDetails(rfcCodes: string[], hotelId: string) {
  //   let rfcIds: string[] = [];
  //   let mappingRfcs: any[] = [];

  //   if (rfcCodes.length) {
  //     const rfcs = await this.roomProductService.findAll({ hotelId, codeList: rfcCodes });
  //     rfcIds = rfcs.map((r) => r.id);
  //     mappingRfcs = rfcs.map((r) => ({
  //       rfcId: r.id,
  //       rfcName: r.name,
  //       rfcCode: r.code,
  //       isErfcDeductAll: r?.code?.startsWith('ERFC') && r?.rfcAllocationSetting === 'ALL',
  //       roomIdsGroup: []
  //     }));
  //   }

  //   return { rfcIds, mappingRfcs };
  // }

  // private assignRoomIdsToRfcs(mappingErfcs: any[], productRooms: any) {
  //   mappingErfcs.forEach((r) => {
  //     r.roomIdsGroup = productRooms[r.rfcId]?.map((r) => r.roomId ?? '') ?? [];
  //   });
  // }

  // private getDateRange(payload: RequestBookingDto) {
  //   return {
  //     from: payload.bookingInformation.arrivalDate,
  //     to: format(subDays(new Date(payload.bookingInformation.departureDate), 1), 'yyyy-MM-dd')
  //   };
  // }

  private extractRoomIds(productRooms: any): string[] {
    return Object.values(productRooms).flatMap((r: any) => r.map((r: any) => r.roomId ?? ''));
  }

  private buildRoomAvailabilityList(roomAvailability: any[]) {
    const list = roomAvailability.reduce((acc, curr) => {
      if (!curr.roomId) {
        acc['UNKNOWN'] = [];
        return acc;
      }

      if (acc[curr.roomId]) {
        acc[curr.roomId].push(curr);
        return acc;
      }

      acc[curr.roomId] = [curr];
      return acc;
    }, {}) as Record<string, any[]>;

    delete list['UNKNOWN'];
    return list;
  }

  private validateRoomAvailability(
    mappingRfcs: {
      rfcId: string;
      rfcCode: string;
      isErfcDeductAll: boolean;
      roomIdsGroup: string[];
    }[],
    roomAvailabilityList: Record<string, string[]>
  ) {
    if (!mappingRfcs?.length) {
      this.logger.error('🚀 validateErfcRoomAvailability mappingRfcs is empty');
      throw new BadRequestException('Not found room for Rfc');
    }

    for (const r of mappingRfcs) {
      if (r.isErfcDeductAll) {
        for (const roomId of r.roomIdsGroup) {
          const isUnavailable = roomAvailabilityList[roomId]?.some((v) => v !== 'AVAILABLE');
          delete roomAvailabilityList[roomId];
          if (!isUnavailable) {
            continue;
          }
          this.logger.error('🚀 validateRoomAvailability Room not available');
          throw new BadRequestException(`Room not available for ${r.rfcCode}`);
        }
        continue;
      }

      r.roomIdsGroup = r.roomIdsGroup?.filter((roomId: string) => {
        const isUnavailable = roomAvailabilityList[roomId]?.some((v) => v !== 'AVAILABLE');
        delete roomAvailabilityList[roomId];
        return !isUnavailable;
      });
      if (!r.roomIdsGroup?.length) {
        this.logger.error('🚀 validateRoomAvailability Room not available');
        throw new BadRequestException(`Room not available for ${r.rfcCode}`);
      }
    }
  }

  // private async getProductRooms(rfcIds: string[]) {
  //   const rfcRooms = await this.rfcRoomService.getRfcRooms({
  //     rfcIds
  //   });
  //   const rooms = await this.roomService.getRooms({
  //     rfcIds: rfcRooms.map((r) => r.roomId ?? '')
  //   });

  //   const merged = rfcRooms.reduce(
  //     (acc, rfc) => {
  //       if (!rfc.rfcId) {
  //         acc['UNKNOWN'] = [];
  //         return acc;
  //       }
  //       const room = rooms.find((room) => room.id === rfc.roomId);
  //       const roomInfo = {
  //         rfcId: rfc.id,
  //         roomId: room?.id,
  //         roomNumber: room?.roomNumber
  //       };
  //       if (!acc[rfc.rfcId]) {
  //         acc[rfc.rfcId] = [];
  //       }
  //       acc[rfc.rfcId].push(roomInfo);
  //       return acc;
  //     },
  //     {} as Record<
  //       string,
  //       Array<{ rfcId: string; roomId?: string | null; roomNumber?: string | null }>
  //     >
  //   );

  //   return merged;
  // }

  // private async isConnectedToOhip(hotelId: string): Promise<Connector | null> {
  //   const connector = await this.connectorService.getConnector({
  //     hotelId,
  //     connectorType: 'Ohip'
  //   });
  //   return connector;
  // }

  // private async validateHouseLevelAvailability(hotelId: string, refreshToken: string) {
  //   // hotelId = 'b84484ae-40a2-4315-a91b-7be9c32bdfa5';
  //   // refreshToken =
  //   //   '{"gatewayUrl":"https://mtce12pr.hospitality-api.eu-frankfurt-1.ocs.oraclecloud.com","username":"THHQ01_GAUVENDI62","password":"hB4kjqtevdayw88","clientId":"gauvendi_Client","clientSecret": "529RtUGWQ2-8w7I_3Ww4jvKH"}';
  //   if (!refreshToken) {
  //     this.logger.warn('No connector refresh token found');
  //     return;
  //   }

  //   try {
  //     const { gatewayUrl, username, password, clientId, clientSecret } = JSON.parse(
  //       refreshToken ?? '{}'
  //     );
  //     const token = await this.ohipService.getOhipToken({
  //       gatewayUrl: gatewayUrl,
  //       username: username,
  //       password: password,
  //       clientId: clientId,
  //       clientSecret: clientSecret
  //     });
  //     if (!token) {
  //       throw new BadRequestException('Invalid connector refresh token');
  //     }

  //     const mappingHotel = await this.mappingHotelService.getMappingHotel({ hotelId: hotelId });
  //     const isAvailable = await this.ohipService.getHouseAvailability({
  //       gatewayUrl: gatewayUrl,
  //       token: token.access_token,
  //       mappingHotelCode: mappingHotel?.mappingHotelCode ?? ''
  //     });
  //   } catch (error) {
  //     this.logger.error('Error getting Ohip token', error);
  //   }
  // }

  async validateRoomAndProductAvailabilityProposal(
    payload: RequestBookingDto,
    hotel: Hotel
  ): Promise<RoomAvailabilityDto[]> {
    const availabilityResponse =
      await this.roomProductAvailabilityService.roomProductCheckAvailabilityProposal({
        hotelId: hotel.id,
        requestRooms: payload.bookingInformation.reservationList?.map(
          (r) =>
            ({
              roomProductId: r.roomProductId ?? '',
              arrival: r.arrival,
              departure: r.departure,
              roomUnitId: r.roomUnitId
            }) as any
        )
      });

    const roomAvailability: RoomAvailabilityDto[] = (availabilityResponse ?? []).map(
      (response) => ({
        roomProductId: response.id,
        roomProductName: response.name,
        roomProductCode: response.code,
        isErfcDeduct: response.rfcAllocationSetting === 'DEDUCT',
        roomIds: response.roomProductAssignedUnits.map((unit) => unit.roomUnitId),
        roomIdsGroup: response.roomProductAssignedUnits.map((unit) => ({
          id: unit.roomUnitId,
          roomAvailabilityList: (
            unit.roomUnit.roomUnitAvailabilities.map((availability) => ({
              ...availability,
              totalAmount: Number(unit.totalAmount),
              date: availability.date,
              status: availability.status
            })) as any[]
          )?.sort((a, b) => a.totalAmount - b.totalAmount)
        }))
      })
    );
    return roomAvailability;
  }
}
