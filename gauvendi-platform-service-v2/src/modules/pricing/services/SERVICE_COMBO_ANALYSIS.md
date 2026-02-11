# Service Combo Implementation Analysis

## Executive Summary

The codebase has **partial support** for Service Combo functionality. The foundation exists (COMBO enum, `linkedAmenityCode` field, COMBO handling logic), but the critical implementation is **incomplete**. The `getLinkedAmenities()` method is a placeholder that returns an empty array, making COMBO amenities non-functional.

---

## Current State Analysis

### ✅ What's Already Implemented

1. **Entity Structure** (`hotel-amenity.entity.ts`)
   - `sellingType: SellingTypeEnum` with `COMBO` option
   - `linkedAmenityCode: string` field (comma-separated amenity codes)
   - `linkedAmenityInfoList?: HotelAmenity[]` for storing calculated sub-services
   - All necessary tax and pricing fields

2. **Enum Support** (`common.ts`)
   - `SellingTypeEnum.COMBO = 'COMBO'` exists

3. **Pricing Service Structure** (`calculate-amenity-pricing.service.ts`)
   - COMBO detection logic (line 72)
   - Framework for iterating linked amenities
   - Tax calculation per sub-service
   - Aggregation logic for totals

4. **Tax System**
   - `HotelTaxSetting` links service codes to tax codes
   - `HotelTax` defines tax rates (e.g., 7% VAT, 19% VAT)
   - Tax calculation supports both INCLUSIVE and EXCLUSIVE modes

### ❌ What's Missing

1. **Critical: `getLinkedAmenities()` Implementation**
   ```typescript
   // Current (line 655-660):
   private getLinkedAmenities(amenity: HotelAmenity): HotelAmenity[] {
     // Parse linkedAmenityCode and return linked amenities
     // This would typically involve database lookups or cached amenity data
     // For now, return empty array as placeholder
     return [];
   }
   ```
   **Impact:** COMBO amenities cannot function because no linked amenities are retrieved.

2. **Price Allocation Logic**
   - Current logic calculates each linked amenity's price independently
   - **Missing:** Logic to split the parent COMBO's selling price proportionally among sub-services
   - **Requirement:** When guest buys "Breakfast" for €20, need to split into:
     - Breakfast (food): €X with 7% VAT
     - Breakfast (beverages): €Y with 19% VAT
     - Where X + Y = €20

3. **Database Query for Linked Amenities**
   - No repository injection or data fetching mechanism
   - Need to query `HotelAmenity` by codes from `linkedAmenityCode`

4. **Price Proportion Calculation**
   - No logic to determine how to split the parent price
   - Options needed:
     - Equal split
     - Based on sub-service base rates
     - Based on configured percentages
     - Based on sub-service selling prices

---

## Requirements Analysis

### Use Case: Breakfast Service Combo

**External View (Guest):**
- One extra: "Breakfast" 
- One price: €20.00

**Internal View (System):**
- Sub-service 1: "BFst food" (7% VAT)
- Sub-service 2: "BFst beverage" (19% VAT)
- Total: €20.00 split between them

**PMS Posting:**
- Two separate extras with correct tax breakdown
- Revenue and tax posted correctly per sub-service

### Process Flow Requirements

1. **Guest Purchase**
   - Guest selects "Breakfast" (COMBO amenity)
   - System receives: amenity code, count, dates

2. **Service Combo Resolution**
   - System identifies `sellingType = COMBO`
   - Parses `linkedAmenityCode` (e.g., "BFST_FOOD,BFST_BEVERAGE")
   - Fetches linked amenity entities from database

3. **Price Allocation**
   - Get parent COMBO's selling price (€20.00)
   - Calculate allocation:
     - Option A: Equal split (€10.00 each)
     - Option B: Based on sub-service base rates
     - Option C: Based on configured allocation percentages
   - Assign prices to each sub-service

4. **Tax Calculation Per Sub-Service**
   - For "BFst food": Calculate with 7% VAT
   - For "BFst beverage": Calculate with 19% VAT
   - Each sub-service gets its own `taxDetailsMap`

5. **Aggregation**
   - Sum all sub-service totals
   - Set on parent COMBO amenity
   - Store sub-services in `linkedAmenityInfoList`

