import { Injectable } from '@nestjs/common';
import { RoomProductExtraType } from '@src/core/enums/common';
import { RatePlanExtraServiceRepository } from '@src/modules/rate-plan-extra-service/repositories/rate-plan-extra-service.repository';
import { RatePlanV2Repository } from '@src/modules/rate-plan/repositories/rate-plan-v2.repository';
import { format } from 'date-fns';
import { DATE_FORMAT } from 'src/core/constants/date.constant';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import {
  RatePlanExtraService,
  RatePlanExtraServiceType
} from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanDailyExtraService } from 'src/core/entities/rate-plan-daily-extra-service.entity';
import { Helper } from 'src/core/helper/utils';
import { groupByToMap, groupByToMapSingle } from 'src/core/utils/group-by.util';
import { HotelAmenityRepository } from 'src/modules/hotel-amenity/repositories/hotel-amenity.repository';
import { RoomProductExtraRepository } from '../../../modules/room-product-extra/room-product-extra.repository';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';

export type BookingRatePlanAmenity = {
  ratePlanId: string;
  index: string;
  amenities: AmenityWithType[];
};

export type BookingRoomProductAmenity = {
  roomProductId: string;
  index: string;
  amenities: AmenityWithType[];
};

export type AmenityWithType = HotelAmenity & {
  ratePlanExtraServiceType: RatePlanExtraServiceType | RoomProductExtraType;
};

@Injectable()
export class AmenityDataProviderService {
  constructor(
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly ratePlanExtraServicesRepository: RatePlanExtraServiceRepository,
    private readonly roomProductExtraRepository: RoomProductExtraRepository,
    private readonly ratePlanV2Repository: RatePlanV2Repository
  ) {}

  async getBookingRatePlanAmenities(filter: {
    reservations: {
      fromDate: string;
      toDate: string;
      ratePlanId: string;
      index: string;
    }[];
    hotelId: string;
  }): Promise<BookingRatePlanAmenity[]> {
    const { reservations, hotelId } = filter;

    const ratePlanIds = reservations.map((reservation) => reservation.ratePlanId);

    if (reservations.length === 0) {
      return [];
    }

    const minFromDate = reservations
      .map((r) => new Date(r.fromDate))
      .reduce((a, b) => (a < b ? a : b));

    const maxToDate = reservations.map((r) => new Date(r.toDate)).reduce((a, b) => (a > b ? a : b));
    const dates = Helper.generateDateRange(
      format(minFromDate, DATE_FORMAT),
      format(maxToDate, DATE_FORMAT)
    );

    const ratePlanDerivedSettings = await this.ratePlanV2Repository.findDerivedSettings({
      hotelId: hotelId,
      baseRatePlanIds: ratePlanIds
      // followDailyIncludedAmenity: true
    });

    const masterRatePlanIds = ratePlanDerivedSettings.map((setting) => setting.derivedRatePlanId);
    const allRatePlanIds = [...new Set([...ratePlanIds, ...masterRatePlanIds])];

    const [ratePlanExtras, dailyExtraServices, hotelAmenities] = await Promise.all([
      this.ratePlanExtraServicesRepository.findAll({
        ratePlanIds: allRatePlanIds
      }),
      this.ratePlanExtraServicesRepository.findDailyExtraServices({
        hotelId: hotelId,
        dates: dates,
        ratePlanIds: allRatePlanIds
      }),
      this.hotelAmenityRepository.getBookingHotelAmenities({ hotelId: hotelId })
    ]);

    const ratePlanExtraServiceMap = groupByToMap(ratePlanExtras, (extra) => extra.ratePlanId);

    const result: {
      ratePlanId: string;
      index: string;
      amenities: AmenityWithType[];
    }[] = [];
    for (const reservation of reservations) {
      const amenityList: AmenityWithType[] = [];

      // handle derived rate plan
      let followRatePlanId = reservation.ratePlanId;
      const masterRatePlanId = ratePlanDerivedSettings.find(
        (setting) => setting.ratePlanId === reservation.ratePlanId
      )?.derivedRatePlanId;
      if (masterRatePlanId) {
        followRatePlanId = masterRatePlanId;
      }

      const reservationDateRanges = Helper.generateDateRange(
        format(reservation.fromDate, DATE_FORMAT),
        format(reservation.toDate, DATE_FORMAT)
      );
      const dailyExtraServiceMap = groupByToMap(
        dailyExtraServices.filter(
          (service) =>
            service.ratePlanId === followRatePlanId && reservationDateRanges.includes(service.date)
        ),
        (service) => service.ratePlanId
      );

      const { extraIdMap, includedIdMap, mandatoryIdMap } = this.getRatePlanAmenityDailyOrDefault({
        ratePlanId: followRatePlanId,
        dates: reservationDateRanges,
        ratePlanExtraServices: ratePlanExtraServiceMap.get(followRatePlanId) ?? [],
        dailyExtraServices: dailyExtraServiceMap.get(followRatePlanId) ?? [],
        hotelAmenities: hotelAmenities
      });

      amenityList.push(
        ...hotelAmenities
          .filter((amenity) => extraIdMap.has(amenity.id))
          .map((amenity) => ({
            ...amenity,
            ratePlanExtraServiceType: RatePlanExtraServiceType.EXTRA
          })),
        ...hotelAmenities
          .filter((amenity) => includedIdMap.has(amenity.id))
          .map((amenity) => {
            return {
              ...amenity,
              includedDates: includedIdMap.get(amenity.id),
              ratePlanExtraServiceType: RatePlanExtraServiceType.INCLUDED
            };
          }),
        ...hotelAmenities
          .filter((amenity) => mandatoryIdMap.has(amenity.id))
          .map((amenity) => ({
            ...amenity,
            ratePlanExtraServiceType: RatePlanExtraServiceType.MANDATORY
          }))
      );

      result.push({
        ratePlanId: reservation.ratePlanId,
        index: reservation.index,
        amenities: amenityList
      });
    }

    return result;
  }

