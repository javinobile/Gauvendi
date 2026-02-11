import { ReservationStatusEnum } from '@src/core/entities/booking-entities/reservation.entity';
import { ReservationRoomDto } from '@src/modules/reservation/dtos/reservation.dto';

export interface CppCalendarReservationDto {
  id: string;
  bookingId: string | null;
  reservationNumber: string | null;
  arrival?: string; // ISO datetime string: 'yyyy-MM-ddTHH:mm:ssXXX'
  departure?: string;
  bookingDate?: string;
  cancelledDate?: string;
  releasedDate?: string;
  primaryGuest: CppCalendarGuestDto;
  status: ReservationStatusEnum;
  proposalSetting?: BookingProposalSettingDto | null;
  rooms: ReservationRoomDto[];
  timeSlices: ReservationTimeSliceDto[];
  summarizedTimeSlices: ReservationTimeSliceDto[];
  isLocked?: boolean | null;
}

export interface BookingProposalSettingDto {
  id: string; // từ BaseEntityWithDeleted
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  hotelId: string;
  bookingId: string;
  triggerAt: string; // ISO datetime string (timestamptz)
  validBefore: string; // ISO datetime string (timestamptz)
}

export interface CppCalendarGuestDto {
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: string | null;
}

export interface ReservationTimeSliceDto {
  id: string;
  reservationId: string;
  fromTime: string; // format: 'yyyy-MM-dd HH:mm:ss.S'
  toTime: string; // format: 'yyyy-MM-dd HH:mm:ss.S'
  roomId?: string; // TODO: remove (optional)
  rfcId?: string;
  totalBaseAmount: number;
  totalGrossAmount: number;
}

export interface CppCalendarRoomReservationDto {
  roomId: string;
  reservationList: CppCalendarReservationDto[];
}

export interface CppCalendarRoomReservationFilterDto {
  hotelId: string;
  fromDate: string;
  toDate: string;
}
