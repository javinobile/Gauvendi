import { RoomProduct } from '@src/core/entities/room-product.entity';
import { IsePricingDisplayModeEnum, RoomProductType, TaxSettingEnum } from '@src/core/enums/common';
import { RoomRequestDto } from './ise-recommendation.dto';

export class RoomRequestUtils {
  public static split(inputRoomRequestList: RoomRequestDto[]): RoomRequestDto[] {
    let sumAdults = 0;
    const sumChildrenAgeList: number[] = [];
    let sumPets = 0;

    // ✅ single pass to compute totals
    for (const rr of inputRoomRequestList) {
      if (rr.adult && rr.adult > 0) {
        sumAdults += rr.adult;
      }
      if (rr.childrenAgeList && rr.childrenAgeList.length > 0) {
        sumChildrenAgeList.push(...rr.childrenAgeList);
      }
      if (rr.pets && rr.pets > 0) {
        sumPets += rr.pets;
      }
    }

    let numberOfRooms = Math.ceil((sumAdults + sumChildrenAgeList.length) / 2);
    numberOfRooms = Math.min(numberOfRooms, sumAdults);

    const adultsEachRooms = Math.floor(sumAdults / numberOfRooms);
    const childrenEachRooms =
      Math.floor(sumChildrenAgeList.length / numberOfRooms) ||
      (inputRoomRequestList.length === 0 ? 0 : 1);
    const petsEachRooms = Math.floor(sumPets / numberOfRooms) || (sumPets === 0 ? 0 : 1);

    const splitedRoomRequestList: RoomRequestDto[] = [];
    let remainingAdults = sumAdults;
    let childIndex = 0;
    let petRemaining = sumPets;

    for (let i = 0; i < numberOfRooms; i++) {
      const childrenAgeList: number[] = [];
      let adults = 0;
      let pets = 0;

      if (i === numberOfRooms - 1) {
        // last room takes leftovers
        adults = remainingAdults;
        childrenAgeList.push(...sumChildrenAgeList.slice(childIndex));
        pets = petRemaining;
      } else {
        adults = adultsEachRooms;
        childrenAgeList.push(
          ...sumChildrenAgeList.slice(childIndex, childIndex + childrenEachRooms)
        );
        childIndex += childrenEachRooms;

        pets = Math.min(petsEachRooms, petRemaining);
        petRemaining -= pets;
      }

      splitedRoomRequestList.push({
        adult: adults,
        childrenAgeList,
        pets
      });

      remainingAdults -= adults;
    }

    return splitedRoomRequestList;
  }

  public static calculateGuestCounts(roomRequestList: RoomRequestDto[]): {
    totalAdults: number;
    totalChildren: number;
    requestedCapacity: number;
    totalPets: number;
    childrenAgeList: number[];
  } {
    // Calculate guest counts
    let totalAdults = 0;
    let totalChildren = 0;
    let requestedCapacity = 0;
    let totalPets = 0;
    let childrenAgeList: number[] = [];

    for (const rr of roomRequestList) {
      if (rr.adult && rr.adult > 0) {
        totalAdults += rr.adult;
      }
      if (rr.childrenAgeList && rr.childrenAgeList.length > 0) {
        totalChildren += rr.childrenAgeList.length;
        childrenAgeList.push(...rr.childrenAgeList);
      }
      if (rr.pets && rr.pets > 0) {
        totalPets += rr.pets;
      }
    }

    requestedCapacity = totalAdults + totalChildren;

    return { totalAdults, totalChildren, requestedCapacity, totalPets, childrenAgeList };
  }

