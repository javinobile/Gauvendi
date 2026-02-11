import { HotelAmenity } from "@src/core/entities/hotel-entities/hotel-amenity.entity";
import { RoomProduct } from "@src/core/entities/room-product.entity";

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

export interface CalculateExtraBedInput {
  hotelAmenities: HotelAmenity[];
  roomProduct: RoomProduct;
  adult: number;
  childrenAges: number[];
  pets: number;
}

export interface CalculateExtraBedResult {
  totalExtraBedRate: number;
  includedPetAmenity: HotelAmenity | undefined;
}

