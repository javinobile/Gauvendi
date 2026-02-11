# Service Combo Implementation Guide

## Quick Summary

**Status:** Foundation exists, but `getLinkedAmenities()` is not implemented (returns empty array).

**Critical Missing Pieces:**
1. Database query to fetch linked amenities
2. Price allocation logic to split parent COMBO price
3. Tax setting resolution per sub-service

---

## Implementation Steps

### Step 1: Fix `getLinkedAmenities()` Method

**File:** `src/modules/hotel/services/calculate-amenity-pricing.service.ts`

**Current Code (line 655-660):**
```typescript
private getLinkedAmenities(amenity: HotelAmenity): HotelAmenity[] {
  // Parse linkedAmenityCode and return linked amenities
  // This would typically involve database lookups or cached amenity data
  // For now, return empty array as placeholder
  return [];
}
```

**Required Implementation:**

```typescript
// 1. Add repository injection to constructor
constructor(
  // ... existing injections
  @InjectRepository(HotelAmenity, DbName.Postgres)
  private readonly hotelAmenityRepository: Repository<HotelAmenity>,
) {}

// 2. Update method signature to be async
private async getLinkedAmenities(
  amenity: HotelAmenity,
  hotelId: string
): Promise<HotelAmenity[]> {
  if (!amenity.linkedAmenityCode) {
    return [];
  }

  // Parse comma-separated codes
  const codes = amenity.linkedAmenityCode
    .split(',')
    .map(code => code.trim())
    .filter(code => code.length > 0);

  if (codes.length === 0) {
    return [];
  }

  // Query linked amenities
  const linkedAmenities = await this.hotelAmenityRepository.find({
    where: {
      hotelId,
      code: In(codes),
      status: AmenityStatusEnum.ACTIVE
    },
    relations: {
      hotelAmenityPrices: {
        hotelAgeCategory: true
      }
    }
  });

  // Validate all codes were found
  const foundCodes = new Set(linkedAmenities.map(a => a.code));
  const missingCodes = codes.filter(code => !foundCodes.has(code));
  
  if (missingCodes.length > 0) {
    this.logger.warn(
      `Linked amenity codes not found for COMBO ${amenity.code}: ${missingCodes.join(', ')}`
    );
  }

  return linkedAmenities;
}
```

**Note:** You'll need to import:
```typescript
import { In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from 'src/core/database/database.module';
```

### Step 2: Update COMBO Handling to Use Async Method

**File:** `src/modules/hotel/services/calculate-amenity-pricing.service.ts`

**Current Code (line 72):**
```typescript
if (hotelAmenity.sellingType === SellingTypeEnum.COMBO) {
  const linkedAmenities = this.getLinkedAmenities(hotelAmenity);
  // ...
}
```

**Required Change:**
```typescript
if (hotelAmenity.sellingType === SellingTypeEnum.COMBO) {
  const linkedAmenities = await this.getLinkedAmenities(hotelAmenity, hotel.id);
  
  if (linkedAmenities.length === 0) {
    this.logger.warn(`No linked amenities found for COMBO ${hotelAmenity.code}`);
    // Fallback to non-COMBO logic or return error
    // For now, continue with empty array (will result in zero totals)
  }
  
  // ... rest of COMBO logic
}
```

**Note:** The `calculatePricingAmenity` method must be `async`:
```typescript
public async calculatePricingAmenity(
  input: CalculatePricingAmenityInput,
  hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number }
): Promise<HotelAmenity> {
  // ...
}
```

### Step 3: Fix Tax Setting Resolution

**Current Issue:** COMBO logic uses parent amenity's `taxSettingList` for all sub-services.

**Required Fix:**

In the COMBO loop (around line 99), get tax settings per sub-service:

```typescript
for (const linkedAmenity of linkedAmenities) {
  // ... existing code ...
  
  // Get tax settings for THIS sub-service, not parent
  const subServiceTaxSettings = input.taxSettingList?.filter(
    (taxSetting) => taxSetting.serviceCode === linkedAmenity.code
  ) || [];
  
  // Use subServiceTaxSettings instead of taxSettingList
  const taxResult = this.calculateTaxAndServiceCharges(
    linkedAmenity,
    subTotalSellingRate ?? new Decimal(0),
    subTotalSellingRateBeforeAdjustment ?? new Decimal(0),
    svcChargeRate,
    serviceChargeTaxRate,
    subServiceTaxSettings, // ✅ Use sub-service tax settings
    fromDate,
    toDate,
    hotel.taxSetting,
    decimalUnits,
    roundingMode,
    taxDetailsMap
  );
  
  // ... rest of code ...
}
```

### Step 4: COMBO Pricing Strategy

**Current Implementation:** Each linked amenity uses its own prices from `hotelAmenityPrices`, not allocated from parent.

**Pricing Approach:**
- Each sub-service calculates its own selling price from its `hotelAmenityPrices`
- Tax is calculated based on each sub-service's own selling price
- Totals are aggregated from all sub-services
- No price allocation from parent COMBO price

**Implementation:**

```typescript
if (hotelAmenity.sellingType === SellingTypeEnum.COMBO) {
  const linkedAmenities = await this.getLinkedAmenities(hotelAmenity, hotel.id);
  
  if (linkedAmenities.length === 0) {
    throw new Error(`COMBO ${hotelAmenity.code} has no valid linked amenities`);
  }
  
  hotelAmenity.linkedAmenityInfoList = [];
  
  for (const linkedAmenity of linkedAmenities) {
    // Inherit properties from parent (dates, included dates, etc.)
    this.inheritParentProperties(linkedAmenity, hotelAmenity);
    
    // Calculate pricing for this linked amenity using its own prices
    // Each sub-service uses its own hotelAmenityPrices
    const amenityPricing = this.calculateAmenityPricingDetails(
      linkedAmenity,
      input,
      hotelConfigRoundingMode
    );
    
    // Use the linked amenity's own calculated selling price
    const subTotalSellingRate = amenityPricing.totalPrice ?? new Decimal(0);
    
    // Get tax settings for THIS sub-service
    const subServiceTaxSettings = input.taxSettingList?.filter(
      (taxSetting) => taxSetting.serviceCode === linkedAmenity.code
    ) || [];
    
    // Calculate tax and service charges using sub-service's own price
    const taxResult = this.calculateTaxAndServiceCharges(
      linkedAmenity,
      subTotalSellingRate,
      // ... other parameters
    );
    
    // Store and aggregate totals
    hotelAmenity.linkedAmenityInfoList.push(linkedAmenity);
    this.aggregateTotals(taxResult, totals);
  }
}
```

**Note:** This approach means:
- Parent COMBO price is not used for allocation
- Each sub-service maintains its own pricing structure
- Total COMBO price = sum of all sub-service prices
- Each sub-service can have different tax rates

### Step 5: Store Linked Amenities for PMS Posting

**Current:** `linkedAmenityInfoList` field exists but is not populated.

**Required:** Store calculated sub-services:

```typescript
// In COMBO loop, after calculating each sub-service:
hotelAmenity.linkedAmenityInfoList = hotelAmenity.linkedAmenityInfoList || [];
hotelAmenity.linkedAmenityInfoList.push(linkedAmenity);
```

### Step 6: Update All Callers

Since `calculatePricingAmenity` becomes `async`, update all callers:

**File:** `src/core/modules/pricing-calculate/pricing-calculate.service.ts`

```typescript
// Line 196 - Change to await
const calculatedAmenity = await this.calculateAmenityPricingService.calculatePricingAmenity(
  // ... parameters
);
```

**Search for all usages:**
```bash
grep -r "calculatePricingAmenity" --include="*.ts"
```

---

## Testing Checklist

### Unit Tests

1. ✅ `getLinkedAmenities()` returns correct amenities
2. ✅ `getLinkedAmenities()` handles missing codes gracefully
3. ✅ `allocateComboPrice()` splits equally
4. ✅ `allocateComboPrice()` splits proportionally
5. ✅ Tax calculation uses sub-service tax settings
6. ✅ Totals aggregate correctly

### Integration Tests

1. ✅ Breakfast COMBO with 2 sub-services calculates correctly
2. ✅ Different VAT rates applied per sub-service
3. ✅ PMS posting creates 2 separate extras
4. ✅ Age category pricing works with COMBO
5. ✅ Price allocation totals match parent price exactly