  public static getLowestPriceType(
    roomProductWithBaseSetting: any[],
    allLowestPriceRoomProductType: Map<RoomProductType, boolean>
  ): RoomProduct | null {
    if (!roomProductWithBaseSetting.length) return null;

    // Sort by price ascending
    const sorted = [...roomProductWithBaseSetting].sort(
      (a, b) =>
        (a.roomProductBasePriceSetting?.rate ?? Infinity) -
        (b.roomProductBasePriceSetting?.rate ?? Infinity)
    );

    // Find lowest rate
    let lowestPriceItem: RoomProduct | null = null;
    for (const item of sorted) {
      if (item.roomProductBasePriceSetting?.rate && allLowestPriceRoomProductType.get(item.type)) {
        lowestPriceItem = item;
        break;
      }
    }

    // Collect all products with that lowest rate
    const lowestProducts = sorted.find(
      (item) =>
        item.roomProductBasePriceSetting?.rate ===
          lowestPriceItem?.roomProductBasePriceSetting?.rate &&
        allLowestPriceRoomProductType.get(item.type)
    );

    // If multiple → return the last one
    return lowestProducts ?? null;
  }

  public static calculateAdjustmentPercentage(
    isePricingDisplayMode: IsePricingDisplayModeEnum,
    totalBaseAmount: number,
    totalBaseAmountBeforeAdjustment: number,
    totalGrossAmount: number,
    totalGrossAmountBeforeAdjustment: number
  ): number {
    let rateAfterAdjustment: number;
    let rateBeforeAdjustment: number;
    if (isePricingDisplayMode === 'INCLUSIVE' as any) {
      rateAfterAdjustment = totalGrossAmount;
      rateBeforeAdjustment = totalGrossAmountBeforeAdjustment;
    } else {
      rateAfterAdjustment = totalBaseAmount;
      rateBeforeAdjustment = totalBaseAmountBeforeAdjustment;
    }
    const isAdjustmentUp = rateAfterAdjustment > rateBeforeAdjustment;
    let adjustmentPercentageRatio = 0;
    if (isAdjustmentUp) {
      if (rateAfterAdjustment > 0) {
        adjustmentPercentageRatio = rateBeforeAdjustment / rateAfterAdjustment;
      }
    } else {
      if (rateBeforeAdjustment > 0) {
        adjustmentPercentageRatio = rateAfterAdjustment / rateBeforeAdjustment;
      }
    }

    return (isAdjustmentUp ? 1 : -1) * (100 - adjustmentPercentageRatio * 100);
  }

  /**
   * Get the lowest price from availableRfcList
   * @param availableRfcList Array of room products with rfcRatePlanList
   * @returns The lowest price found across all room products and rate plans, or null if no valid price found
   */
  public static getLowestPriceFromAvailableRfcList(availableRfcList: any[]): number | null {
    if (!availableRfcList || availableRfcList.length === 0) {
      return null;
    }

    let lowestPrice = Infinity;

    for (const roomProduct of availableRfcList) {
      if (roomProduct.rfcRatePlanList && roomProduct.rfcRatePlanList.length > 0) {
        for (const ratePlan of roomProduct.rfcRatePlanList) {
          if (ratePlan && 
              ratePlan.totalSellingRate !== undefined && 
              ratePlan.totalSellingRate !== null && 
              !isNaN(ratePlan.totalSellingRate)) {
            lowestPrice = Math.min(lowestPrice, Number(ratePlan.totalSellingRate));
          }
        }
      }
    }

    return lowestPrice === Infinity ? null : lowestPrice;
  }

  /**
   * Get the room product with the lowest rate plan price
   * @param availableRfcList Array of room products with rfcRatePlanList
   * @returns The room product that contains the lowest priced rate plan, or null if none found
   */
  public static getLowestPriceRoomProduct(availableRfcList: any[]): any | null {
    if (!availableRfcList || availableRfcList.length === 0) {
      return null;
    }

    let lowestPriceRoomProduct = null;
    let lowestPrice = Infinity;

    for (const roomProduct of availableRfcList) {
      if (roomProduct.rfcRatePlanList && roomProduct.rfcRatePlanList.length > 0) {
        // Get the lowest price from this room product's rate plans
        // (they're already sorted by price in ascending order)
        const cheapestRatePlan = roomProduct.rfcRatePlanList.find(rp => 
          rp && 
          rp.totalSellingRate !== undefined && 
          rp.totalSellingRate !== null && 
          !isNaN(rp.totalSellingRate)
        );
        
        if (cheapestRatePlan && Number(cheapestRatePlan.totalSellingRate) < lowestPrice) {
          lowestPrice = Number(cheapestRatePlan.totalSellingRate);
          lowestPriceRoomProduct = roomProduct;
        }
      }
    }

    return lowestPriceRoomProduct;
  }

