import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';

export class RoomProductPricingUtils {
  static filterRedundantInput(
    currentInputs: Record<string, RoomProductDailySellingPrice[]>,
    newInputs: Partial<RoomProductDailySellingPrice>[],
  ): Partial<RoomProductDailySellingPrice>[] {
    // Only keep newInputs that differ from current ones
    const filtered = newInputs.filter((newInput) => {
      const key = `${newInput.date}`;

      const currentInput = currentInputs[key]?.find(
        (existing) => existing.roomProductId === newInput.roomProductId && existing.date === newInput.date && existing.ratePlanId === newInput.ratePlanId,
      );

      if (!currentInput) {
        // not found in currentInputs → always new
        return true;
      }

      const newBasePrice = newInput.basePrice ?? 0;
      const currentBasePrice = currentInput.basePrice ?? 0;

      const basePriceChanged = newBasePrice !== currentBasePrice;

      return basePriceChanged;
    });

    return filtered || [];
  }
}