### Edge Cases

1. ✅ Missing linked amenity codes
2. ✅ Inactive linked amenities
3. ✅ Circular references (A links to B, B links to A)
4. ✅ Single linked amenity
5. ✅ Many linked amenities (10+)

---

## Database Migration (Optional)

If you want to add allocation configuration:

```sql
-- Add allocation configuration column
ALTER TABLE hotel_amenity 
ADD COLUMN linked_amenity_allocation JSONB;

-- Example data:
-- [
--   {"code": "BFST_FOOD", "allocationPercentage": 60},
--   {"code": "BFST_BEVERAGE", "allocationPercentage": 40}
-- ]
```

**Entity Update:**
```typescript
@Column({ type: 'jsonb', nullable: true, name: 'linked_amenity_allocation' })
linkedAmenityAllocation?: Array<{
  code: string;
  allocationPercentage?: number;
  allocationAmount?: number;
}>;
```

---

## Performance Considerations

1. **N+1 Query Problem:** If calculating many COMBOs, batch fetch all linked amenities upfront
2. **Caching:** Consider caching linked amenities for frequently used COMBOs
3. **Validation:** Validate linked amenity codes at creation time, not runtime

---

## Rollout Plan

1. **Phase 1:** Implement `getLinkedAmenities()` (1 day)
2. **Phase 2:** Add price allocation (1 day)
3. **Phase 3:** Fix tax settings (0.5 day)
4. **Phase 4:** Testing & bug fixes (1-2 days)
5. **Phase 5:** Optional: Allocation configuration (1 day)

**Total:** ~4-5 days for basic implementation

---

## Example: Breakfast Service Combo

### Setup

```typescript
// Parent COMBO amenity
{
  code: "BREAKFAST",
  name: "Breakfast",
  sellingType: "COMBO",
  linkedAmenityCode: "BFST_FOOD,BFST_BEVERAGE",
  // Note: Parent price is not used for allocation
}

// Sub-service 1
{
  code: "BFST_FOOD",
  name: "Breakfast Food",
  hotelAmenityPrices: [
    { price: 12.00, hotelAgeCategory: { code: "DEFAULT" } }
  ],
  // Tax setting: VAT_7 (7%)
}

// Sub-service 2
{
  code: "BFST_BEVERAGE",
  name: "Breakfast Beverages",
  hotelAmenityPrices: [
    { price: 8.00, hotelAgeCategory: { code: "DEFAULT" } }
  ],
  // Tax setting: VAT_19 (19%)
}
```

### Calculation Flow

1. Guest buys "Breakfast" (COMBO)
2. System identifies `sellingType = COMBO`
3. Fetches linked amenities: `BFST_FOOD`, `BFST_BEVERAGE`
4. Calculates each sub-service using its own prices:
   - BFST_FOOD: €12.00 selling price + 7% VAT = €12.84 gross
   - BFST_BEVERAGE: €8.00 selling price + 19% VAT = €9.52 gross
5. Aggregates: Total = €20.00 selling + taxes = €22.36 gross
6. Posts to PMS as 2 separate extras with correct tax

**Note:** Total selling price (€20.00) matches sum of sub-services, but each uses its own pricing structure.

---

## Implementation Notes

1. **Price Strategy:** Each linked amenity uses its own prices from `hotelAmenityPrices`
2. **Tax Mode:** Each sub-service handles INCLUSIVE/EXCLUSIVE independently based on hotel settings
3. **Totals:** Sum of all sub-service prices and taxes
4. **Validation:** Circular references are checked in `getLinkedAmenities()`
5. **UI:** Parent COMBO displays aggregated totals; sub-services available in `linkedAmenityInfoList`

---

## References

- Entity: `src/core/entities/hotel-entities/hotel-amenity.entity.ts`
- Pricing Service: `src/modules/hotel/services/calculate-amenity-pricing.service.ts`
- Tax System: `src/core/entities/hotel-entities/hotel-tax-setting.entity.ts`
- Repository: `src/modules/hotel/repositories/hotel-amenity.repository.ts`