  async getRoomProductAmenities(filter: {
    reservations: {
      roomProductId: string;
      index: string;
    }[];
    hotelId: string;
  }): Promise<BookingRoomProductAmenity[]> {
    const { reservations, hotelId } = filter;
    const roomProductIds = reservations.map((reservation) => reservation.roomProductId);
    const [roomProductExtras, hotelAmenities] = await Promise.all([
      this.roomProductExtraRepository.findAll({
        roomProductIds: roomProductIds,
        hotelIds: [hotelId]
      }),
      this.hotelAmenityRepository.getBookingHotelAmenities({ hotelId: hotelId })
    ]);

    const result: BookingRoomProductAmenity[] = [];

    for (const reservation of reservations) {
      const extras = roomProductExtras.filter(
        (extra) => extra.roomProductId === reservation.roomProductId
      );

      const includedIds = new Set<string>();
      const extraIds = new Set<string>();
      const mandatoryIds = new Set<string>();
      for (const extra of extras) {
        if (extra.type === RoomProductExtraType.INCLUDED) {
          includedIds.add(extra.extrasId);
        } else if (extra.type === RoomProductExtraType.EXTRA) {
          extraIds.add(extra.extrasId);
        } else if (extra.type === RoomProductExtraType.MANDATORY) {
          mandatoryIds.add(extra.extrasId);
        }
      }

      for (const extra of extras) {
        if (
          includedIds.has(extra.extrasId) &&
          mandatoryIds.has(extra.extrasId) &&
          extraIds.has(extra.extrasId)
        ) {
          mandatoryIds.delete(extra.extrasId);
          extraIds.delete(extra.extrasId);
        }

        if (mandatoryIds.has(extra.extrasId) && extraIds.has(extra.extrasId)) {
          extraIds.delete(extra.extrasId);
        }
      }
      const amenities: AmenityWithType[] = [];
      for (const hotelAmenity of hotelAmenities) {
        if (includedIds.has(hotelAmenity.id)) {
          amenities.push({
            ...hotelAmenity,
            ratePlanExtraServiceType: RatePlanExtraServiceType.INCLUDED
          });
        } else if (extraIds.has(hotelAmenity.id)) {
          amenities.push({
            ...hotelAmenity,
            ratePlanExtraServiceType: RatePlanExtraServiceType.EXTRA
          });
        } else if (mandatoryIds.has(hotelAmenity.id)) {
          amenities.push({
            ...hotelAmenity,
            ratePlanExtraServiceType: RatePlanExtraServiceType.MANDATORY
          });
        }
      }

      result.push({
        roomProductId: reservation.roomProductId,
        index: reservation.index,
        amenities: amenities
      });
    }

    return result;
  }

