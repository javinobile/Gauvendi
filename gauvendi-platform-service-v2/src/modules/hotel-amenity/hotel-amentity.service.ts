import { Injectable } from '@nestjs/common';
import {
  AmenityTypeEnum,
  HotelAmenity
} from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import {
  RatePlanExtraService,
  RatePlanExtraServiceType
} from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import { ResponseStatusEnum, RoomProductExtraType } from '@src/core/enums/common';
import { CalculateAllocateCapacityResult } from '@src/core/modules/pricing-calculate/dtos/calculate-extra-bed.dto';
import { PmsService } from '../pms/pms.service';
import { HotelAmenityInputDto } from '../hotel/dtos/hotel-amenity-filter.dto';
import { BadRequestException } from '@src/core/exceptions';
import { HotelAmenityRepository } from './repositories/hotel-amenity.repository';

export const EXTRA_BED_ADULT_AMENITY_CODE = 'EXTRA_BED_ADULT';
export const EXTRA_BED_KID_AMENITY_CODE = 'EXTRA_BED_KID';
export const PET_AMENITY_CODE = 'PET_SURCHARGE';

@Injectable()
export class HotelAmenityService {
  constructor(
    private readonly pmsService: PmsService,
    private readonly hotelAmenityRepository: HotelAmenityRepository
  ) {}

  getAllowSurchargeAmenities(
    hotelAmenities: HotelAmenity[],
    calculateAllocateCapacityResult: CalculateAllocateCapacityResult
  ) {
    const extraBedKidAmenity = hotelAmenities.find(
      (a) => a.amenityType === AmenityTypeEnum.EXTRA_BED && a.code === EXTRA_BED_KID_AMENITY_CODE
    );
    const extraBedAdultAmenity = hotelAmenities.find(
      (a) => a.amenityType === AmenityTypeEnum.EXTRA_BED && a.code === EXTRA_BED_ADULT_AMENITY_CODE
    );

    const petAmenity = hotelAmenities.find((a) => a.code === PET_AMENITY_CODE);

    const { allocatedExtraBedAdultCount, allocatedExtraBedChildCount, allocatedPetCount } =
      calculateAllocateCapacityResult;

    const extraAdult =
      allocatedExtraBedAdultCount && allocatedExtraBedAdultCount > 0
        ? allocatedExtraBedAdultCount
        : 0;

    const extraKid =
      allocatedExtraBedChildCount && allocatedExtraBedChildCount > 0
        ? allocatedExtraBedChildCount
        : 0;

    const allocatedPets = allocatedPetCount && allocatedPetCount > 0 ? allocatedPetCount : 0;

    const result: HotelAmenity[] = [];
    if (extraAdult > 0 && extraBedAdultAmenity) {
      result.push({ ...extraBedAdultAmenity, count: extraAdult });
    }
    if (extraKid > 0 && extraBedKidAmenity) {
      result.push({ ...extraBedKidAmenity, count: extraKid });
    }
    if (allocatedPets > 0 && petAmenity) {
      result.push({ ...petAmenity, count: allocatedPets });
    }

    return result;
  }

  getExtraServicesByType(
    hotelAmenities: HotelAmenity[],
    ratePlanExtraServices: RatePlanExtraService[],
    roomProductExtras: RoomProductExtra[],
    types: (RatePlanExtraServiceType | RoomProductExtraType)[]
  ) {
    const ratePlanIncluded = ratePlanExtraServices.filter((service) =>
      types.includes(service.type)
    );
    const roomProductIncluded = roomProductExtras.filter((service) => types.includes(service.type));

    if (ratePlanIncluded.length === 0 && roomProductIncluded.length === 0) {
      return [];
    }

    const extraServiceIds = Array.from(
      new Set([
        ...ratePlanIncluded.map((service) => service.extrasId),
        ...roomProductIncluded.map((service) => service.extrasId)
      ])
    );

    return hotelAmenities.filter((amenity) => extraServiceIds.includes(amenity.id));
  }

  async getPmsAmenityList(hotelId: string) {
    return await this.pmsService.getPmsAmenityList(hotelId);
  }

  async updateHotelAmenityList(amenityList: HotelAmenityInputDto[]) {
    try {
      const input: Partial<HotelAmenity> & Pick<HotelAmenity, 'id'>[] = amenityList
        .map((item) => {
          const newItem: Partial<HotelAmenity> & Pick<HotelAmenity, 'id'> = {
            id: item.id || '',
            mappingHotelAmenityCode: item.mappingHotelAmenityCode,
            hotelId: item.hotelId
          };
          return newItem;
        })
        ?.filter((item) => item.id);
      await this.hotelAmenityRepository.updateHotelAmenityList(input);
      return {
        status: ResponseStatusEnum.SUCCESS,
        message: 'Hotel amenity list updated successfully',
        data: true
      };
    } catch (error) {
      throw new BadRequestException('Unable to update hotel amenity list');
    }
  }
}
