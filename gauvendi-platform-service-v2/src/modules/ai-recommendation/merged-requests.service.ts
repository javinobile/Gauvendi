import { Injectable, Logger } from '@nestjs/common';
import { CapacityDataFrame, CapacityScoreService } from './capacity-score.service';
import { RoomRequest } from './direct-product-pipeline.service';
import { CapacityData } from './postprocessing.utils';
import {
  DirectProcessExecuteError,
  DirectRoomProductAvailable
} from './recommendation-algorithm.types';

export interface PartitionResult {
  partition: number[][];
  rawCapacities: [number, number, number][];
  sortedCapacities: [number, number, number][];
  sortedMaximums: number[];
}

export interface MergedRequestsResult {
  mergedCapacityDfs: CapacityData[][][];
  mergedIndices: number[][][];
}

@Injectable()
export class MergedRequestsService {
  private readonly logger = new Logger(MergedRequestsService.name);

  constructor(private readonly capacityScoreService: CapacityScoreService) {}

  setPartitions<T>(arr: T[]): T[][][] {
    if (arr.length === 0) return [[]];
    const first = arr[0];
    const restPartitions = this.setPartitions(arr.slice(1));
    const result: T[][][] = [];

    for (const partition of restPartitions) {
      // Add first to an existing group
      for (let i = 0; i < partition.length; i++) {
        const newPartition = partition.map((g) => [...g]);
        newPartition[i].push(first);
        result.push(newPartition);
      }
      // Or create a new group with first
      result.push([[first], ...partition]);
    }

    return result;
  }