  combineBookingAmenities(filter: {
    ratePlanAmenities: AmenityWithType[];
    roomProductAmenities: AmenityWithType[];
    hotelAmenities: HotelAmenity[];
  }): {
    included: AmenityWithType[];
    extra: AmenityWithType[];
    mandatory: AmenityWithType[];
  } {
    const { ratePlanAmenities, roomProductAmenities, hotelAmenities } = filter;

    const roomProductIncludedIds = roomProductAmenities
      .filter((amenity) => amenity.ratePlanExtraServiceType === RatePlanExtraServiceType.INCLUDED)
      .map((amenity) => amenity.id);

    const roomProductExtraIds = roomProductAmenities
      .filter((amenity) => amenity.ratePlanExtraServiceType === RatePlanExtraServiceType.EXTRA)
      .map((amenity) => amenity.id);

    const roomProductMandatoryIds = roomProductAmenities
      .filter((amenity) => amenity.ratePlanExtraServiceType === RatePlanExtraServiceType.MANDATORY)
      .map((amenity) => amenity.id);

    const ratePlanIncludedIds = ratePlanAmenities
      .filter((amenity) => amenity.ratePlanExtraServiceType === RatePlanExtraServiceType.INCLUDED)
      .map((amenity) => amenity.id);

    const ratePlanExtraIds = ratePlanAmenities
      .filter((amenity) => amenity.ratePlanExtraServiceType === RatePlanExtraServiceType.EXTRA)
      .map((amenity) => amenity.id);

    const ratePlanMandatoryIds = ratePlanAmenities
      .filter((amenity) => amenity.ratePlanExtraServiceType === RatePlanExtraServiceType.MANDATORY)
      .map((amenity) => amenity.id);

    const includedIds = new Set<string>([...ratePlanIncludedIds]);
    const extraIds = new Set<string>([...ratePlanExtraIds]);
    const mandatoryIds = new Set<string>([...ratePlanMandatoryIds]);

    for (const roomProductMandatoryId of roomProductMandatoryIds) {
      if (includedIds.has(roomProductMandatoryId)) {
        includedIds.delete(roomProductMandatoryId);
      }

      if (extraIds.has(roomProductMandatoryId)) {
        extraIds.delete(roomProductMandatoryId);
      }

      mandatoryIds.add(roomProductMandatoryId);
    }

    for (const roomProductIncludedId of roomProductIncludedIds) {
      if (mandatoryIds.has(roomProductIncludedId)) {
        mandatoryIds.delete(roomProductIncludedId);
      }

      if (extraIds.has(roomProductIncludedId)) {
        extraIds.delete(roomProductIncludedId);
      }

      includedIds.add(roomProductIncludedId);
    }

    for (const roomProductExtraId of roomProductExtraIds) {
      if (!includedIds.has(roomProductExtraId) && !mandatoryIds.has(roomProductExtraId)) {
        extraIds.add(roomProductExtraId);
      }
    }

    const ratePlanAmenityMap = groupByToMapSingle(ratePlanAmenities, (amenity) => amenity.id);

    return {
      included: hotelAmenities
        .filter((amenity) => includedIds.has(amenity.id))
        .map((amenity) => {
          const isRatePlanAmenity =
            ratePlanIncludedIds.includes(amenity.id) &&
            !roomProductIncludedIds.includes(amenity.id);

          if (isRatePlanAmenity) {
            const ratePlanAmenity = ratePlanAmenityMap.get(amenity.id);

            return {
              ...amenity,
              ratePlanExtraServiceType: RatePlanExtraServiceType.INCLUDED,
              includedDates: ratePlanAmenity?.includedDates
            };
          }

          return {
            ...amenity,
            ratePlanExtraServiceType: RatePlanExtraServiceType.INCLUDED
          };
        }),
      extra: hotelAmenities
        .filter((amenity) => extraIds.has(amenity.id))
        .map((amenity) => ({
          ...amenity,
          ratePlanExtraServiceType: RatePlanExtraServiceType.EXTRA
        })),
      mandatory: hotelAmenities
        .filter((amenity) => mandatoryIds.has(amenity.id))
        .map((amenity) => ({
          ...amenity,
          ratePlanExtraServiceType: RatePlanExtraServiceType.MANDATORY
        }))
    };
  }