  /**
   * Get detailed information about the lowest price option
   * @param availableRfcList Array of room products with rfcRatePlanList
   * @returns Object containing the lowest price, room product, and rate plan details, or null if none found
   */
  public static getLowestPriceDetails(availableRfcList: any[], allLowestPriceRoomProductType: Map<RoomProductType, boolean>): {
    price: number;
    roomProduct: any;
    ratePlan: any;
  } | null {
    if (!availableRfcList || availableRfcList.length === 0) {
      return null;
    }

    let lowestPrice = Infinity;
    let lowestPriceRoomProduct = null;
    let lowestPriceRatePlan = null;

    for (const roomProduct of availableRfcList) {
      if (!allLowestPriceRoomProductType.get(roomProduct.type)) {
        continue;
      }
      if (roomProduct.rfcRatePlanList && roomProduct.rfcRatePlanList.length > 0) {
        for (const ratePlan of roomProduct.rfcRatePlanList) {
          if (ratePlan && 
              ratePlan.totalSellingRate !== undefined && 
              ratePlan.totalSellingRate !== null && 
              !isNaN(ratePlan.totalSellingRate)) {
            const price = Number(ratePlan.totalSellingRate);
            if (price < lowestPrice) {
              lowestPrice = price;
              lowestPriceRoomProduct = roomProduct;
              lowestPriceRatePlan = ratePlan;
            }
          }
        }
      }
    }

    if (lowestPrice === Infinity) {
      return null;
    }

    return {
      price: lowestPrice,
      roomProduct: lowestPriceRoomProduct,
      ratePlan: lowestPriceRatePlan
    };
  }

  public static canFulfillRequest(product: RoomProduct, adults: number, children: number, pets: number): boolean {
    const maxPet = (product.maximumPet || 0);
    if (pets > maxPet) return false;

    const maxDefaultCapacity = (product.capacityDefault || 0);
    const maxExtraBeds = (product.capacityExtra || 0);

    const maxAdultDefault = (product.maximumAdult);
    const maxChildDefault = (product.maximumKid);
    const maxExtraBedAdult = (product.extraBedAdult);
    const maxExtraBedChild = (product.extraBedKid);

    const isCapacityExceeded = adults + children > maxDefaultCapacity + maxExtraBeds;
    const isAdultExceeded = adults > maxAdultDefault + maxExtraBedAdult;
    const isChildExceeded = children > maxChildDefault + maxExtraBedChild;

    if (isCapacityExceeded || isAdultExceeded || isChildExceeded) {
      return false;
    }

    const allocatedAdultDefault = Math.min(adults, maxAdultDefault);
    const allocatedExtraAdult = adults - allocatedAdultDefault;

    const capacityLeft = maxDefaultCapacity - allocatedAdultDefault;
    const extraBedsLeft = maxExtraBeds - allocatedExtraAdult;

    const allocatedChildDefault = Math.min(capacityLeft, Math.min(children, maxChildDefault));
    const remainingChild = children - allocatedChildDefault;
    const allocatedExtraChild = Math.min(extraBedsLeft, Math.min(remainingChild, maxExtraBedChild));

    if (children == allocatedChildDefault + allocatedExtraChild) {
      product.allocatedAdultCount = allocatedAdultDefault || 0;
      product.allocatedExtraBedAdultCount = allocatedExtraAdult || 0;
      product.allocatedChildCount = allocatedChildDefault || 0;
      product.allocatedExtraBedChildCount = allocatedExtraChild || 0;
      product.allocatedPetCount = pets || 0;
      return true;
    }
    return false;
  }
}