  /**
   * Generate all possible partitions of booking requests for merging.
   */
  generateAllPartitions(listRoomReq: RoomRequest[]): PartitionResult[] {
    try {
      const partitionsResult: PartitionResult[] = [];

      // Generate all partitions of indices [0..n-1]
      const partitions = this.setPartitions([...Array(listRoomReq.length).keys()]);

      for (const partition of partitions) {
        // Skip trivial partition: [[0], [1], ..., [n-1]]
        if (partition.length === listRoomReq.length) continue;

        // Groups: convert indices into booking requests
        const groups = partition.map((group) => group.map((idx) => listRoomReq[idx]));

        // Raw capacities per group
        const rawCapacities = groups.map((group) => {
          const adults = group.reduce((s, r) => s + r.adults, 0);
          const children = group.reduce((s, r) => s + r.children, 0);
          const pets = group.reduce((s, r) => s + r.pets, 0);
          return [adults, children, pets] as [number, number, number];
        });

        // Sort capacities descending
        const sortedCapacities = [...rawCapacities].sort((a, b) => {
          const sumA = a[0] + a[1] + a[2];
          const sumB = b[0] + b[1] + b[2];
          return sumB - sumA; // descending
        });

        // Maximums = adults + children
        const maximums = sortedCapacities.map((c) => c[0] + c[1]);
        const sortedMaximums = [...maximums].sort((a, b) => b - a);

        partitionsResult.push({
          partition,
          rawCapacities,
          sortedCapacities,
          sortedMaximums
        });
      }

      return partitionsResult;
    } catch (error) {
      this.logger.error(`Detail Error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  /**
   * Retrieve the room with the highest overall capacity.
   */
  getHighestCapacity(
    capacityData: CapacityDataFrame[]
  ): { maximum: number; adults: number; children: number; pets: number } | null {
    // Filter by ERFC type and sort by capacity metrics
    const erfcRooms = capacityData
      // .filter(room => room.type === 'ERFC') // ??
      .sort((a, b) => {
        const aTotal = a.adults + a.extraAdults + (a.children + a.extraChildren) + a.pets;
        const bTotal = b.adults + b.extraAdults + (b.children + b.extraChildren) + b.pets;
        return bTotal - aTotal;
      });

    if (erfcRooms.length === 0) {
      this.logger.warn('No rooms found with ERFC type. Returning empty highest capacity.');
      return null;
    }

    const highest = erfcRooms[0];
    return {
      maximum: highest.maximumDefaultCapacity + highest.maximumExtraCapacity,
      adults: highest.adults + highest.extraAdults,
      children: highest.children + highest.extraChildren,
      pets: highest.pets + highest.extraPets
    };
  }

  /**
   * Check if a merged group's capacity fits within available room capacity.
   */
  isValid(groupMaximum: number[], allowedMaximum: number): boolean {
    return groupMaximum.every((max) => max <= allowedMaximum);
  }

  /**
   * Check that no group contains just a single adult.
   */
  isNotSingleRequests(sortedCapacities: [number, number, number][]): boolean {
    return !sortedCapacities.some((capacity) => capacity[0] === 1);
  }

  /**
   * Count groups with an even number of adults.
   */
  countEventAdults(rawCapacities: [number, number, number][]): number {
    return rawCapacities.filter((capacity) => capacity[0] % 2 === 0).length;
  }

  /**
   * Filter merged booking requests to those that can be fulfilled by available rooms.
   */
  async getCapableMergedRequests(
    mergedRequestsData: PartitionResult[],
    roomProducts: DirectRoomProductAvailable[],
    saleStrategy: string[]
  ): Promise<{ validRequests: PartitionResult[]; capableDfs: CapacityData[][][] }> {
    const capableDfs: CapacityData[][][] = [];
    const validRequests: PartitionResult[] = [];

    for (const request of mergedRequestsData) {
      const cleanCapacityDfs: CapacityData[][] = [];
      let isCapable = true;

      // Check each merged group separately
      for (let i = 0; i < request.partition.length; i++) {
        const indices = request.partition[i];
        const capacity = request.rawCapacities[i];

        // Create booking request from merged capacity
        const bookingReq = {
          adults: capacity[0],
          children: capacity[1],
          pets: capacity[2],
          index: i
        };

        // Get possible room capacity matches
        const capacityResult = await this.capacityScoreService.capacityScore(
          roomProducts,
          bookingReq,
          i,
          {}
        );

        if (!capacityResult || capacityResult.length === 0) {
          isCapable = false;
          break;
        }

        // Filter by sale strategy
        const filteredCapacity = capacityResult.filter((room) => saleStrategy.includes(room.type));

        if (filteredCapacity.length === 0) {
          isCapable = false;
          break;
        }

        // Convert to CapacityData format and add merged indices
        const capacityWithIndices: CapacityData[] = filteredCapacity
          .filter((r) =>
            this.canFulfillRequest(r, bookingReq.adults, bookingReq.children, bookingReq.pets)
          )
          .map((r) => ({
            ...r,
            mergedIndices: indices,
            capacityScore:
              filteredCapacity.find((p) => r.productCode === p.productCode)?.capacityScore || 0
          })) as CapacityData[];

        cleanCapacityDfs.push(capacityWithIndices);
      }

      if (isCapable) {
        capableDfs.push(cleanCapacityDfs);
        validRequests.push(request);
      }
    }

    return { validRequests, capableDfs };
  }

  canFulfillRequest(
    room: CapacityDataFrame,
    adultsReq: number,
    childrenReq: number,
    petsReq: number
  ): boolean {
    const maxPet = room.pets || 0;
    if (petsReq > maxPet) return false;

    const maxDefaultCapacity = room.maximumDefaultCapacity || 0;
    const maxExtraBeds = room.maximumExtraCapacity || 0;

    const maxAdultDefault = room.adults;
    const maxChildDefault = room.children;
    const maxExtraBedAdult = room.extraAdults;
    const maxExtraBedChild = room.extraChildren;

    const isCapacityExceeded = adultsReq + childrenReq > maxDefaultCapacity + maxExtraBeds;
    const isAdultExceeded = adultsReq > maxAdultDefault + maxExtraBedAdult;
    const isChildExceeded = childrenReq > maxChildDefault + maxExtraBedChild;

    if (isCapacityExceeded || isAdultExceeded || isChildExceeded) {
      return false;
    }

    const allocatedAdultDefault = Math.min(adultsReq, maxAdultDefault);
    const allocatedExtraAdult = adultsReq - allocatedAdultDefault;

    const capacityLeft = maxDefaultCapacity - allocatedAdultDefault;
    const extraBedsLeft = maxExtraBeds - allocatedExtraAdult;

    const allocatedChildDefault = Math.min(capacityLeft, Math.min(childrenReq, maxChildDefault));
    const remainingChild = childrenReq - allocatedChildDefault;
    // const allocatedExtraChild = Math.min(extraBedsLeft, Math.min(remainingChild, maxExtraBedChild));

    // treat maximumExtraCapacity as flexible (allow any extra adults/children/pets to fit up to maximumExtraCapacity)
    const allocatedExtraChild = Math.min(extraBedsLeft, remainingChild);


    if (childrenReq == allocatedChildDefault + allocatedExtraChild) {
      room.allocatedDefaultAdults = allocatedAdultDefault || 0;
      room.allocatedExtraAdults = allocatedExtraAdult || 0;
      room.allocatedDefaultChildren = allocatedChildDefault || 0;
      room.allocatedExtraChildren = allocatedExtraChild || 0;
      room.allocatedDefaultPets = petsReq || 0;
      return true;
    }
    return false;
  }

  /**
   * Generate optimized merged booking requests to save room allocations.
   */
  async getMergedRequests(
    listRoomReq: RoomRequest[],
    listRoomProductAvailable: DirectRoomProductAvailable[],
    saleStrategy: string[]
  ): Promise<MergedRequestsResult> {
    try {
      // Build capacity data from available room products
      const capacityData: CapacityDataFrame[] = listRoomProductAvailable.map((item) => ({
        price: item.basePrice || 0,
        mergedIndices: [],
        productCode: item.code,
        type: item.type,
        allocationType: item.allocationType,
        spaceTypeList: item.spaceTypeList,
        isRestricted: item.isRestricted,
        adults: item.capacity.adults || 0,
        children: item.capacity.children || 0,
        pets: item.capacity.pets || 0,
        maximumDefaultCapacity: item.capacity.maximum || 0,
        maximumExtraCapacity: item.extraCapacity.maximum || 0,
        numberOfBedrooms: item.numberOfBedrooms || 0,
        extraAdults: item.extraCapacity.adults || 0,
        extraChildren: item.extraCapacity.children || 0,
        extraPets: item.extraCapacity.pets || 0,
        // # Merged capacity (default + extra),
        mergeAdults: item.capacity.adults + item.extraCapacity.adults || 0,
        mergeChildren: item.capacity.children + item.extraCapacity.children || 0,
        mergePets: item.capacity.pets + item.extraCapacity.pets || 0,

        // Available room details
        availableRoomDetails: (item?.availableRoomDetails || []).map((detail) => ({
          roomNumber: detail.roomNumber,
          roomFloor: detail.roomFloor,
          space: detail.space,
          building: detail.building,
        }))
      }));

      // Find the room with highest capacity
      const highestCapacity = this.getHighestCapacity(capacityData);
      if (!highestCapacity) {
        return { mergedCapacityDfs: [], mergedIndices: [] };
      }

      // Generate all possible ways to partition booking requests
      this.logger.log('Generate all partitions of booking_requests for merging.');
      const allMergeResults = this.generateAllPartitions(listRoomReq);

      // Filter out invalid merges
      let validMerges = allMergeResults.filter(
        (merge) =>
          this.isValid(merge.sortedMaximums, highestCapacity.maximum) &&
          this.isNotSingleRequests(merge.sortedCapacities)
      );

      // Sort and limit to top 4 merges
      validMerges = validMerges
        .sort((a, b) => {
          const aEvenAdults = this.countEventAdults(a.rawCapacities);
          const bEvenAdults = this.countEventAdults(b.rawCapacities);
          return bEvenAdults - aEvenAdults;
        })
        .slice(0, 4);

      if (validMerges.length === 0) {
        this.logger.warn('No valid merged requests found.');
        return { mergedCapacityDfs: [], mergedIndices: [] };
      }

      // Check capability against available rooms
      this.logger.log('Check the capability of each merged request against capacity data.');
      const { validRequests, capableDfs } = await this.getCapableMergedRequests(
        validMerges,
        listRoomProductAvailable,
        saleStrategy
      );

      // Group by cluster size and select top merges
      const mergedByCluster = new Map<
        number,
        { request: PartitionResult; dfs: CapacityData[][]; evenAdults: number }[]
      >();

      validRequests.forEach((request, index) => {
        const clusterSize = request.rawCapacities.length;
        const evenAdults = this.countEventAdults(request.rawCapacities);

        if (!mergedByCluster.has(clusterSize)) {
          mergedByCluster.set(clusterSize, []);
        }

        mergedByCluster.get(clusterSize)!.push({
          request,
          dfs: capableDfs[index],
          evenAdults
        });
      });

      // Select top 2 from each cluster
      const topMergedCapacityDfs: CapacityData[][][] = [];
      const topMergedIndices: number[][][] = [];

      for (const clusterItems of mergedByCluster.values()) {
        const sortedItems = clusterItems.sort((a, b) => b.evenAdults - a.evenAdults).slice(0, 2);

        for (const item of sortedItems) {
          topMergedCapacityDfs.push(item.dfs);
          topMergedIndices.push(item.request.partition);
        }
      }

      return {
        mergedCapacityDfs: topMergedCapacityDfs,
        mergedIndices: topMergedIndices
      };
    } catch (error) {
      this.logger.warn(
        `Something wrong in merge requests: ${error.message}. Value will be returned empty.`
      );
      return { mergedCapacityDfs: [], mergedIndices: [] };
    }
  }
}
