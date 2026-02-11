import { RoomUnitRetailFeature } from '@src/core/entities/room-unit-retail-feature.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';

export abstract class RoomUnitUtil {
  /** This roomUnitRetailFeatures list must be sort by
   * before pass to param, please sort by createdDate : ASC, code: ASC by hotel retail feature
   */
  // public static generateFeatureString(
  //   roomUnitRetailFeatures: Partial<RoomUnitRetailFeature>[]
  // ): string {
  //   const retailQuantities = roomUnitRetailFeatures
  //     .map((feature) => feature?.quantity || 0)
  //     .reverse();
  //   return retailQuantities.join(',');
  // }

  /**
   * Generates feature string in new format (code;quantity pairs)
   * @param retailFeatures - Room unit or room product retail features
   * @param hotelRetailFeatures - Hotel retail features sorted by createdAt ASC, code ASC
   * @returns Feature string in format "code1;quantity1,code2;quantity2"
   */
  public static generateFeatureStringV2(
    retailFeatures: Array<Partial<{ retailFeatureId: string; quantity: number }>>,
    hotelRetailFeatures: Pick<HotelRetailFeature, 'id' | 'code'>[]
  ): string {
    if (!retailFeatures || retailFeatures.length === 0) {
      return '';
    }

    // Create a map for quick lookup of quantities by retail feature id
    const quantityMap = new Map<string, number>();
    retailFeatures.forEach((feature) => {
      if (
        feature.retailFeatureId &&
        feature.quantity &&
        feature.quantity > 0
      ) {
        quantityMap.set(feature.retailFeatureId, feature.quantity);
      }
    });

    // Build feature string parts in the order of hotelRetailFeatures (which should be sorted)
    const featureStringParts: string[] = [];

    hotelRetailFeatures.forEach((hotelFeature) => {
      const quantity = quantityMap.get(hotelFeature.id);
      if (quantity && quantity > 0) {
        featureStringParts.push(`${hotelFeature.code};${quantity}`);
      }
    });

    return featureStringParts.join(',');
  }
}