6. **PMS Posting**
   - Post each sub-service separately to PMS
   - Use `mappingHotelAmenityCode` for each
   - Include correct tax breakdown per sub-service

---

## Code Review Findings

### 1. Entity Structure ✅

**File:** `src/core/entities/hotel-entities/hotel-amenity.entity.ts`

**Strengths:**
- Well-structured with all necessary fields
- Proper TypeORM decorators and indexes
- `linkedAmenityInfoList` field exists for storing calculated sub-services

**Issues:**
- `linkedAmenityCode` is a simple string (comma-separated)
  - Consider: Should this be a JSON array for more complex data?
  - Consider: Should there be allocation percentages stored?

**Recommendation:**
```typescript
// Option 1: Keep simple (current)
linkedAmenityCode: string; // "BFST_FOOD,BFST_BEVERAGE"

// Option 2: Add allocation support
@Column({ type: 'jsonb', nullable: true, name: 'linked_amenity_allocation' })
linkedAmenityAllocation?: Array<{
  code: string;
  allocationPercentage?: number; // 0-100
  allocationAmount?: number; // Fixed amount
}>;
```

### 2. Tax System ✅

**Files:**
- `hotel-tax.entity.ts` - Tax definitions with rates
- `hotel-tax-setting.entity.ts` - Links service codes to tax codes

**Strengths:**
- Supports multiple tax codes per service
- Date-valid tax rates (`validFrom`, `validTo`)
- PMS mapping support (`mappingPmsTaxCode`)

**Analysis:**
- Perfect for Service Combo: Each sub-service can have different tax codes
- Example:
  - "BFST_FOOD" → Tax code "VAT_7" (7%)
  - "BFST_BEVERAGE" → Tax code "VAT_19" (19%)

### 3. Pricing Service ⚠️

**File:** `src/modules/hotel/services/calculate-amenity-pricing.service.ts`

**Current COMBO Logic (lines 72-132):**
```typescript
if (hotelAmenity.sellingType === SellingTypeEnum.COMBO) {
  const linkedAmenities = this.getLinkedAmenities(hotelAmenity); // ❌ Returns []
  
  for (const linkedAmenity of linkedAmenities) {
    // Calculate each linked amenity independently
    const amenityPricing = this.calculateAmenityPricingDetails(...);
    // ... tax calculation per sub-service
    // ... aggregate totals
  }
}
```

**Issues:**

1. **`getLinkedAmenities()` Not Implemented**
   - Returns empty array
   - No database query
   - No repository injection

2. **Price Allocation Missing**
   - Each linked amenity calculates its own price from `hotelAmenityPrices`
   - **Problem:** Should use parent COMBO's price and split it
   - Current: Each sub-service uses its own price (if exists)
   - Required: Parent price should be allocated to sub-services

3. **Tax Setting Resolution**
   - Uses `taxSettingList` from parent amenity
   - **Issue:** Each sub-service needs its own tax settings
   - Should filter by sub-service code, not parent code

**Required Changes:**

```typescript
// 1. Inject repository
constructor(
  @InjectRepository(HotelAmenity)
  private hotelAmenityRepository: Repository<HotelAmenity>
) {}

// 2. Implement getLinkedAmenities()
private async getLinkedAmenities(
  amenity: HotelAmenity,
  hotelId: string
): Promise<HotelAmenity[]> {
  if (!amenity.linkedAmenityCode) return [];
  
  const codes = amenity.linkedAmenityCode.split(',').map(c => c.trim());
  
  return this.hotelAmenityRepository.find({
    where: {
      hotelId,
      code: In(codes),
      status: AmenityStatusEnum.ACTIVE
    },
    relations: {
      hotelAmenityPrices: { hotelAgeCategory: true },
      // ... other relations
    }
  });
}

// 3. Add price allocation logic
private allocateComboPrice(
  parentPrice: Decimal,
  linkedAmenities: HotelAmenity[],
  allocationMethod: 'equal' | 'proportional' | 'configured'
): Map<string, Decimal> {
  // Implementation needed
}
```

### 4. Age Category Pricing ✅

**File:** `hotel-amenity-price.entity.ts`

**Analysis:**
- Links amenities to age categories with prices
- Supports different prices per age group
- Works correctly for sub-services

