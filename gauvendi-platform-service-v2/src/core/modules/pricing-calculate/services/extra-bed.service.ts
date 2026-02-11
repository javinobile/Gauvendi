import { Injectable } from '@nestjs/common';
import {
  AmenityTypeEnum,
  HotelAmenity
} from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { HotelAgeCategoryCodeEnum } from '@src/core/enums/common';
import { Decimal } from 'decimal.js';
import {
  CalculateAllocateCapacityInput,
  CalculateAllocateCapacityResult,
  CalculateExtraBedInput
} from '../dtos/calculate-extra-bed.dto';

const EXTRA_BED_ADULT_AMENITY_CODE = 'EXTRA_BED_ADULT';
const EXTRA_BED_KID_AMENITY_CODE = 'EXTRA_BED_KID';
const PET_AMENITY_CODE = 'PET_SURCHARGE';

@Injectable()
export class ExtraBedCalculateService {
  calculateExtraBed(input: CalculateExtraBedInput) {
    const { hotelAmenities, roomProduct, adult, childrenAges, pets } = input;
    const sortedChildAgeList = [...childrenAges].sort((a, b) => a - b);
    const extraBedKidAmenity = hotelAmenities.find(
      (a) => a.amenityType === AmenityTypeEnum.EXTRA_BED && a.code === EXTRA_BED_KID_AMENITY_CODE
    );
    const extraBedAdultAmenity = hotelAmenities.find(
      (a) => a.amenityType === AmenityTypeEnum.EXTRA_BED && a.code === EXTRA_BED_ADULT_AMENITY_CODE
    );

    const extraBedAdultRate = Number(
      extraBedAdultAmenity?.hotelAmenityPrices.find(
        (p) => p.hotelAgeCategory.code === HotelAgeCategoryCodeEnum.DEFAULT
      )?.price ?? 0
    );

    const petAmenity = hotelAmenities.find((a) => a.code === PET_AMENITY_CODE);

    const extraBedKidPrices = extraBedKidAmenity?.hotelAmenityPrices ?? [];

    const { allocatedExtraBedAdultCount, allocatedExtraBedChildCount, allocatedPetCount } =
      this.calculateAllocateCapacity({
        capacityDefault: roomProduct.capacityDefault,
        maximumAdult: roomProduct.maximumAdult,
        maximumChild: roomProduct.maximumKid,
        requestedAdult: adult,
        requestedChild: childrenAges.length,
        requestedPet: pets
      });
    const extraAdult =
      allocatedExtraBedAdultCount && allocatedExtraBedAdultCount > 0
        ? allocatedExtraBedAdultCount
        : 0;

    const extraKid =
      allocatedExtraBedChildCount && allocatedExtraBedChildCount > 0
        ? allocatedExtraBedChildCount
        : 0;

    const extraAdultRate = Decimal(extraBedAdultRate).mul(extraAdult).toNumber();

    let extraKidRate = 0;

    if (extraKid > 0) {
      for (let i = 0; i < allocatedExtraBedChildCount; i++) {
        const childAge = sortedChildAgeList[i];

        let extraBedKidPrice = extraBedKidPrices.find(
          (p) =>
            p.hotelAgeCategory.fromAge <= childAge &&
            p.hotelAgeCategory.toAge > childAge &&
            p.hotelAgeCategory.code !== HotelAgeCategoryCodeEnum.DEFAULT
        );

        if (!extraBedKidPrice) {
          extraBedKidPrice = extraBedKidPrices.find(
            (p) => p.hotelAgeCategory.code === HotelAgeCategoryCodeEnum.DEFAULT
          );
        }

        const pricingForChild = extraBedKidPrice ? Number(extraBedKidPrice.price) : null;

        if (pricingForChild) {
          extraKidRate += pricingForChild;
        }
      }
    }

    let includedPetAmenity: HotelAmenity | undefined = undefined;

    const allocatedPets = allocatedPetCount && allocatedPetCount > 0 ? allocatedPetCount : 0;
    if (allocatedPets > 0 && petAmenity) {
      includedPetAmenity = petAmenity;
    }

    const totalExtraBedRate = extraAdultRate + extraKidRate;

    return { totalExtraBedRate, includedPetAmenity };
  }

  availableRoomProductCapacity(input: {
    roomProduct: RoomProduct;
    adult: number;
    childrenAges: number[];
    pets: number;
  }) {
    const { roomProduct, adult, childrenAges, pets } = input;
    const requiredAdult = adult ?? 1;
    const requiredChildren = childrenAges != null ? childrenAges.length : 0;
    const requiredPets = pets ?? 0;

    const maxAdult = (roomProduct.maximumAdult || 0) + (roomProduct.extraBedAdult || 0);
    const maxChildren = (roomProduct.maximumKid || 0) + (roomProduct.extraBedKid || 0);
    const maxCap = (roomProduct.capacityDefault || 0) + (roomProduct.capacityExtra || 0);

    if (
      maxAdult >= requiredAdult &&
      maxChildren >= requiredChildren &&
      maxCap >= requiredAdult + requiredChildren
    ) {
      return null;
    }

    return this.calculateAllocateCapacity({
      capacityDefault: roomProduct.capacityDefault,
      maximumAdult: roomProduct.maximumAdult,
      maximumChild: roomProduct.maximumKid,
      requestedAdult: requiredAdult,
      requestedChild: requiredChildren,
      requestedPet: requiredPets
    });
  }

  calculateAllocateCapacity(
    input: CalculateAllocateCapacityInput
  ): CalculateAllocateCapacityResult {
    // Step 1: Get capacity default with null safety
    let capacityDefault = input.capacityDefault ?? 0;

    // Step 2: Get maximum adult and child with null safety
    const maximumAdult = input.maximumAdult ?? 0;
    const maximumChild = input.maximumChild ?? 0; // maximumKid is equivalent to maximumChild

    // Step 3: Adjust capacity default to not exceed maximum adult + child
    capacityDefault = Math.min(capacityDefault, maximumAdult + maximumChild);

    // Step 4: Calculate extra bed requirements for adults
    const extraBedAdult =
      input.requestedAdult > maximumAdult ? input.requestedAdult - maximumAdult : 0;

    // Step 5: Calculate initial extra bed requirements for children
    let extraBedChild =
      input.requestedChild > maximumChild ? input.requestedChild - maximumChild : 0;

    // Step 6: Adjust extra bed child if total requested exceeds capacity
    if (input.requestedAdult + input.requestedChild > capacityDefault) {
      const remainingRoomCapacity = capacityDefault - Math.min(input.requestedAdult, maximumAdult);
      const remainingChildCapacity = Math.min(remainingRoomCapacity, maximumChild);
      extraBedChild = Math.max(input.requestedChild - remainingChildCapacity, 0);
    }

    // Step 7: Calculate allocated counts
    const allocatedAdultCount = input.requestedAdult - extraBedAdult;
    const allocatedChildCount = input.requestedChild - extraBedChild;
    const allocatedExtraBedAdultCount = extraBedAdult;
    const allocatedExtraBedChildCount = extraBedChild;
    const allocatedPetCount = input.requestedPet;

    return {
      allocatedAdultCount,
      allocatedChildCount,
      allocatedExtraBedAdultCount,
      allocatedExtraBedChildCount,
      allocatedPetCount
    };
  }
}
