import { Injectable, Logger } from '@nestjs/common';
import { DirectProcessExecuteError } from './recommendation-algorithm.types';
import { deepCopy } from './recommendation-algorithm.utils';

export interface CombinationResult {
  combination: string[];
  value: number;
  basePrice: number;
  directScore?: number;
  compareMatchingScore?: number;
  isRestricted: boolean;
  isMatched?: boolean;
  idxGroup: number;
  mergedIndices: number[][];
  sortedCluster?: number;
  cluster?: number;
}

export interface PriceJumpResult {
  combination: string[][];
  idxGroup: number[];
  isMatched: boolean[];
  isRestricted: boolean[];
}

@Injectable()
export class PriceJumpService {
  private readonly logger = new Logger(PriceJumpService.name);

  /**
   * Sort room combinations by popularity or price and select the top results.
   */
  sortedBy(
    data: CombinationResult[],
    k: number | null = null,
    by: string = 'popular',
    score: string = 'directScore'
  ): PriceJumpResult {
    try {
      const defineSettings = {
        directScore: {
          sorted: {
            popular: {
              isRestricted: true,
              sortedCluster: true,
              directScore: false,
              basePrice: true
            },
            price: {
              isRestricted: true,
              sortedCluster: true,
              basePrice: true,
              directScore: false
            }
          },
          outputColumns: ['combination', 'idxGroup']
        },
        compareMatchingScore: {
          sorted: {
            popular: {
              isMatched: false,
              isRestricted: true,
              sortedCluster: true,
              compareMatchingScore: false,
              basePrice: true
            },
            price: {
              isMatched: false,
              isRestricted: true,
              sortedCluster: true,
              basePrice: true,
              compareMatchingScore: false
            }
          },
          outputColumns: ['combination', 'isRestricted', 'isMatched', 'idxGroup']
        }
      };

      const sortConfig =
        defineSettings[score as keyof typeof defineSettings]?.sorted[
          by as keyof typeof defineSettings.directScore.sorted
        ];
      if (!sortConfig) {
        throw new Error(`Invalid score type: ${score} or sort by: ${by}`);
      }

      // Sort the data based on configuration
      const sortedData = [...data].sort((a, b) => {
        for (const [key, ascending] of Object.entries(sortConfig)) {
          const aVal = a[key as keyof CombinationResult];
          const bVal = b[key as keyof CombinationResult];

          if (aVal !== bVal) {
            if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
              return ascending
                ? (aVal ? 1 : -1) - (bVal ? 1 : -1)
                : (bVal ? 1 : -1) - (aVal ? 1 : -1);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return ascending ? aVal - bVal : bVal - aVal;
            }
          }
        }
        return 0;
      });

      let finalData: CombinationResult[];
      if (k === null) {
        // Select median item from each price cluster
        const clusterGroups = new Map<number, CombinationResult[]>();

        // Group items by cluster
        sortedData.forEach((item) => {
          const cluster = item.sortedCluster || 0;
          if (!clusterGroups.has(cluster)) {
            clusterGroups.set(cluster, []);
          }
          clusterGroups.get(cluster)!.push(item);
        });

        // Select median from each cluster
        finalData = [];
        const sortedClusters = Array.from(clusterGroups.keys()).sort((a, b) => a - b);

        sortedClusters.forEach((cluster) => {
          const clusterItems = clusterGroups.get(cluster)!;
          // Select median index (for odd length: middle, for even length: lower middle)
          const medianIndex = Math.floor((clusterItems.length - 1) / 2);
          finalData.push(clusterItems[medianIndex]);
        });
      } else {
        // Select top k items
        finalData = sortedData.slice(0, k);
      }

      // this.logger.debug('Sorted direct results:', finalData.slice(0, 10));

      return {
        combination: finalData.map((item) => item.combination),
        idxGroup: finalData.map((item) => item.idxGroup ?? 0),
        isMatched: finalData.map((item) => item.isMatched ?? false),
        isRestricted: finalData.map((item) => item.isRestricted ?? false)
      };
    } catch (error) {
      this.logger.error(`Detail Error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  /**
   * Group room combinations into price clusters using K-means-like clustering.
   */
  clustering(data: CombinationResult[], k: number): CombinationResult[] {
    try {
      const clusteringData = deepCopy(data);

      if (clusteringData.length <= k) {
        // If we have fewer items than clusters, assign each to its own cluster
        return clusteringData.map((item, index) => ({
          ...item,
          cluster: index,
          sortedCluster: index
        }));
      }

      // Simple price-based clustering (simplified K-means)
      const prices = clusteringData.map((item) => item.basePrice);
      const minPrice = prices.reduce((min, price) => Math.min(min, price), prices[0]);
      const maxPrice = prices.reduce((max, price) => Math.max(max, price), prices[0]);
      const priceRange = maxPrice - minPrice;

      if (priceRange === 0) {
        // All prices are the same
        return clusteringData.map((item) => ({
          ...item,
          cluster: 0,
          sortedCluster: 0
        }));
      }

      // Assign clusters based on price ranges
      const clusteredData = clusteringData.map((item) => {
        const normalizedPrice = (item.basePrice - minPrice) / priceRange;
        const cluster = Math.min(Math.floor(normalizedPrice * k), k - 1);
        return {
          ...item,
          cluster
        };
      });

      // Calculate cluster means and sort
      const clusterMeans = new Array(k).fill(0);
      const clusterCounts = new Array(k).fill(0);

      clusteredData.forEach((item) => {
        clusterMeans[item.cluster!] += item.basePrice;
        clusterCounts[item.cluster!]++;
      });

      for (let i = 0; i < k; i++) {
        if (clusterCounts[i] > 0) {
          clusterMeans[i] /= clusterCounts[i];
        }
      }

      // Create sorted cluster mapping
      const sortedClusters = clusterMeans
        .map((mean, index) => ({ mean, index }))
        .sort((a, b) => a.mean - b.mean)
        .map((item) => item.index);

      const clusterMapping = new Map<number, number>();
      sortedClusters.forEach((originalCluster, newIndex) => {
        clusterMapping.set(originalCluster, newIndex);
      });

      // Apply sorted cluster IDs
      return clusteredData.map((item) => ({
        ...item,
        sortedCluster: clusterMapping.get(item.cluster!) || 0
      }));
    } catch (error) {
      this.logger.error(`Detail Error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  /**
   * Optimize room recommendations to provide diverse price options.
   */
  async priceJumpExecute(
    priceJump: boolean,
    directRoomProductData: CombinationResult[],
    listExcludeBasePrice: number[],
    k: number,
    by: string = 'popular',
    score: string = 'directScore'
  ): Promise<PriceJumpResult> {
    try {
      // Normalize data: ensure idxGroup exists (standardized field name)
      let data = deepCopy(directRoomProductData).map((item) => ({
        ...item,
        idxGroup: item.idxGroup ?? 0,
        isMatched: item.isMatched ?? false,
        isRestricted: item.isRestricted ?? false
      }));

      // Filter out excluded base prices
      const sameBasePriceData = data.filter((item) =>
        listExcludeBasePrice.includes(item.basePrice)
      );
      data = data.filter((item) => !listExcludeBasePrice.includes(item.basePrice));

      // Disable price jump if we don't have enough options
      let usePriceJump = priceJump;
      if (data.length <= k) {
        usePriceJump = false;
      }

      // Split into restricted and non-restricted groups
      const isRestrictedData = data.filter((item) => item.isRestricted);
      const notRestrictedData = data.filter((item) => !item.isRestricted);

      let listCombination: PriceJumpResult;

      if (usePriceJump) {
        if (notRestrictedData.length <= k) {
          // Case 1: Not enough non-restricted rooms
          const notRestrictedWithCluster = notRestrictedData.map((item) => ({
            ...item,
            sortedCluster: 0
          }));

          this.logger.log(`Product (not restricted) sorted by ${by}`);
          const notRestrictedResult = this.sortedBy(notRestrictedWithCluster, k, by, score);

          const kr = k - notRestrictedData.length;
          let restrictedResult: PriceJumpResult = {
            combination: [],
            idxGroup: [],
            isMatched: [],
            isRestricted: []
          };

          if (kr > 0) {
            if (kr === 1) {
              const restrictedWithCluster = isRestrictedData.map((item) => ({
                ...item,
                sortedCluster: 0
              }));
              this.logger.log(`Product (is restricted) sorted by ${by}`);
              restrictedResult = this.sortedBy(restrictedWithCluster, kr, by, score);
            } else {
              const clusteringRestrictedData = this.clustering(isRestrictedData, kr);
              this.logger.log(`Product (is restricted) clustering and sorted by ${by}`);
              restrictedResult = this.sortedBy(clusteringRestrictedData, null, by, score);
            }
          }

          // Combine results
          listCombination = {
            combination: [...notRestrictedResult.combination, ...restrictedResult.combination],
            idxGroup: [...notRestrictedResult.idxGroup, ...restrictedResult.idxGroup],
            isMatched: [...notRestrictedResult.isMatched, ...restrictedResult.isMatched],
            isRestricted: [...notRestrictedResult.isRestricted, ...restrictedResult.isRestricted]
          };
        } else {
          const clusteringData = this.clustering(notRestrictedData, k);
          listCombination = this.sortedBy(clusteringData, null, by, score);
        }
      } else {
        // No price jump
        const dataWithCluster = data.map((item) => ({ ...item, sortedCluster: 0 }));
        listCombination = this.sortedBy(dataWithCluster, k, by, score);
      }

      // Add same base price combinations if we have slots left
      const slotsLeft = k - listCombination.combination.length;
      if (slotsLeft > 0 && sameBasePriceData.length > 0) {
        const sortedSameBasePrice = sameBasePriceData
          .sort((a, b) => {
            if (a.isRestricted !== b.isRestricted) {
              return a.isRestricted ? 1 : -1;
            }
            if (a.basePrice !== b.basePrice) {
              return a.basePrice - b.basePrice;
            }
            return (
              (b[score as keyof CombinationResult] as number) -
              (a[score as keyof CombinationResult] as number)
            );
          })
          .slice(0, slotsLeft);

        listCombination.combination.push(...sortedSameBasePrice.map((item) => item.combination));
        listCombination.idxGroup.push(...sortedSameBasePrice.map((item) => item.idxGroup));
      }

      return listCombination;
    } catch (error) {
      this.logger.error(`Detail Error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }
}
