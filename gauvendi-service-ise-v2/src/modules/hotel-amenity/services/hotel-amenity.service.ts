import { Injectable } from '@nestjs/common';
import {
  AmenityTypeEnum,
  HotelAmenity
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import {
  RatePlanExtraService,
  RatePlanExtraServiceType
} from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import {
  RoomProductExtra,
  RoomProductExtraType
} from 'src/core/entities/room-product-extra.entity';
import { BadRequestException, NotFoundException } from 'src/core/exceptions';
import { S3Service } from 'src/core/s3/s3.service';
import { CalculateAllocateCapacityResult } from 'src/core/services/calculate-allocation.service';
import { HotelRepository } from 'src/modules/hotel-v2/repositories/hotel.repository';
import { HotelAmenityFilterDto, HotelAmenityResponseDto } from '../dtos/hotel-amenity.dto';
import { HotelAmenityRepository } from '../repositories/hotel-amenity.repository';

export const EXTRA_BED_ADULT_AMENITY_CODE = 'EXTRA_BED_ADULT';
export const EXTRA_BED_KID_AMENITY_CODE = 'EXTRA_BED_KID';
export const PET_AMENITY_CODE = 'PET_SURCHARGE';
export const surchargeChargeServiceCodes = [EXTRA_BED_ADULT_AMENITY_CODE, EXTRA_BED_KID_AMENITY_CODE, PET_AMENITY_CODE];


@Injectable()
export class HotelAmenityService {
  constructor(
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly hotelRepository: HotelRepository,
    private readonly s3Service: S3Service
  ) {}

  async getHotelAmenity(filter: HotelAmenityFilterDto): Promise<HotelAmenityResponseDto[]> {
    try {
      let currentHotelId = filter.hotelId;
      if (filter.hotelCode) {
        const hotel = await this.hotelRepository.getHotel({ hotelCode: filter.hotelCode });
        if (!hotel) {
          throw new NotFoundException('Hotel not found');
        }

        currentHotelId = hotel.id;
      }
      filter.hotelId = currentHotelId;
      filter.relations = ['hotelAmenityPrices', 'hotelAmenityPrice.hotelAgeCategory'];

      const result = await this.hotelAmenityRepository.getHotelAmenity(filter);
      const mappedResult = await this.mapHotelAmenity(result);
      return mappedResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getSurchargeAmenities(filter: HotelAmenityFilterDto): Promise<HotelAmenityResponseDto[]> {
    filter.amenityType = AmenityTypeEnum.EXTRA_BED; // surcharge = extra bed
    const result = await this.getHotelAmenity(filter);
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

    const extraServiceIds = Array.from( new Set([
      ...ratePlanIncluded.map((service) => service.extrasId),
      ...roomProductIncluded.map((service) => service.extrasId)
    ]))

    return hotelAmenities.filter((amenity) => extraServiceIds.includes(amenity.id));
  }

  getAmenitiesByAmenityType(hotelAmenities: HotelAmenity[], types: AmenityTypeEnum[]) {
    return hotelAmenities.filter((amenity) => types.includes(amenity.amenityType));
  }

  private async mapHotelAmenity(result: HotelAmenity[]): Promise<HotelAmenityResponseDto[]> {
    const imageUrlPromises = result.map(async (item) => {
      if (item.iconImageUrl) {
        return await this.s3Service.getPreSignedUrl(item.iconImageUrl);
      }
      return null;
    });

    const imageUrls = await Promise.all(imageUrlPromises);

    return result.map((item, index) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      description: item.description,
      iconImageUrl: imageUrls[index] || null,
      amenityType: item.amenityType,
      pricingUnit: item.pricingUnit,
      baseRate: item.baseRate ? Number(item.baseRate) : null,
      isePricingDisplayMode: item.isePricingDisplayMode,
      hotelAmenityPriceList: item.hotelAmenityPrices?.map((hotelAmenityPrice) => ({
        price: hotelAmenityPrice.price ? Number(hotelAmenityPrice.price) : null,
        hotelAgeCategory: {
          code: hotelAmenityPrice.hotelAgeCategory?.code,
          name: hotelAmenityPrice.hotelAgeCategory?.name,
          fromAge: hotelAmenityPrice.hotelAgeCategory?.fromAge,
          toAge: hotelAmenityPrice.hotelAgeCategory?.toAge
        }
      })),
      totalBaseAmount: null,
      totalGrossAmount: null
    }));
  }

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
}
