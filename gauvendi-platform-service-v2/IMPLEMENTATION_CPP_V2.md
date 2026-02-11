# Implementation: cppCalculateRoomProductPriceListV2

## Summary

Đã implement API `cppCalculateRoomProductPriceListV2` theo đúng logic flow từ Java service version. Implementation bao gồm:

### Files Created/Modified:

1. **New DTO File**: `src/modules/room-product/dtos/cpp-calculate-room-product-price-v2-response.dto.ts`
   - Định nghĩa các response DTOs:
     - `CppCalculateRoomProductPriceV2ResponseDto`
     - `CppRoomProductDto`
     - `CppSellableOptionDto`
     - `CppRestrictionDto`
     - `CppAssignedRoomDto`
     - Và các supporting DTOs

2. **Modified**: `src/modules/room-product/room-product.service.ts`
   - Added method: `getCppCalculateRoomProductPriceListV2()`
   - Added 3 helper methods:
     - `buildCppRoomProduct()` - Build room product with features and matching
     - `calculateGuestAllocations()` - Calculate guest allocation logic
     - `buildRestrictionList()` - Merge restrictions from multiple levels

## Implementation Logic Flow

### Step 1: Validate Hotel

- Check hotel exists and is active
- Return empty array if not found

### Step 2: Get Active Sales Plans (Rate Plans)

- Query rate plans with filters:
  - Hotel ID
  - Status = Active
  - Distribution channel includes GV_VOICE
  - Type = Public (if no promo codes)
  - Filter by salesPlanIdList if provided
- Filter by promo codes if provided
- Check sales plan sellability using `RatePlanSellabilityService.getDailyRatePlanSellability()`
- Only keep sales plans that are sellable for ALL dates in range

### Step 3: Get Room Product Rate Plans

- Query `room_product_rate_plan` table
- Filter by:
  - Hotel ID
  - Rate plan IDs from step 2
  - isSellable = true

### Step 4: Get Room Products

- Query room products with relations:
  - images (roomProductImages)
  - roomProductRetailFeatures + retailFeature
  - roomProductStandardFeatures + standardFeature
  - roomProductAssignedUnits + roomUnit
- Filter by:
  - Room product IDs from step 3
  - Hotel ID
  - Status = ACTIVE
  - Distribution channel includes GV_VOICE

### Step 5: Filter by Room ID (if provided)

- If roomId is specified, filter room products that contain that room

### Step 6: Parallel Data Fetching (7 queries in Promise.all)

1. **Room Product Daily Availability** - Check availability by date
2. **Room Unit Availability** - Check physical room availability (if roomId specified)
3. **Restrictions** - Get from 3 levels (hotel, rate plan, room product)
4. **Room Product Rate Plan Sellability** - Daily sellability for each combination
5. **Room Product Daily Selling Prices** - Pricing data for each combination
6. **Hotel Tax Settings** - Tax configuration

### Step 7: Get Retail Features (if featureCodeList provided)

- Query hotel retail features for matching calculation

### Step 8: Build Response

For each room product:

- **Check availability**: must have availability for all dates
- **Check guest capacity**: using `checkGuestCapacity()`
- **Calculate allocations**: adults, children, extra beds
- **Build assigned room list**: based on allocation setting (DEDUCT/ALL)
- **Build room product DTO**:
  - Basic info
  - Images
  - Retail features (matched vs additional)
  - Standard features
  - Matching percentage (if feature filtering)
- **Build sellable options** (for each rate plan):
  - Check sellability for all dates
  - Calculate total prices (base, tax, gross)
  - Get payment terms & cancellation policy
  - Build restriction list
  - Sort by price ASC

- **Build overall restriction list** for room product

### Step 9: Sort Results

- If featureCodeList provided:
  - Sort by matching percentage DESC
  - Then by price ASC
- Else:
  - Sort by price ASC only

## Known Issues & Fixes Needed

### 1. Import RfcAllocationSetting

```typescript
// Add to imports at top of file
import { RfcAllocationSetting } from '@src/core/enums/common';
```

### 2. Enum Values

- Change `RoomProductStatus.Active` → `RoomProductStatus.ACTIVE`
- Change `RoomUnitAvailabilityStatus.Available` → `RoomUnitAvailabilityStatus.AVAILABLE`
- Change `RatePlanTypeEnum` comparison (if exists)

### 3. Entity Property Names

- `roomProduct.allocationSetting` → `roomProduct.rfcAllocationSetting`
- `roomProduct.images` → `roomProduct.roomProductImages`
- `roomProductRetailFeature.hotelRetailFeature` → `roomProductRetailFeature.retailFeature`
- `roomProductStandardFeature.hotelStandardFeature` → `roomProductStandardFeature.standardFeature`
- `ratePlan.hotelCancellationPolicyCode` → `ratePlan.hotelCxlPolicyCode`
- `roomProductDailyAvailability.availableToSell` → `roomProductDailyAvailability.available`

### 4. RatePlanSellabilityService Method

