import { Injectable } from '@nestjs/common';

export interface CalculateAllocateCapacityInput {
  capacityDefault?: number;
  maximumAdult?: number;
  maximumChild?: number;
  requestedAdult: number;
  requestedChild: number;
  requestedPet: number;
}

export interface CalculateAllocateCapacityResult {
  allocatedAdultCount: number;
  allocatedChildCount: number;
  allocatedExtraBedAdultCount: number;
  allocatedExtraBedChildCount: number;
  allocatedPetCount: number;
}

@Injectable()
export class CalculateAllocationService {
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