**Note:** Each sub-service in a COMBO can have its own age category pricing.

---

## Implementation Recommendations

### Phase 1: Core Functionality

1. **Implement `getLinkedAmenities()`**
   - Inject `HotelAmenityRepository`
   - Query by codes from `linkedAmenityCode`
   - Load necessary relations (prices, tax settings)

2. **Add Price Allocation Logic**
   - Determine allocation method (start with equal split)
   - Split parent COMBO's selling price among sub-services
   - Store allocated prices on sub-services

3. **Fix Tax Setting Resolution**
   - For each sub-service, get its own tax settings
   - Filter `taxSettingList` by sub-service code

### Phase 2: Enhanced Features

1. **Allocation Configuration**
   - Add `linkedAmenityAllocation` JSON field
   - Support percentage-based or fixed-amount allocation
   - Fallback to equal split if not configured

2. **Validation**
   - Ensure all linked amenity codes exist
   - Validate linked amenities are active
   - Check for circular references

3. **PMS Integration**
   - Ensure each sub-service posts with correct `mappingHotelAmenityCode`
   - Verify tax breakdown is correct per sub-service

### Phase 3: Advanced Features

1. **Dynamic Allocation**
   - Allocate based on sub-service base rates
   - Allocate based on date-specific pricing
   - Support different allocation per age category

2. **Reporting**
   - Track Service Combo usage
   - Revenue breakdown by sub-service
   - Tax reporting per sub-service

---

## Database Schema Considerations

### Current Schema ✅

No schema changes required for basic implementation:
- `linked_amenity_code` already exists
- Tax system already supports multiple tax codes per service

### Optional Enhancements

```sql
-- Option: Add allocation configuration
ALTER TABLE hotel_amenity 
ADD COLUMN linked_amenity_allocation JSONB;

-- Example value:
-- [
--   {"code": "BFST_FOOD", "allocationPercentage": 60},
--   {"code": "BFST_BEVERAGE", "allocationPercentage": 40}
-- ]
```

---

## Testing Scenarios

### Test Case 1: Basic Service Combo
- **Setup:** Breakfast COMBO with 2 sub-services
- **Input:** Guest buys Breakfast for €20.00
- **Expected:** 
  - €10.00 allocated to each sub-service
  - Each sub-service calculates tax independently
  - Total matches €20.00

### Test Case 2: Different VAT Rates
- **Setup:** Breakfast COMBO (7% and 19% VAT)
- **Input:** €20.00 selling price (INCLUSIVE tax)
- **Expected:**
  - Food: Base + 7% VAT = allocated portion
  - Beverage: Base + 19% VAT = allocated portion
  - Gross totals match €20.00

### Test Case 3: Age Category Pricing
- **Setup:** COMBO with age-specific pricing
- **Input:** 2 adults, 1 child
- **Expected:** Each sub-service respects age category pricing

### Test Case 4: PMS Posting
- **Setup:** COMBO with PMS mapping codes
- **Input:** Booking with Service Combo
- **Expected:** Two separate PMS extras posted with correct tax

---

## Risk Assessment

### High Risk
- **Price Allocation Accuracy:** Must ensure totals match exactly
- **Tax Calculation:** Each sub-service must use correct tax rate
- **PMS Integration:** Sub-services must post correctly

### Medium Risk
- **Performance:** Additional database queries for linked amenities
- **Data Consistency:** Linked amenity codes must be valid
- **Edge Cases:** What if linked amenity is inactive?

### Low Risk
- **UI Display:** Guest sees one line item (already handled)
- **Reporting:** Revenue tracking per sub-service

---

## Conclusion

The Service Combo feature is **50% implemented**. The architecture is sound, but critical functionality is missing:

1. ✅ Entity structure ready
2. ✅ Tax system supports it
3. ✅ Pricing service has framework
4. ❌ **`getLinkedAmenities()` not implemented** (CRITICAL)
5. ❌ **Price allocation logic missing** (CRITICAL)
6. ❌ **Tax setting resolution needs fix** (HIGH)

**Priority:** Implement `getLinkedAmenities()` and price allocation logic to make Service Combo functional.

**Estimated Effort:** 2-3 days for basic implementation, 1 week for full feature with allocation configuration.