```typescript
// Change from:
this.ratePlanSellabilityService.checkSellability({...})

// To:
this.ratePlanSellabilityService.getDailyRatePlanSellability({
  hotelId,
  salesPlanIds: finalSalesPlanIds,  // Note: salesPlanIds not ratePlanIds
  fromDate: format(arrivalDate, DATE_FORMAT),
  toDate: format(new Date(departureDate.getTime() - 86400000), DATE_FORMAT),
  distributionChannels: [DistributionChannel.GV_VOICE]
})
```

Return type is `DailyRatePlanSellabilityDto[]` with properties:

- `salePlanId` (not salesPlanId)
- `isSellable`
- `date`
- `distributionChannel`

### 5. Restriction Entity Structure

Restriction entity không có `value` property. Instead có các properties riêng:

- `minLength` - for minimum stay
- `maxLength` - for maximum stay
- `minAdv` - for minimum advance booking
- `maxAdv` - for maximum advance booking
- `minLosThrough` - for minimum LOS through
- `maxReservationCount`

Restriction filtering cũng cần dùng `roomProductIds` và `ratePlanIds` (arrays) thay vì singular.

Example restriction query:

```typescript
this.restrictionRepository.find({
  where: [
    {
      hotelId,
      fromDate: LessThanOrEqual(arrivalDate),
      toDate: MoreThanOrEqual(departureDate),
      roomProductIds: IsNull(),
      ratePlanIds: IsNull()
    },
    {
      hotelId,
      fromDate: LessThanOrEqual(arrivalDate),
      toDate: MoreThanOrEqual(departureDate),
      ratePlanIds: Raw((alias) => `${alias} && ARRAY[:...ids]::text[]`, {
        ids: sellableSalesPlanIds
      }),
      roomProductIds: IsNull()
    },
    {
      hotelId,
      fromDate: LessThanOrEqual(arrivalDate),
      toDate: MoreThanOrEqual(departureDate),
      roomProductIds: Raw((alias) => `${alias} && ARRAY[:...ids]::uuid[]`, { ids: roomProductIds }),
      ratePlanIds: IsNull()
    }
  ]
});
```

### 6. groupByToMap Function

Current implementation assumes `groupByToMap` can take 3 arguments for nested grouping.
Nếu function chỉ hỗ trợ 2 args, cần create nested maps manually:

```typescript
// Create nested map for sellability
const sellabilityMap = new Map<string, Map<string, RoomProductRatePlanAvailabilityAdjustment[]>>();
for (const item of roomProductRatePlanSellability) {
  if (!sellabilityMap.has(item.roomProductId)) {
    sellabilityMap.set(item.roomProductId, new Map());
  }
  const innerMap = sellabilityMap.get(item.roomProductId)!;
  if (!innerMap.has(item.ratePlanId)) {
    innerMap.set(item.ratePlanId, []);
  }
  innerMap.get(item.ratePlanId)!.push(item);
}

// Similar for pricing map
const pricingMap = new Map<string, Map<string, RoomProductDailySellingPrice[]>>();
// ... same pattern
```

### 7. HotelRetailFeature iconUrl

If `HotelRetailFeature` doesn't have `iconUrl`, use `imageUrl` instead:

```typescript
iconUrl: productFeature?.retailFeature?.imageUrl || feature?.imageUrl;
```

### 8. Distribution Channel Query

Change from:

```typescript
distributionChannels: Raw((alias) => `${alias} @> ARRAY['GV_VOICE']::text[]`);
```

To:

```typescript
distributionChannel: Raw((alias) => `${alias} @> ARRAY['GV_VOICE']::text[]`);
```

(Note singular `distributionChannel`)

### 9. Missing totalAdults Null Check

Add null check:

```typescript
const totalAdults = firstRequest?.adult || 0;
const totalChildren = firstRequest?.childrenAgeList?.length || 0;
```

## Testing Checklist

- [ ] Test with basic search (no filters)
- [ ] Test with featureCodeList (matching percentage)
- [ ] Test with salesPlanIdList filter
- [ ] Test with promoCodeList
- [ ] Test with specific roomId
- [ ] Test with excludedList
- [ ] Test sorting (by price, by matching percentage)
- [ ] Test restriction merging logic
- [ ] Test guest allocation calculation
- [ ] Test availability checking
- [ ] Test sellability filtering

## Performance Considerations

- Uses Promise.all for 6 parallel queries
- Creates Maps for O(1) lookups in loops
- Early exits when data is missing
- Efficient filtering before building response

## Next Steps

1. Fix all linting errors listed above
2. Test with real data
3. Add error handling and logging
4. Consider adding caching for frequently accessed data (hotel tax settings, retail features)
5. Add TODO for city tax calculation if needed
6. Add TODO for included services (room_product_included_extra table)

## Related Tables/Entities

- `hotel`
- `rate_plan`
- `rate_plan_sellability`
- `rate_plan_daily_sellability`
- `room_product`
- `room_product_rate_plan`
- `room_product_daily_availability`
- `room_product_daily_selling_price`
- `room_product_rate_plan_availability_adjustment`
- `room_product_retail_feature`
- `room_product_standard_feature`
- `room_product_image`
- `room_product_assigned_unit`
- `room_unit`
- `room_unit_availability`
- `hotel_retail_feature`
- `hotel_tax_setting`
- `restriction`