  getRatePlanAmenityDailyOrDefault(filter: {
    ratePlanId: string;
    dates: string[];
    ratePlanExtraServices: RatePlanExtraService[];
    dailyExtraServices: RatePlanDailyExtraService[];
    hotelAmenities: HotelAmenity[];
    ratePlanDerivedSetting?: RatePlanDerivedSetting;
  }): {
    extraIdMap: Map<string, string[]>;
    includedIdMap: Map<string, string[]>;
    mandatoryIdMap: Map<string, string[]>;
  } {
    const { ratePlanId, dates, ratePlanExtraServices, dailyExtraServices, hotelAmenities } = filter;

    const extraIdMap = new Map<string, string[]>();
    const includedIdMap = new Map<string, string[]>();
    const mandatoryIdMap = new Map<string, string[]>();

    for (const extraService of ratePlanExtraServices) {
      const amenity = hotelAmenities.find((amenity) => amenity.id === extraService.extrasId);
      if (extraService.type === RatePlanExtraServiceType.EXTRA && amenity) {
        extraIdMap.set(amenity.id, dates);
      }
      // if (extraService.type === RatePlanExtraServiceType.INCLUDED && amenity) {
      //   includedIds.add(amenity.id);
      // }
      if (extraService.type === RatePlanExtraServiceType.MANDATORY && amenity) {
        mandatoryIdMap.set(amenity.id, dates);
      }
    }

    const ratePlanDailyExtraServiceMap = groupByToMapSingle(
      dailyExtraServices,
      (service) => service.date
    );
    const defaultRatePlanIncludedIds = Array.from(
      new Set(
        ratePlanExtraServices
          .filter((service) => service.type === RatePlanExtraServiceType.INCLUDED)
          .map((service) => service.extrasId)
      )
    );

    for (const date of dates) {
      const findDailyExtraService = ratePlanDailyExtraServiceMap.get(date);

      let findIncludedIds: string[] = [];

      if (findDailyExtraService) {
        const amenities = hotelAmenities.filter((amenity) =>
          findDailyExtraService.extraServiceCodeList.includes(amenity.code)
        );
        findIncludedIds = amenities.map((amenity) => amenity.id);
      } else {
        findIncludedIds.push(...defaultRatePlanIncludedIds);
      }

      for (const includedId of findIncludedIds) {
        if (mandatoryIdMap.has(includedId)) {
          mandatoryIdMap.delete(includedId);
        }
        if (extraIdMap.has(includedId)) {
          extraIdMap.delete(includedId);
        }
        const existing = includedIdMap.get(includedId) || [];
        existing.push(date);
        includedIdMap.set(includedId, existing);
      }
    }

    return { extraIdMap, includedIdMap, mandatoryIdMap };
  }
}
