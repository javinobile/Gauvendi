# Logic Flow: cppCalculateRoomProductPriceListV2

## Tóm tắt ngắn gọn

API này tính toán và trả về danh sách **Room Products** có thể bán với **Pricing** và **Restrictions** cho một khoảng thời gian check-in/check-out.

---

## Flow 10 Steps Chính

### 1. **Validate Hotel**
```
Input: propertyCode → Get propertyId
Exit early nếu không tìm thấy
```

### 2. **Get Sellable Sales Plans (Rate Plans)**
```sql
-- Query: rate_plan table
WHERE hotelId = ? 
  AND status = ACTIVE
  AND distributionChannel CONTAINS 'GV_VOICE'
  AND type = PUBLIC (nếu không có promo code)
  
-- Check: daily_sales_plan_sellability
→ Chỉ giữ plans sellable cho TẤT CẢ ngày trong range
```

### 3. **Get Room Product Rate Plans**
```sql
-- Query: rfc_rate_plan table (mapping table)
WHERE hotelId = ?
  AND ratePlanId IN (salesPlanIds từ step 2)
  AND isSellable = true
  
→ Extract roomProductIds
```

### 4. **Get Room Products**
```sql
-- Query: rfc table (Room/Feature/Category)
WHERE id IN (roomProductIds từ step 3)
  AND hotelId = ?
  AND status = ACTIVE
  AND distributionChannel CONTAINS 'GV_VOICE'
  
-- Include relations:
  - images
  - retail features (amenities)
  - standard features
  - assigned rooms (physical rooms)
```

### 5. **Filter by Room ID** (optional)
```
Nếu có roomId trong request:
→ Chỉ giữ room products có chứa roomId đó
```

### 6. **Parallel Async Calls** (4 calls đồng thời)

#### 6.1. Calculate Pricing
```sql
-- Query: room_product_daily_base_price + adjustments
→ Tính base rate, tax, gross amount cho mỗi ngày
→ Sum up để có total prices
```

#### 6.2. Check Availability
```sql
-- Query: rfc_daily_availability + room_availability
→ Kiểm tra còn inventory không
→ Available to sell > 0 cho TẤT CẢ ngày
```

#### 6.3. Get Restrictions
```sql
-- Query: hotel_restriction, rate_plan_restriction, rfc_restriction
→ Merge từ 3 levels:
   - Hotel level (apply to tất cả)
   - Rate plan level  
   - Room product level
→ Priority: MIN restrictions take MAX value, MAX restrictions take MIN value
```

#### 6.4. Check Sellability
```sql
-- Query: daily_room_product_sales_plan_sellability
→ Kiểm tra room product + sales plan combination có sellable không
→ Phải sellable cho TẤT CẢ ngày
```

### 7. **Get Payment Terms & Cancellation Policy**
```sql
-- Query: rate_plan_daily_payment_term, rate_plan_daily_cancellation_policy
→ Tìm strongest (strictest) policy trong date range
```

### 8. **Get Retail Features** (nếu có feature filter)
```sql
-- Query: hotel_retail_feature
→ Để tính matching percentage với preferences của guest
```

### 9. **Build Response** (Main Logic Loop)

```
FOR EACH room product:
  
  ✅ Check availability (must be available ALL dates)
  ✅ Check guest capacity (adults + children fit?)
  ✅ Calculate allocated capacity:
     - allocatedAdults: min(requested, maximumAdult)
     - allocatedExtraAdults: requested - allocatedAdults
     - allocatedChildren: similar logic
  
  ✅ Build assigned room list:
     - If DEDUCT mode: assign specific roomId
     - If ALL mode: assign all rooms in product
  
  ✅ Build room product info:
     - Basic info (id, code, name, space, bedrooms)
     - Images
     - Retail features with matching percentage
     - Standard features
  
  ✅ Build sellable options (for each rate plan):
     FOR EACH rate plan linked to this room product:
       
       ❌ Skip if NOT sellable for all dates
       ❌ Skip if missing pricing data
       
       ✅ Calculate totals:
          - totalBaseAmount = sum(daily base prices)
          - totalTaxAmount = sum(daily taxes)
          - totalGrossAmount = sum(daily gross)
       
       ✅ Build sellable option:
          - Pricing info
          - Payment term & cancellation policy
          - Included services (breakfast, spa, etc.)
          - Restrictions (merged from 3 levels)
     
     ✅ Sort sellable options by price ASC
  
  ✅ Add to results
```

### 10. **Sort Results**
```
IF có featureCodeList (preference search):
   Sort by: matchingPercentage DESC → price ASC
ELSE:
   Sort by: price ASC only
```

---

## Key Tables/Entities

| Table | Purpose |
|-------|---------|
| `hotel` | Property info |
| `rate_plan` | Sales plans (rate plans) |
| `rfc` | Room products |
| `rfc_rate_plan` | Room product ↔ Rate plan mapping |
| `rfc_daily_availability` | Room product inventory by date |
| `room_product_daily_base_price` | Base pricing by date |
| `daily_sales_plan_sellability` | Rate plan sellability by date |
| `daily_room_product_sales_plan_sellability` | Combination sellability |
| `hotel_restriction` | Hotel-level restrictions |
| `rate_plan_restriction` | Rate plan restrictions |
| `rfc_restriction` | Room product restrictions |
| `room_product_included_hotel_extra` | Included services |
| `hotel_retail_feature` | Amenities/features |

---

## Business Rules Quan Trọng

### ✅ Sellability Rules
- Sales plan phải sellable cho **TẤT CẢ** ngày trong range
- Room product phải available cho **TẤT CẢ** ngày  
- Room product + Sales plan combination phải sellable cho **TẤT CẢ** ngày
- Must have pricing data cho **TẤT CẢ** ngày

### ✅ Guest Allocation Logic
```
1. Allocate adults to default capacity first
2. Remaining adults → extra beds
3. Allocate children to remaining default capacity
4. Remaining children → extra beds
5. Must fit within: maximumAdult + extraBedAdult, maximumKid + extraBedKid
```

### ✅ Restriction Merging
```
When merging restrictions from 3 levels:
- MIN restrictions (min stay, min advance): take MAXIMUM value (stricter)
- MAX restrictions (max stay, max advance): take MINIMUM value (stricter)
```

### ✅ Feature Matching
```
matchingPercentage = (matched features / requested features) * 100
- Used for sorting when guest has preferences
- Matched features shown first, unmatched features shown in additional list
```

---

## Performance Optimization

1. **Parallel Async Calls**: 4 data fetches run simultaneously
2. **Early Exit**: Return empty immediately when critical data missing
3. **Map Lookups**: Convert lists to Maps for O(1) lookup in loops
4. **Caching Layer**: Many queries go through caching service

---

## Input Example
```json
{
  "propertyCode": "GV469455",
  "arrival": "2025-10-25",
  "departure": "2025-10-27",
  "roomRequestList": [{"adult": 1, "childrenAgeList": []}],
  "roomId": "uuid", // optional
  "salesPlanIdList": [], // optional filter
  "featureCodeList": [], // optional preferences
  "promoCodeList": null // optional
}
```

## Output Structure
```json
{
  "data": [
    {
      "roomProductList": [{...room product info, features, images}],
      "sellableOptionList": [{...rate plans with pricing}],
      "restrictionList": [{...merged restrictions}],
      "assignedRoomList": [{...physical rooms}]
    }
  ]
}
```

---

## Tóm tắt 1 câu

**API này filter room products có thể bán → check availability & sellability → calculate prices → merge restrictions từ 3 levels → sort by preference/price → return danh sách options để guest chọn.**

